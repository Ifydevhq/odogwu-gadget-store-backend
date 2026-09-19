import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly chatService;
    server: Server;
    private readonly logger;
    private onlineUsers;
    constructor(jwtService: JwtService, chatService: ChatService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleSendMessage(client: Socket, data: {
        conversationId: string;
        content: string;
        type?: string;
        productCard?: any;
        attachments?: string[];
        replyTo?: string;
    }): Promise<{
        success: boolean;
        message: import("./schemas/message.schema").Message & import("mongoose").Document<any, any, any> & {
            _id: import("mongoose").Types.ObjectId;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleEditMessage(client: Socket, data: {
        messageId: string;
        content: string;
    }): Promise<{
        success: boolean;
        message: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleDeleteMessage(client: Socket, data: {
        messageId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleJoinConversation(client: Socket, data: {
        conversationId: string;
    }): Promise<void>;
    handleLeaveConversation(client: Socket, data: {
        conversationId: string;
    }): void;
    handleMarkRead(client: Socket, data: {
        conversationId: string;
    }): Promise<void>;
    handleTyping(client: Socket, data: {
        conversationId: string;
    }): void;
    handleStopTyping(client: Socket, data: {
        conversationId: string;
    }): void;
    handleGetOnlineUsers(client: Socket, data: {
        userIds: string[];
    }): {
        onlineUsers: string[];
    };
    isUserOnline(userId: string): boolean;
    isUserInRoom(userId: string, room: string): boolean;
    private broadcastOnlineStatus;
}
