import { Model } from 'mongoose';
import { OrderDocument } from './schemas/order.schema';
import { StoresService } from '../stores/stores.service';
import { CreatorsService } from '../creators/creators.service';
import { CreateOrderDto, UpdateOrderStatusDto, QueryOrdersDto } from './dto/order.dto';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { ListingsService } from 'src/listings/listings.service';
import { AlertsService } from '../alerts/alerts.service';
import { WalletService } from '../wallet/wallet.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { ReferralsService } from '../referrals/referrals.service';
export declare class OrdersService {
    private orderModel;
    private listingsService;
    private storesService;
    private creatorsService;
    private notificationsService;
    private alertsService;
    private walletService;
    private platformSettingsService;
    private referralsService;
    constructor(orderModel: Model<OrderDocument>, listingsService: ListingsService, storesService: StoresService, creatorsService: CreatorsService, notificationsService: NotificationsService, alertsService: AlertsService, walletService: WalletService, platformSettingsService: PlatformSettingsService, referralsService: ReferralsService);
    private readonly logger;
    computeCreditPlan(buyerId: string, payableKobo: number, capKobo?: number): Promise<{
        promo: number;
        earned: number;
        total: number;
    }>;
    private reserveCreditOnOrder;
    private applyCreditImmediate;
    private settleReservedCredit;
    private reverseOrderCredit;
    private generateOrderNumber;
    private calculateRevenueSplit;
    private notifyOrderCreated;
    create(buyerId: string, createOrderDto: CreateOrderDto): Promise<OrderDocument>;
    createCartOrder(buyerId: string, items: Array<{
        listingId: string;
        storeId: string;
        sellerId: string;
        creatorId: string;
        itemName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        type: string;
        image: string | null;
        commissionRate: number;
    }>, shippingAddress: any, buyerNote?: string, receiptEmail?: string, deliveryFee?: number, notifyBuyer?: boolean, walletCredit?: {
        mode: 'reserve';
        promo: number;
        earned: number;
    } | {
        mode: 'immediate';
        capKobo?: number;
    }): Promise<OrderDocument>;
    createPayOnDeliveryOrder(buyerId: string, items: Parameters<OrdersService['createCartOrder']>[1], shippingAddress: any, buyerNote?: string, receiptEmail?: string, deliveryFee?: number, walletCredit?: {
        apply: boolean;
        capKobo?: number;
    }): Promise<OrderDocument>;
    private dispatchPaymentReceipt;
    private dispatchPayOnDeliveryNotifications;
    confirmPayment(orderId: string, paymentReference: string, paystackReference: string, method?: string): Promise<OrderDocument>;
    findByPaymentReference(reference: string): Promise<OrderDocument>;
    findByIdInternal(orderId: string): Promise<OrderDocument>;
    findById(orderId: string, userId: string): Promise<OrderDocument>;
    updateStatus(orderId: string, updateDto: UpdateOrderStatusDto): Promise<OrderDocument>;
    markDisbursed(orderId: string): Promise<OrderDocument>;
    findBuyerOrders(buyerId: string, queryDto: QueryOrdersDto): Promise<PaginatedResponse<OrderDocument>>;
    findSellerOrders(sellerId: string, queryDto: QueryOrdersDto): Promise<PaginatedResponse<OrderDocument>>;
    findAll(queryDto: QueryOrdersDto): Promise<PaginatedResponse<OrderDocument>>;
    countOrders(filter?: Record<string, any>): Promise<number>;
    calculateRevenue(filter?: Record<string, any>): Promise<{
        totalRevenue: number;
        platformRevenue: number;
        sellerPayouts: number;
    }>;
}
