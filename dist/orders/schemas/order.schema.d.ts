import { Document, Types } from 'mongoose';
import { BaseSchema } from '@common/schemas/base-schema';
import { OrderStatus, PaymentStatus } from '@config/contants';
export type OrderDocument = Order & Document;
declare class OrderItem {
    listingId: Types.ObjectId;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    type: string;
    image?: string;
    storeId: Types.ObjectId;
    sellerId: Types.ObjectId;
    creatorId: Types.ObjectId;
    commissionRate: number;
    affiliateCode?: string;
    affiliateUserId?: Types.ObjectId;
    affiliateCommissionPercent?: number;
    affiliateCommissionAmount?: number;
}
declare class ShippingAddress {
    fullName: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode?: string;
}
declare class PaymentInfo {
    method: string;
    reference?: string;
    paystackReference?: string;
    paidAt?: Date;
    status: string;
}
declare class RevenueSplit {
    totalAmount: number;
    platformFee: number;
    sellerPayout: number;
    commissionRate: number;
}
declare class TrackingInfo {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
}
export declare class Order extends BaseSchema {
    orderNumber: string;
    buyerId: Types.ObjectId;
    receiptEmail: string | null;
    sellerId: Types.ObjectId | null;
    creatorId: Types.ObjectId | null;
    storeId: Types.ObjectId | null;
    items: OrderItem[];
    subtotal: number;
    shippingFee: number;
    discount: number;
    totalAmount: number;
    currency: string;
    revenueSplit: RevenueSplit;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    disbursementStatus: string;
    disbursedAt?: Date;
    paymentInfo: PaymentInfo;
    shippingAddress: ShippingAddress;
    trackingInfo: TrackingInfo;
    buyerNote?: string;
    adminNote?: string;
    cancellationReason?: string;
    walletCreditApplied?: number;
    walletCreditBreakdown?: {
        promo: number;
        earned: number;
    };
    walletRedemptionTxnId?: Types.ObjectId;
}
export declare const OrderSchema: import("mongoose").Schema<Order, import("mongoose").Model<Order, any, any, any, Document<unknown, any, Order> & Order & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Order, Document<unknown, {}, import("mongoose").FlatRecord<Order>> & import("mongoose").FlatRecord<Order> & {
    _id: Types.ObjectId;
}>;
export {};
