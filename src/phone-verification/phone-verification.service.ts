/**
 * phone-verification/phone-verification.service.ts
 * =================================================
 * Twilio Verify implementation of the SmsVerificationProvider interface.
 *
 * CREDENTIAL-GATED: on construction it reads the Twilio credentials from the
 * environment. If any are missing it sets `enabled = false` and logs a single
 * warning — it NEVER throws at boot, so the app keeps running (with phone
 * verification simply switched off) in environments where SMS is not set up.
 *
 * Env keys required to enable it:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_VERIFY_SERVICE_SID
 *
 * To swap in another provider (e.g. Termii), implement SmsVerificationProvider
 * and bind it to the SMS_VERIFICATION_PROVIDER token in the module.
 */

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { SmsVerificationProvider } from './sms-verification.provider';

@Injectable()
export class PhoneVerificationService implements SmsVerificationProvider {
  private readonly logger = new Logger(PhoneVerificationService.name);

  public readonly enabled: boolean;
  private readonly client: Twilio | null = null;
  private readonly verifyServiceSid: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = this.configService.get<string>(
      'TWILIO_VERIFY_SERVICE_SID',
    );

    if (!accountSid || !authToken || !verifyServiceSid) {
      this.enabled = false;
      this.logger.warn('Phone verification disabled: no Twilio credentials');
      return;
    }

    this.client = new Twilio(accountSid, authToken);
    this.verifyServiceSid = verifyServiceSid;
    this.enabled = true;
    this.logger.log('Phone verification enabled (Twilio Verify)');
  }

  /**
   * Send an SMS OTP to `phoneE164` via Twilio Verify.
   * Throws ServiceUnavailable when the provider is not configured.
   */
  async sendCode(phoneE164: string): Promise<void> {
    if (!this.enabled || !this.client || !this.verifyServiceSid) {
      throw new ServiceUnavailableException(
        'Phone verification is not configured',
      );
    }

    await this.client.verify.v2
      .services(this.verifyServiceSid)
      .verifications.create({ to: phoneE164, channel: 'sms' });
  }

  /**
   * Check a user-supplied `code` against `phoneE164` via Twilio Verify.
   * Returns true only when Twilio reports status === 'approved'.
   * Returns false when disabled or on any provider error.
   */
  async checkCode(phoneE164: string, code: string): Promise<boolean> {
    if (!this.enabled || !this.client || !this.verifyServiceSid) {
      return false;
    }

    try {
      const check = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({ to: phoneE164, code });
      return check.status === 'approved';
    } catch (error) {
      // A wrong/expired code can surface as a 404 from Twilio — treat as a
      // failed check rather than a crash.
      this.logger.warn(
        `Twilio verificationCheck failed for ${phoneE164}: ${
          (error as Error)?.message ?? error
        }`,
      );
      return false;
    }
  }
}
