import { JwtPayload } from '@common/decorators/get-user.decorator';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateConversationDto, SendMessageDto, EditMessageDto, QueryMessagesDto, SearchChatDto } from './dto/chat.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class ChatController {
    private readonly chatService;
    private readonly chatGateway;
    constructor(chatService: ChatService, chatGateway: ChatGateway);
    createOrGetConversation(user: JwtPayload, dto: CreateConversationDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/conversation.schema").ConversationDocument> & import("./schemas/conversation.schema").Conversation & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    getConversations(user: JwtPayload, dto: PaginationDto): Promise<{
        data: (import("mongoose").FlattenMaps<import("./schemas/conversation.schema").ConversationDocument> & {
            _id: import("mongoose").Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    getConversation(user: JwtPayload, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/conversation.schema").ConversationDocument> & import("./schemas/conversation.schema").Conversation & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    sendMessage(user: JwtPayload, conversationId: string, dto: SendMessageDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/message.schema").MessageDocument> & import("./schemas/message.schema").Message & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    getMessages(user: JwtPayload, conversationId: string, dto: QueryMessagesDto): Promise<{
        data: (import("mongoose").FlattenMaps<import("./schemas/message.schema").MessageDocument> & {
            _id: import("mongoose").Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    editMessage(user: JwtPayload, messageId: string, dto: EditMessageDto): Promise<import("./schemas/message.schema").MessageDocument>;
    deleteMessage(user: JwtPayload, messageId: string): Promise<import("./schemas/message.schema").MessageDocument>;
    markAsRead(user: JwtPayload, conversationId: string): Promise<{
        success: boolean;
    }>;
    getUnreadCount(user: JwtPayload): Promise<{
        count: number;
    }>;
    search(user: JwtPayload, dto: SearchChatDto): Promise<(import("mongoose").FlattenMaps<import("./schemas/conversation.schema").ConversationDocument> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
}
