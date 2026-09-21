/**
 * phone-verification/termii-verification.provider.ts
 * ==================================================
 * SmsVerificationProvider implementation using Termii's OTP API (Nigeria-first
 * SMS). Termii MANAGES the code (like Twilio Verify): send returns a `pinId`
 * that we store per phone and pass back on verify.
 *
 * CREDENTIAL-GATED: enabled only when TERMII_API_KEY is set.
 * Env:
 *   TERMII_API_KEY      - required to enable
 *   TERMII_SENDER_ID    - approved sender id / "from" (default 'Odogwu')
 *   TERMII_CHANNEL      - 'generic' | 'dnd' | 'whatsapp' (default 'generic')
 *   TERMII_BASE_URL     - default 'https://api.ng.termii.com'
 */

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { SmsVerificationProvider } from './sms-verification.provider';
import {
  OtpChallenge,
  OtpChallengeDocument,
} from './schemas/otp-challenge.schema';

const PIN_TTL_MIN = 10;

@Injectable()
export class TermiiVerificationProvider implements SmsVerificationProvider {
  private readonly logger = new Logger(TermiiVerificationProvider.name);

  public readonly enabled: boolean;
  private readonly apiKey: string | null;
  private readonly senderId: string;
  private readonly channel: string;
  private readonly baseUrl: string;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(OtpChallenge.name)
    private readonly otpModel: Model<OtpChallengeDocument>,
  ) {
    this.apiKey = this.config.get<string>('TERMII_API_KEY') || null;
    this.senderId = this.config.get<string>('TERMII_SENDER_ID') || 'Odogwu';
    this.channel = this.config.get<string>('TERMII_CHANNEL') || 'generic';
    this.baseUrl =
      this.config.get<string>('TERMII_BASE_URL') || 'https://api.ng.termii.com';
    this.enabled = !!this.apiKey;
    this.logger.log(
      this.enabled
        ? `Phone verification enabled (Termii SMS, channel=${this.channel})`
        : 'Phone verification via Termii disabled: no TERMII_API_KEY',
    );
  }

  /** Termii expects a bare msisdn (country code + number, no '+'). */
  private msisdn(phoneE164: string): string {
    return phoneE164.replace(/^\+/, '');
  }

  async sendCode(phoneE164: string): Promise<void> {
    if (!this.enabled) {
      throw new ServiceUnavailableException(
        'Phone verification is not configured',
      );
    }
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/api/sms/otp/send`,
        {
          api_key: this.apiKey,
          message_type: 'NUMERIC',
          to: this.msisdn(phoneE164),
          from: this.senderId,
          channel: this.channel,
          pin_attempts: 5,
          pin_time_to_live: PIN_TTL_MIN,
          pin_length: 6,
          pin_placeholder: '< 1234 >',
          message_text:
            'Your Odogwu Gadget Store verification code is < 1234 >. It expires in 10 minutes.',
          pin_type: 'NUMERIC',
        },
        { timeout: 15000 },
      );
      const pinId = data?.pinId || data?.pin_id;
      if (!pinId) {
        throw new Error(`Termii returned no pinId: ${JSON.stringify(data)}`);
      }
      await this.otpModel
        .findOneAndUpdate(
          { phoneE164 },
          {
            phoneE164,
            providerRef: String(pinId),
            codeHash: null,
            expiresAt: new Date(Date.now() + PIN_TTL_MIN * 60 * 1000),
            attempts: 0,
          },
          { upsert: true, setDefaultsOnInsert: true },
        )
        .exec();
    } catch (err: any) {
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message;
      this.logger.error(`Termii OTP send failed for ${phoneE164}: ${detail}`);
      throw new ServiceUnavailableException(
        'Could not send the verification code. Please try again.',
      );
    }
  }

  async checkCode(phoneE164: string, code: string): Promise<boolean> {
    if (!this.enabled) return false;
    const challenge = await this.otpModel.findOne({ phoneE164 }).exec();
    if (!challenge || !challenge.providerRef) return false;
    if (challenge.expiresAt.getTime() < Date.now()) {
      await this.otpModel.deleteOne({ _id: challenge._id }).exec();
      return false;
    }
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/api/sms/otp/verify`,
        { api_key: this.apiKey, pin_id: challenge.providerRef, pin: code },
        { timeout: 15000 },
      );
      const verified =
        data?.verified === true ||
        String(data?.verified).toLowerCase() === 'true';
      if (verified) {
        await this.otpModel.deleteOne({ _id: challenge._id }).exec();
        return true;
      }
      return false;
    } catch (err: any) {
      // Wrong/expired pin can surface as a non-2xx — treat as "not verified".
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message;
      this.logger.warn(`Termii verify failed for ${phoneE164}: ${detail}`);
      return false;
    }
  }
}
