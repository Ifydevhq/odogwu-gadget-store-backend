import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { AffiliateCommissionDocument } from './schemas/affiliate-commission.schema';
import { OrderDocument } from '../orders/schemas/order.schema';
import { ListingDocument } from '../listings/schemas/listing.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { WalletService } from '../wallet/wallet.service';
import { PaginationDto } from '../common/dto/pagination.dto';
export interface AffiliateAttribution {
    affiliateCode: string;
    affiliateUserId: Types.ObjectId;
    affiliateCommissionPercent: number;
    affiliateCommissionAmount: number;
}
export declare class AffiliateService {
    private readonly commissionModel;
    private readonly orderModel;
    private readonly listingModel;
    private readonly userModel;
    private readonly platformSettingsService;
    private readonly walletService;
    private readonly configService;
    private readonly logger;
    constructor(commissionModel: Model<AffiliateCommissionDocument>, orderModel: Model<OrderDocument>, listingModel: Model<ListingDocument>, userModel: Model<UserDocument>, platformSettingsService: PlatformSettingsService, walletService: WalletService, configService: ConfigService);
    resolveAttributions(buyerId: string | Types.ObjectId, items: Array<{
        listingId: string | Types.ObjectId;
        totalPrice: number;
    }>, affiliateCodes?: Record<string, string>): Promise<Map<string, AffiliateAttribution>>;
    processOrderCompletion(order: OrderDocument | any): Promise<void>;
    reverseForOrder(orderId: string | Types.ObjectId, reason: string): Promise<void>;
    matureDueCommissions(): Promise<void>;
    join(userId: string): Promise<{
        isAffiliate: boolean;
    }>;
    getSummary(userId: string): Promise<{
        isAffiliate: boolean;
        pendingAmount: number;
        availableAmount: number;
        totalEarned: number;
    }>;
    listCommissions(userId: string, paging: PaginationDto): Promise<{
        items: AffiliateCommissionDocument[];
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    }>;
    getLink(userId: string, listingId: string): Promise<{
        listingId: string;
        affiliateCode: string;
        link: string;
    }>;
    listAffiliateProducts(paging: PaginationDto, search?: string): Promise<{
        items: ListingDocument[];
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    }>;
}
