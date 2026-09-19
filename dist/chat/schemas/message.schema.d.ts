import { Document, Types } from 'mongoose';
export type MessageDocument = Message & Document;
export declare class Message {
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    content: string;
    type: string;
    productCard: {
        listingId: Types.ObjectId;
        itemName: string;
        price: number;
        image: string;
        storeName: string;
    } | null;
    readBy: Types.ObjectId[];
    attachments: string[];
    isDeleted: boolean;
    edited: boolean;
    editedAt?: Date;
    replyTo?: {
        messageId: Types.ObjectId;
        content: string;
        senderId: Types.ObjectId;
    } | null;
}
export declare const MessageSchema: import("mongoose").Schema<Message, import("mongoose").Model<Message, any, any, any, Document<unknown, any, Message> & Message & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, Document<unknown, {}, import("mongoose").FlatRecord<Message>> & import("mongoose").FlatRecord<Message> & {
    _id: Types.ObjectId;
}>;
