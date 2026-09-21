import { Document, Types } from 'mongoose';
export declare enum WithdrawalStatus {
    Pending = "pending",
    Paid = "paid",
    Rejected = "rejected"
}
export type WithdrawalRequestDocument = WithdrawalRequest & Document;
export declare class WithdrawalRequest {
    userId: Types.ObjectId;
    amount: number;
    status: WithdrawalStatus;
    bankName?: string;
    bankCode?: string;
    accountNumber?: string;
    accountName?: string;
    walletTxnId?: Types.ObjectId;
    adminNote?: string;
    requestedAt: Date;
    processedAt?: Date;
    processedBy?: Types.ObjectId;
}
export declare const WithdrawalRequestSchema: import("mongoose").Schema<WithdrawalRequest, import("mongoose").Model<WithdrawalRequest, any, any, any, Document<unknown, any, WithdrawalRequest> & WithdrawalRequest & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WithdrawalRequest, Document<unknown, {}, import("mongoose").FlatRecord<WithdrawalRequest>> & import("mongoose").FlatRecord<WithdrawalRequest> & {
    _id: Types.ObjectId;
}>;
