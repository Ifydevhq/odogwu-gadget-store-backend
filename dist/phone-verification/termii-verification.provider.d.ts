import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { SmsVerificationProvider } from './sms-verification.provider';
import { OtpChallengeDocument } from './schemas/otp-challenge.schema';
export declare class TermiiVerificationProvider implements SmsVerificationProvider {
    private readonly config;
    private readonly otpModel;
    private readonly logger;
    readonly enabled: boolean;
    private readonly apiKey;
    private readonly senderId;
    private readonly channel;
    private readonly baseUrl;
    constructor(config: ConfigService, otpModel: Model<OtpChallengeDocument>);
    private msisdn;
    sendCode(phoneE164: string): Promise<void>;
    checkCode(phoneE164: string, code: string): Promise<boolean>;
}
