import { Document, Types } from 'mongoose';
export declare enum ReferralStatus {
    Pending = "pending",
    Qualified = "qualified",
    Rewarded = "rewarded",
    Void = "void"
}
export type ReferralDocument = Referral & Document;
export declare class Referral {
    referrerId: Types.ObjectId;
    refereeId: Types.ObjectId;
    refereePhoneE164?: string;
    status: ReferralStatus;
    cumulativeQualifyingSpend: number;
    rewardTxnId?: Types.ObjectId;
    qualifiedAt?: Date;
    rewardedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ReferralSchema: import("mongoose").Schema<Referral, import("mongoose").Model<Referral, any, any, any, Document<unknown, any, Referral> & Referral & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Referral, Document<unknown, {}, import("mongoose").FlatRecord<Referral>> & import("mongoose").FlatRecord<Referral> & {
    _id: Types.ObjectId;
}>;
