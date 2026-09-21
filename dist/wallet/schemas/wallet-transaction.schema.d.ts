import { Document, Types } from 'mongoose';
export declare enum WalletTxnDirection {
    Credit = "credit",
    Debit = "debit"
}
export declare enum WalletBucket {
    Promo = "promo",
    Earned = "earned"
}
export declare enum WalletTxnType {
    SignupCredit = "signup_credit",
    ReferralReward = "referral_reward",
    AffiliateCommission = "affiliate_commission",
    PurchaseRedemption = "purchase_redemption",
    PurchaseRefund = "purchase_refund",
    Withdrawal = "withdrawal",
    Reversal = "reversal",
    AdminAdjustment = "admin_adjustment"
}
export declare enum WalletTxnStatus {
    Pending = "pending",
    Available = "available",
    Spent = "spent",
    Reversed = "reversed",
    Cancelled = "cancelled"
}
export type WalletTransactionDocument = WalletTransaction & Document;
export declare class WalletTransaction {
    userId: Types.ObjectId;
    amount: number;
    direction: WalletTxnDirection;
    bucket: WalletBucket;
    type: WalletTxnType;
    status: WalletTxnStatus;
    description: string;
    orderId?: Types.ObjectId;
    refId?: string;
    idempotencyKey?: string;
    availableAt?: Date;
}
export declare const WalletTransactionSchema: import("mongoose").Schema<WalletTransaction, import("mongoose").Model<WalletTransaction, any, any, any, Document<unknown, any, WalletTransaction> & WalletTransaction & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WalletTransaction, Document<unknown, {}, import("mongoose").FlatRecord<WalletTransaction>> & import("mongoose").FlatRecord<WalletTransaction> & {
    _id: Types.ObjectId;
}>;
