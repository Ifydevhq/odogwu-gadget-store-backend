import { BaseSchema } from '@common/schemas/base-schema';
import { Document, Types } from 'mongoose';
export type AnnouncementDocument = Announcement & Document;
export declare class Announcement extends BaseSchema {
    title: string;
    message: string;
    channels: string[];
    audienceType: string;
    audienceRole?: string;
    audienceUserIds?: Types.ObjectId[];
    imageUrl?: string;
    data?: Record<string, any>;
    scheduleAt?: Date;
    status: string;
    sentAt?: Date;
    counts?: {
        inApp: number;
        push: number;
        email: number;
    };
    createdBy: Types.ObjectId;
}
export declare const AnnouncementSchema: import("mongoose").Schema<Announcement, import("mongoose").Model<Announcement, any, any, any, Document<unknown, any, Announcement> & Announcement & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Announcement, Document<unknown, {}, import("mongoose").FlatRecord<Announcement>> & import("mongoose").FlatRecord<Announcement> & {
    _id: Types.ObjectId;
}>;
