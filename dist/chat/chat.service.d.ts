import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateConversationDto, SendMessageDto, QueryMessagesDto } from './dto/chat.dto';
export declare class ChatService {
    private conversationModel;
    private messageModel;
    private readonly logger;
    constructor(conversationModel: Model<ConversationDocument>, messageModel: Model<MessageDocument>);
    private getParticipantDisplayInfo;
    private peerDetails;
    private buildPeer;
    createOrGetConversation(userId: string, dto: CreateConversationDto): Promise<import("mongoose").Document<unknown, {}, ConversationDocument> & Conversation & import("mongoose").Document<any, any, any> & {
        _id: Types.ObjectId;
    }>;
    getConversations(userId: string, page?: number, perPage?: number): Promise<{
        data: any[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    getConversation(conversationId: string, userId: string): Promise<any>;
    sendMessage(conversationId: string, senderId: string, dto: SendMessageDto): Promise<import("mongoose").Document<unknown, {}, MessageDocument> & Message & import("mongoose").Document<any, any, any> & {
        _id: Types.ObjectId;
    }>;
    getMessages(conversationId: string, userId: string, dto: QueryMessagesDto): Promise<{
        data: (import("mongoose").FlattenMaps<MessageDocument> & {
            _id: Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    editMessage(messageId: string, userId: string, content: string): Promise<MessageDocument>;
    deleteMessage(messageId: string, userId: string): Promise<MessageDocument>;
    markAsRead(conversationId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getTotalUnreadCount(userId: string): Promise<number>;
    searchConversations(userId: string, query: string): Promise<(import("mongoose").FlattenMaps<ConversationDocument> & {
        _id: Types.ObjectId;
    })[]>;
}
