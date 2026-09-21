import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { SmsVerificationProvider } from './sms-verification.provider';
import { OtpChallengeDocument } from './schemas/otp-challenge.schema';
export declare class WhatsAppVerificationProvider implements SmsVerificationProvider {
    private readonly config;
    private readonly otpModel;
    private readonly logger;
    readonly enabled: boolean;
    private readonly token;
    private readonly phoneNumberId;
    private readonly apiVersion;
    private readonly templateName;
    private readonly lang;
    private readonly includeButton;
    private readonly pepper;
    constructor(config: ConfigService, otpModel: Model<OtpChallengeDocument>);
    private hash;
    sendCode(phoneE164: string): Promise<void>;
    private deliver;
    checkCode(phoneE164: string, code: string): Promise<boolean>;
}
