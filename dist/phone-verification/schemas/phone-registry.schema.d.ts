import { Document, Types } from 'mongoose';
export type PhoneRegistryDocument = PhoneRegistry & Document;
export declare class PhoneRegistry {
    phoneE164: string;
    firstUserId: Types.ObjectId;
    welcomeGranted: boolean;
    referralRedeemed: boolean;
    createdAt: Date;
}
export declare const PhoneRegistrySchema: import("mongoose").Schema<PhoneRegistry, import("mongoose").Model<PhoneRegistry, any, any, any, Document<unknown, any, PhoneRegistry> & PhoneRegistry & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PhoneRegistry, Document<unknown, {}, import("mongoose").FlatRecord<PhoneRegistry>> & import("mongoose").FlatRecord<PhoneRegistry> & {
    _id: Types.ObjectId;
}>;
