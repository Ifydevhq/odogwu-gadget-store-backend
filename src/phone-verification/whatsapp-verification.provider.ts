/**
 * phone-verification/whatsapp-verification.provider.ts
 * ====================================================
 * SmsVerificationProvider implementation that delivers the OTP over WhatsApp
 * using the Meta WhatsApp Cloud API (the same credentials used for order
 * alerts). Unlike Twilio Verify, WhatsApp only DELIVERS the message, so this
 * provider generates, stores (hashed) and verifies the code itself.
 *
 * CREDENTIAL-GATED: enabled only when WHATSAPP_CLOUD_TOKEN +
 * WHATSAPP_PHONE_NUMBER_ID are set. Business-initiated messages require an
 * approved template, so it sends an authentication/utility template whose name
 * is WHATSAPP_OTP_TEMPLATE, passing the code as the body parameter (and, for
 * authentication templates, the copy-code/one-tap button parameter).
 *
 * Env:
 *   WHATSAPP_CLOUD_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_VERSION (shared
 *     with order alerts)
 *   WHATSAPP_OTP_TEMPLATE           - approved template name (default 'otp_verification')
 *   WHATSAPP_OTP_LANG              - template language code (default 'en_US')
 *   WHATSAPP_OTP_INCLUDE_BUTTON    - 'false' to omit the button component (default include)
 */

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, timingSafeEqual } from 'crypto';
import axios from 'axios';
import { SmsVerificationProvider } from './sms-verification.provider';
import {
  OtpChallenge,
  OtpChallengeDocument,
} from './schemas/otp-challenge.schema';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

@Injectable()
export class WhatsAppVerificationProvider implements SmsVerificationProvider {
  private readonly logger = new Logger(WhatsAppVerificationProvider.name);

  public readonly enabled: boolean;
  private readonly token: string | null;
  private readonly phoneNumberId: string | null;
  private readonly apiVersion: string;
  private readonly templateName: string;
  private readonly lang: string;
  private readonly includeButton: boolean;
  private readonly pepper: string;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(OtpChallenge.name)
    private readonly otpModel: Model<OtpChallengeDocument>,
  ) {
    this.token = this.config.get<string>('app.whatsapp.cloudToken') || null;
    this.phoneNumberId =
      this.config.get<string>('app.whatsapp.phoneNumberId') || null;
    this.apiVersion =
      this.config.get<string>('app.whatsapp.apiVersion') || 'v21.0';
    this.templateName =
      this.config.get<string>('WHATSAPP_OTP_TEMPLATE') || 'otp_verification';
    this.lang = this.config.get<string>('WHATSAPP_OTP_LANG') || 'en_US';
    this.includeButton =
      (this.config.get<string>('WHATSAPP_OTP_INCLUDE_BUTTON') ?? 'true') !==
      'false';
    this.pepper = this.config.get<string>('JWT_SECRET') || 'otp-pepper';

    this.enabled = !!(this.token && this.phoneNumberId);
    this.logger.log(
      this.enabled
        ? `Phone verification enabled (WhatsApp OTP, template=${this.templateName})`
        : 'Phone verification via WhatsApp disabled: WhatsApp Cloud API not configured',
    );
  }

  private hash(code: string, phoneE164: string): string {
    return createHash('sha256')
      .update(`${code}:${phoneE164}:${this.pepper}`)
      .digest('hex');
  }

  async sendCode(phoneE164: string): Promise<void> {
    if (!this.enabled) {
      throw new ServiceUnavailableException(
        'Phone verification is not configured',
      );
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpModel
      .findOneAndUpdate(
        { phoneE164 },
        {
          phoneE164,
          codeHash: this.hash(code, phoneE164),
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
          attempts: 0,
        },
        { upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
    await this.deliver(phoneE164, code);
  }

  private async deliver(phoneE164: string, code: string): Promise<void> {
    const to = phoneE164.replace(/^\+/, ''); // Cloud API expects no leading '+'
    const components: Record<string, any>[] = [
      { type: 'body', parameters: [{ type: 'text', text: code }] },
    ];
    if (this.includeButton) {
      // Authentication templates carry the code on their one-tap/copy button too.
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: code }],
      });
    }
    try {
      await axios.post(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: this.templateName,
            language: { code: this.lang },
            components,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );
    } catch (err: any) {
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message;
      this.logger.error(`WhatsApp OTP send failed for ${phoneE164}: ${detail}`);
      throw new ServiceUnavailableException(
        'Could not send the verification code. Please try again.',
      );
    }
  }

  async checkCode(phoneE164: string, code: string): Promise<boolean> {
    if (!this.enabled) return false;
    const challenge = await this.otpModel.findOne({ phoneE164 }).exec();
    if (!challenge) return false;

    if (challenge.expiresAt.getTime() < Date.now()) {
      await this.otpModel.deleteOne({ _id: challenge._id }).exec();
      return false;
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      return false;
    }

    const expected = this.hash(code, phoneE164);
    const match =
      expected.length === challenge.codeHash.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(challenge.codeHash));

    if (match) {
      await this.otpModel.deleteOne({ _id: challenge._id }).exec();
      return true;
    }
    await this.otpModel
      .updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } })
      .exec();
    return false;
  }
}
