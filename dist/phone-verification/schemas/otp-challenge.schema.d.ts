import { HydratedDocument } from 'mongoose';
export type OtpChallengeDocument = HydratedDocument<OtpChallenge>;
export declare class OtpChallenge {
    phoneE164: string;
    codeHash: string;
    expiresAt: Date;
    attempts: number;
}
export declare const OtpChallengeSchema: import("mongoose").Schema<OtpChallenge, import("mongoose").Model<OtpChallenge, any, any, any, import("mongoose").Document<unknown, any, OtpChallenge> & OtpChallenge & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OtpChallenge, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<OtpChallenge>> & import("mongoose").FlatRecord<OtpChallenge> & {
    _id: import("mongoose").Types.ObjectId;
}>;
