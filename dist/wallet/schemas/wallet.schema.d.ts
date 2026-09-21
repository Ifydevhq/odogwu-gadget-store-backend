import { Document, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base-schema';
export type WalletDocument = Wallet & Document;
export declare class Wallet extends BaseSchema {
    userId: Types.ObjectId;
    promoBalance: number;
    earnedBalance: number;
    pendingBalance: number;
}
export declare const WalletSchema: import("mongoose").Schema<Wallet, import("mongoose").Model<Wallet, any, any, any, Document<unknown, any, Wallet> & Wallet & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Wallet, Document<unknown, {}, import("mongoose").FlatRecord<Wallet>> & import("mongoose").FlatRecord<Wallet> & {
    _id: Types.ObjectId;
}>;
