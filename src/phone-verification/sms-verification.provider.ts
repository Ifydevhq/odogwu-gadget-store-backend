/**
 * phone-verification/sms-verification.provider.ts
 * ================================================
 * Small abstraction over an SMS OTP provider so the concrete backend
 * (Twilio Verify today, Termii/others tomorrow) can be swapped without
 * touching the callers.
 *
 * A provider is responsible ONLY for sending a code to a phone and checking a
 * code against a phone. It knows nothing about users, wallets or rewards.
 */

export const SMS_VERIFICATION_PROVIDER = 'SMS_VERIFICATION_PROVIDER';

export interface SmsVerificationProvider {
  /** Whether the provider is configured and able to send/check codes. */
  readonly enabled: boolean;

  /**
   * Send an OTP to the given E.164 phone number via SMS.
   * Throws ServiceUnavailableException when the provider is not configured.
   */
  sendCode(phoneE164: string): Promise<void>;

  /**
   * Verify a user-supplied code against the given E.164 phone number.
   * Returns false (never throws) when the provider is not configured.
   */
  checkCode(phoneE164: string, code: string): Promise<boolean>;
}
