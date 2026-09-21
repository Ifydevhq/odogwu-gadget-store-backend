import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { ReferralDocument, ReferralStatus } from './schemas/referral.schema';
import { PhoneRegistryDocument } from '../phone-verification/schemas/phone-registry.schema';
import { OrderDocument } from '../orders/schemas/order.schema';
import { UsersService } from '../users/users.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { WalletService } from '../wallet/wallet.service';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class ReferralsService {
    private readonly referralModel;
    private readonly phoneRegistryModel;
    private readonly orderModel;
    private readonly usersService;
    private readonly platformSettingsService;
    private readonly walletService;
    private readonly configService;
    private readonly logger;
    constructor(referralModel: Model<ReferralDocument>, phoneRegistryModel: Model<PhoneRegistryDocument>, orderModel: Model<OrderDocument>, usersService: UsersService, platformSettingsService: PlatformSettingsService, walletService: WalletService, configService: ConfigService);
    registerReferral(referrerId: string | Types.ObjectId, refereeId: string | Types.ObjectId): Promise<ReferralDocument | null>;
    activateOnPhoneVerified(refereeId: string | Types.ObjectId, phoneE164: string): Promise<void>;
    recordCompletedOrder(refereeId: string | Types.ObjectId, _orderAmount?: number): Promise<void>;
    private buildReferralLink;
    getMyReferralSummary(userId: string): Promise<{
        referralCode: string;
        referralLink: string;
        totalReferred: number;
        totalQualified: number;
        totalRewardedAmount: number;
    }>;
    listMyReferrals(userId: string, paging: PaginationDto): Promise<{
        items: Array<{
            id: string;
            name: string;
            status: ReferralStatus;
            cumulativeQualifyingSpend: number;
            qualifiedAt?: Date;
            rewardedAt?: Date;
            createdAt: Date;
        }>;
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    }>;
    private maskName;
}
