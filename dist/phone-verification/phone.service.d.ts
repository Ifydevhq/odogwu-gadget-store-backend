import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { WalletService } from '../wallet/wallet.service';
import { PhoneRegistryDocument } from './schemas/phone-registry.schema';
import { SmsVerificationProvider } from './sms-verification.provider';
export declare class PhoneService {
    private readonly smsProvider;
    private readonly phoneRegistryModel;
    private readonly usersService;
    private readonly platformSettingsService;
    private readonly walletService;
    private readonly logger;
    constructor(smsProvider: SmsVerificationProvider, phoneRegistryModel: Model<PhoneRegistryDocument>, usersService: UsersService, platformSettingsService: PlatformSettingsService, walletService: WalletService);
    requestOtp(userId: string, rawPhoneNumber: string): Promise<{
        sent: true;
    }>;
    verifyOtp(userId: string, rawPhoneNumber: string, code: string): Promise<{
        verified: true;
        welcomeGranted: boolean;
    }>;
    private maybeGrantWelcomeCredit;
}
