import { Model } from 'mongoose';
import { OrderDocument } from './schemas/order.schema';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { ReferralsService } from '../referrals/referrals.service';
export declare class OrdersCronService {
    private orderModel;
    private platformSettingsService;
    private referralsService;
    private readonly logger;
    constructor(orderModel: Model<OrderDocument>, platformSettingsService: PlatformSettingsService, referralsService: ReferralsService);
    autoCompleteDeliveredOrders(): Promise<void>;
}
