import { ConfigService } from '@nestjs/config';
import { SmsVerificationProvider } from './sms-verification.provider';
export declare class PhoneVerificationService implements SmsVerificationProvider {
    private readonly configService;
    private readonly logger;
    readonly enabled: boolean;
    private readonly client;
    private readonly verifyServiceSid;
    constructor(configService: ConfigService);
    sendCode(phoneE164: string): Promise<void>;
    checkCode(phoneE164: string, code: string): Promise<boolean>;
}
