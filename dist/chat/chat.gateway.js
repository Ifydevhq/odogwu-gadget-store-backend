"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    constructor(jwtService, chatService) {
        this.jwtService = jwtService;
        this.chatService = chatService;
        this.logger = new common_1.Logger(ChatGateway_1.name);
        this.onlineUsers = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.data.user = payload;
            const userId = payload.sub;
            client.join(`user:${userId}`);
            if (!this.onlineUsers.has(userId)) {
                this.onlineUsers.set(userId, new Set());
            }
            this.onlineUsers.get(userId).add(client.id);
            this.broadcastOnlineStatus(userId, true);
            for (const onlineId of this.onlineUsers.keys()) {
                if (onlineId !== userId) {
                    client.emit('userOnline', { userId: onlineId });
                }
            }
            try {
                const unreadCount = await this.chatService.getTotalUnreadCount(userId);
                client.emit('unreadCountUpdate', { totalUnread: unreadCount });
            }
            catch (e) {
            }
            this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
        }
        catch (err) {
            this.logger.warn(`Auth failed for socket ${client.id}: ${err.message}`);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const userId = client.data?.user?.sub;
        if (!userId)
            return;
        const sockets = this.onlineUsers.get(userId);
        if (sockets) {
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.onlineUsers.delete(userId);
                this.broadcastOnlineStatus(userId, false);
            }
        }
        this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
    }
    async handleSendMessage(client, data) {
        const userId = client.data.user?.sub;
        if (!userId)
            return;
        try {
            const message = await this.chatService.sendMessage(data.conversationId, userId, {
                content: data.content,
                type: data.type,
                productCard: data.productCard,
                attachments: data.attachments,
                replyTo: data.replyTo,
            });
            this.server.to(`conversation:${data.conversationId}`).emit('newMessage', {
                message: message.toObject(),
                conversationId: data.conversationId,
            });
            const conversation = await this.chatService.getConversation(data.conversationId, userId);
            if (conversation) {
                const conversationRoom = `conversation:${data.conversationId}`;
                for (const p of conversation.participants) {
                    const pId = p._id?.toString() || p.toString();
                    if (pId !== userId) {
                        const recipientSockets = this.onlineUsers.get(pId);
                        let isViewingConversation = false;
                        if (recipientSockets) {
                            for (const socketId of recipientSockets) {
                                const socket = this.server.sockets.sockets.get(socketId);
                                if (socket && socket.rooms.has(conversationRoom)) {
                                    isViewingConversation = true;
                                    break;
                                }
                            }
                        }
                        if (isViewingConversation) {
                            this.server.to(`user:${pId}`).emit('autoMarkRead', {
                                conversationId: data.conversationId,
                            });
                        }
                        const unreadCount = await this.chatService.getTotalUnreadCount(pId);
                        this.server.to(`user:${pId}`).emit('unreadCountUpdate', {
                            conversationId: data.conversationId,
                            totalUnread: unreadCount,
                        });
                        this.server.to(`user:${pId}`).emit('newMessage', {
                            message: message.toObject(),
                            conversationId: data.conversationId,
                        });
                    }
                }
            }
            return { success: true, message: message.toObject() };
        }
        catch (err) {
            this.logger.error(`sendMessage error: ${err.message}`);
            return { success: false, error: err.message };
        }
    }
    async handleEditMessage(client, data) {
        const userId = client.data.user?.sub;
        if (!userId)
            return;
        try {
            const message = await this.chatService.editMessage(data.messageId, userId, data.content);
            this.server
                .to(`conversation:${message.conversationId.toString()}`)
                .emit('messageEdited', message.toObject());
            return { success: true, message: message.toObject() };
        }
        catch (err) {
            this.logger.error(`editMessage error: ${err.message}`);
            return { success: false, error: err.message };
        }
    }
    async handleDeleteMessage(client, data) {
        const userId = client.data.user?.sub;
        if (!userId)
            return;
        try {
            const message = await this.chatService.deleteMessage(data.messageId, userId);
            this.server
                .to(`conversation:${message.conversationId.toString()}`)
                .emit('messageDeleted', {
                conversationId: message.conversationId.toString(),
                messageId: message._id.toString(),
            });
            return { success: true };
        }
        catch (err) {
            this.logger.error(`deleteMessage error: ${err.message}`);
            return { success: false, error: err.message };
        }
    }
    async handleJoinConversation(client, data) {
        const userId = client.data.user?.sub;
        if (!userId)
            return;
        try {
            await this.chatService.getConversation(data.conversationId, userId);
            client.join(`conversation:${data.conversationId}`);
            this.logger.log(`User ${userId} joined conversation:${data.conversationId}`);
            await this.chatService.markAsRead(data.conversationId, userId);
            const unreadCount = await this.chatService.getTotalUnreadCount(userId);
            client.emit('unreadCountUpdate', { conversationId: data.conversationId, totalUnread: unreadCount });
        }
        catch (err) {
            this.logger.warn(`joinConversation failed: ${err.message}`);
        }
    }
    handleLeaveConversation(client, data) {
        client.leave(`conversation:${data.conversationId}`);
    }
    async handleMarkRead(client, data) {
        const userId = client.data.user?.sub;
        if (!userId)
            return;
        await this.chatService.markAsRead(data.conversationId, userId);
        this.server.to(`conversation:${data.conversationId}`).emit('messageRead', {
            conversationId: data.conversationId,
            readBy: userId,
            readAt: new Date(),
        });
        const unreadCount = await this.chatService.getTotalUnreadCount(userId);
        client.emit('unreadCountUpdate', { conversationId: data.conversationId, totalUnread: unreadCount });
    }
    handleTyping(client, data) {
        const userId = client.data.user?.sub;
        if (!userId)
            return;
        client.to(`conversation:${data.conversationId}`).emit('userTyping', {
            conversationId: data.conversationId,
            userId,
        });
    }
    handleStopTyping(client, data) {
        const userId = client.data.user?.sub;
        if (!userId)
            return;
        client.to(`conversation:${data.conversationId}`).emit('userStopTyping', {
            conversationId: data.conversationId,
            userId,
        });
    }
    handleGetOnlineUsers(client, data) {
        const onlineIds = data.userIds.filter((id) => this.onlineUsers.has(id));
        return { onlineUsers: onlineIds };
    }
    isUserOnline(userId) {
        return this.onlineUsers.has(userId) && this.onlineUsers.get(userId).size > 0;
    }
    isUserInRoom(userId, room) {
        try {
            const userSockets = this.onlineUsers.get(userId);
            if (!userSockets || !this.server)
                return false;
            const nsp = this.server.sockets || this.server;
            const allSockets = nsp?.sockets;
            if (!allSockets)
                return false;
            for (const socketId of userSockets) {
                const socket = allSockets.get(socketId);
                if (socket && socket.rooms?.has(room))
                    return true;
            }
        }
        catch {
            return false;
        }
        return false;
    }
    broadcastOnlineStatus(userId, isOnline) {
        const event = isOnline ? 'userOnline' : 'userOffline';
        this.server.emit(event, { userId });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('editMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleEditMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('deleteMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinConversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveConversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stopTyping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleStopTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getOnlineUsers'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleGetOnlineUsers", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim()),
            credentials: true,
        },
        namespace: '/chat',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map