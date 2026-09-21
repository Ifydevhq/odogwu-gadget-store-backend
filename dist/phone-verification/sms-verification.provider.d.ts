export declare const SMS_VERIFICATION_PROVIDER = "SMS_VERIFICATION_PROVIDER";
export interface SmsVerificationProvider {
    readonly enabled: boolean;
    sendCode(phoneE164: string): Promise<void>;
    checkCode(phoneE164: string, code: string): Promise<boolean>;
}
