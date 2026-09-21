import { Document, Types } from 'mongoose';
export type CheckoutSessionDocument = CheckoutSession & Document;
declare class SessionItem {
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
}
declare class SessionShippingAddress {
    fullName: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode?: string;
}
export declare class CheckoutSession {
    buyerId: Types.ObjectId;
    email: string;
    items: SessionItem[];
    shippingAddress: SessionShippingAddress;
    buyerNote?: string;
    grandTotal: number;
    deliveryFee: number;
    currency: string;
    walletCreditApplied: number;
    walletCreditBreakdown?: {
        promo: number;
        earned: number;
    };
    paymentMethod: string;
    paymentReference: string;
    status: string;
    orderIds: string[];
    expiresAt: Date;
}
export declare const CheckoutSessionSchema: import("mongoose").Schema<CheckoutSession, import("mongoose").Model<CheckoutSession, any, any, any, Document<unknown, any, CheckoutSession> & CheckoutSession & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CheckoutSession, Document<unknown, {}, import("mongoose").FlatRecord<CheckoutSession>> & import("mongoose").FlatRecord<CheckoutSession> & {
    _id: Types.ObjectId;
}>;
export {};
