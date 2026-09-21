import { Document, Types } from 'mongoose';
export declare enum AffiliateCommissionStatus {
    Pending = "pending",
    Available = "available",
    Reversed = "reversed",
    Cancelled = "cancelled"
}
export type AffiliateCommissionDocument = AffiliateCommission & Document;
export declare class AffiliateCommission {
    affiliateUserId: Types.ObjectId;
    buyerId: Types.ObjectId;
    orderId: Types.ObjectId;
    listingId: Types.ObjectId;
    itemName: string;
    orderNumber: string;
    amount: number;
    commissionPercent: number;
    status: AffiliateCommissionStatus;
    walletTxnId?: Types.ObjectId;
    availableAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AffiliateCommissionSchema: import("mongoose").Schema<AffiliateCommission, import("mongoose").Model<AffiliateCommission, any, any, any, Document<unknown, any, AffiliateCommission> & AffiliateCommission & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AffiliateCommission, Document<unknown, {}, import("mongoose").FlatRecord<AffiliateCommission>> & import("mongoose").FlatRecord<AffiliateCommission> & {
    _id: Types.ObjectId;
}>;
