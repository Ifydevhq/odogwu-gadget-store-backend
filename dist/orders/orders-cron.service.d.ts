import { Model } from 'mongoose';
import { OrderDocument } from './schemas/order.schema';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { ReferralsService } from '../referrals/referrals.service';
import { AffiliateService } from '../affiliate/affiliate.service';
export declare class OrdersCronService {
    private orderModel;
    private platformSettingsService;
    private referralsService;
    private affiliateService;
    private readonly logger;
    constructor(orderModel: Model<OrderDocument>, platformSettingsService: PlatformSettingsService, referralsService: ReferralsService, affiliateService: AffiliateService);
    autoCompleteDeliveredOrders(): Promise<void>;
}
