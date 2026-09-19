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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../common/decorators/get-user.decorator");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const chat_service_1 = require("./chat.service");
const chat_gateway_1 = require("./chat.gateway");
const chat_dto_1 = require("./dto/chat.dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let ChatController = class ChatController {
    constructor(chatService, chatGateway) {
        this.chatService = chatService;
        this.chatGateway = chatGateway;
    }
    async createOrGetConversation(user, dto) {
        return this.chatService.createOrGetConversation(user.sub, dto);
    }
    async getConversations(user, dto) {
        return this.chatService.getConversations(user.sub, dto.page, dto.perPage);
    }
    async getConversation(user, id) {
        return this.chatService.getConversation(id, user.sub);
    }
    async sendMessage(user, conversationId, dto) {
        const message = await this.chatService.sendMessage(conversationId, user.sub, dto);
        const server = this.chatGateway.server;
        if (server) {
            server.to(`conversation:${conversationId}`).emit('newMessage', {
                message: message.toObject(),
                conversationId,
            });
            const conversation = await this.chatService.getConversation(conversationId, user.sub);
            if (conversation) {
                for (const p of conversation.participants) {
                    const pId = p._id?.toString() || p.toString();
                    if (pId !== user.sub) {
                        const isViewing = this.chatGateway.isUserInRoom(pId, `conversation:${conversationId}`);
                        if (isViewing) {
                            server.to(`user:${pId}`).emit('autoMarkRead', { conversationId });
                        }
                        const unreadCount = await this.chatService.getTotalUnreadCount(pId);
                        server.to(`user:${pId}`).emit('unreadCountUpdate', {
                            conversationId,
                            totalUnread: unreadCount,
                        });
                        server.to(`user:${pId}`).emit('newMessage', {
                            message: message.toObject(),
                            conversationId,
                        });
                    }
                }
            }
        }
        return message;
    }
    async getMessages(user, conversationId, dto) {
        return this.chatService.getMessages(conversationId, user.sub, dto);
    }
    async editMessage(user, messageId, dto) {
        const message = await this.chatService.editMessage(messageId, user.sub, dto.content);
        const server = this.chatGateway.server;
        if (server) {
            server
                .to(`conversation:${message.conversationId.toString()}`)
                .emit('messageEdited', message.toObject());
        }
        return message;
    }
    async deleteMessage(user, messageId) {
        const message = await this.chatService.deleteMessage(messageId, user.sub);
        const server = this.chatGateway.server;
        if (server) {
            server
                .to(`conversation:${message.conversationId.toString()}`)
                .emit('messageDeleted', {
                conversationId: message.conversationId.toString(),
                messageId: message._id.toString(),
            });
        }
        return message;
    }
    async markAsRead(user, conversationId) {
        const result = await this.chatService.markAsRead(conversationId, user.sub);
        const server = this.chatGateway.server;
        if (server) {
            server.to(`conversation:${conversationId}`).emit('messageRead', {
                conversationId,
                readBy: user.sub,
                readAt: new Date(),
            });
            const unreadCount = await this.chatService.getTotalUnreadCount(user.sub);
            server.to(`user:${user.sub}`).emit('unreadCountUpdate', {
                conversationId,
                totalUnread: unreadCount,
            });
        }
        return result;
    }
    async getUnreadCount(user) {
        const count = await this.chatService.getTotalUnreadCount(user.sub);
        return { count };
    }
    async search(user, dto) {
        return this.chatService.searchConversations(user.sub, dto.q);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('conversations'),
    (0, swagger_1.ApiOperation)({ summary: 'Create or get existing conversation' }),
    (0, response_message_decorator_1.ResponseMessage)('Conversation retrieved'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.CreateConversationDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createOrGetConversation", null);
__decorate([
    (0, common_1.Get)('conversations'),
    (0, swagger_1.ApiOperation)({ summary: 'List conversations' }),
    (0, response_message_decorator_1.ResponseMessage)('Conversations retrieved'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a conversation' }),
    (0, response_message_decorator_1.ResponseMessage)('Conversation retrieved'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Post)('conversations/:id/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message (REST fallback)' }),
    (0, response_message_decorator_1.ResponseMessage)('Message sent'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, chat_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('conversations/:id/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get message history' }),
    (0, response_message_decorator_1.ResponseMessage)('Messages retrieved'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, chat_dto_1.QueryMessagesDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Patch)('messages/:messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Edit a message' }),
    (0, response_message_decorator_1.ResponseMessage)('Message edited'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, chat_dto_1.EditMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "editMessage", null);
__decorate([
    (0, common_1.Delete)('messages/:messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a message' }),
    (0, response_message_decorator_1.ResponseMessage)('Message deleted'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Patch)('conversations/:id/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark conversation as read' }),
    (0, response_message_decorator_1.ResponseMessage)('Conversation marked as read'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get total unread message count' }),
    (0, response_message_decorator_1.ResponseMessage)('Unread count retrieved'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search conversations' }),
    (0, response_message_decorator_1.ResponseMessage)('Search results'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.SearchChatDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "search", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('Chat'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        chat_gateway_1.ChatGateway])
], ChatController);
//# sourceMappingURL=chat.controller.js.map