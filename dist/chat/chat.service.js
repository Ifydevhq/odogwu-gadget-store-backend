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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const conversation_schema_1 = require("./schemas/conversation.schema");
const message_schema_1 = require("./schemas/message.schema");
const push_service_1 = require("../push/push.service");
let ChatService = ChatService_1 = class ChatService {
    constructor(conversationModel, messageModel, pushService) {
        this.conversationModel = conversationModel;
        this.messageModel = messageModel;
        this.pushService = pushService;
        this.logger = new common_1.Logger(ChatService_1.name);
    }
    async getParticipantDisplayInfo(userId, typeHint) {
        const db = this.conversationModel.db;
        const creator = await db.collection('creators').findOne({ userId: new mongoose_2.Types.ObjectId(userId), isDeleted: { $ne: true } }, { projection: { username: 1, businessName: 1, profileImageUrl: 1, _id: 1, isVerified: 1, isSuperVerified: 1 } });
        if (creator) {
            const user = await db.collection('users').findOne({ _id: new mongoose_2.Types.ObjectId(userId) }, { projection: { firstName: 1, lastName: 1, avatar: 1 } });
            const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
            const store = await db.collection('stores').findOne({ userId: new mongoose_2.Types.ObjectId(userId), isDeleted: { $ne: true } }, { projection: { name: 1, logo: 1, _id: 1, isVerified: 1, isSuperVerified: 1 } });
            if (typeHint === 'creator' || !store) {
                return {
                    displayName: fullName || creator.businessName || creator.username || 'Creator',
                    avatar: creator.profileImageUrl,
                    type: 'creator',
                    entityId: creator._id.toString(),
                    username: creator.username,
                    isVerified: creator.isVerified || false,
                    isSuperVerified: creator.isSuperVerified || false,
                };
            }
            if (store) {
                return {
                    displayName: store.name || creator.businessName || 'Store',
                    avatar: store.logo || creator.profileImageUrl,
                    type: 'store',
                    entityId: store._id.toString(),
                    username: creator.username,
                    isVerified: store.isVerified || false,
                    isSuperVerified: store.isSuperVerified || false,
                };
            }
        }
        const user = await db.collection('users').findOne({ _id: new mongoose_2.Types.ObjectId(userId) }, { projection: { firstName: 1, lastName: 1, avatar: 1 } });
        return {
            displayName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User',
            avatar: user?.avatar,
            type: 'user',
        };
    }
    peerDetails(conv, otherId) {
        const pd = conv?.participantDetails;
        if (!pd || !otherId)
            return undefined;
        if (pd instanceof Map)
            return pd.get(otherId);
        if (typeof pd.get === 'function')
            return pd.get(otherId);
        return pd[otherId];
    }
    buildPeer(conv, userId) {
        const parts = conv?.participants || [];
        const other = parts.find((p) => {
            const pid = (p && p._id ? p._id : p)?.toString();
            return pid && pid !== userId;
        });
        if (!other)
            return null;
        const populated = other && other._id ? other : null;
        const otherId = (populated ? populated._id : other).toString();
        const details = this.peerDetails(conv, otherId);
        const personName = populated
            ? `${populated.firstName || ''} ${populated.lastName || ''}`.trim()
            : '';
        const type = (details && details.type) || 'user';
        let name = '';
        let avatar;
        if (type === 'store' || type === 'creator') {
            name =
                (details && details.displayName) ||
                    personName ||
                    (populated && (populated.businessName || populated.username)) ||
                    '';
            avatar =
                (details && details.avatar) ||
                    (populated && (populated.profileImageUrl || populated.avatar));
        }
        else {
            name =
                personName ||
                    (populated && (populated.businessName || populated.username)) ||
                    '';
            avatar =
                (populated && (populated.avatar || populated.profileImageUrl)) ||
                    (details && details.avatar);
        }
        if (!name) {
            const email = populated && populated.email;
            name = email
                ? `Customer - ${String(email).split('@')[0].slice(0, 4)}`
                : 'Customer';
        }
        return {
            id: otherId,
            name,
            avatar: avatar || null,
            type,
            email: (populated && populated.email) || undefined,
            isOnline: false,
        };
    }
    async pushNewMessage(conversation, senderId, dto, conversationId) {
        if (!this.pushService)
            return;
        try {
            const recipientIds = conversation.participants
                .map((p) => p.toString())
                .filter((pid) => pid !== senderId);
            if (!recipientIds.length)
                return;
            const sender = await this.getParticipantDisplayInfo(senderId);
            const isProduct = dto.type === 'product_card' || !!dto.productCard;
            const body = isProduct ? '📦 Sent a product' : dto.content || 'New message';
            await this.pushService.sendToUsers(recipientIds, {
                title: sender.displayName || 'New message',
                body,
                data: {
                    type: 'chat',
                    route: `/chats/${conversationId}`,
                    conversationId,
                },
            });
        }
        catch (err) {
            this.logger.error(`Chat push failed: ${err?.message}`);
        }
    }
    async createOrGetConversation(userId, dto) {
        const participantId = dto.participantId;
        if (userId === participantId) {
            throw new common_1.ForbiddenException('Cannot create conversation with yourself');
        }
        const userObjId = new mongoose_2.Types.ObjectId(userId);
        const participantObjId = new mongoose_2.Types.ObjectId(participantId);
        const contextType = dto.participantType || 'user';
        let conversation = await this.conversationModel
            .findOne({
            participants: { $all: [userObjId, participantObjId], $size: 2 },
            contextType,
            isDeleted: { $ne: true },
        })
            .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
            .exec();
        if (conversation) {
            if (dto.productContext) {
                const priceFormatted = dto.productContext.price
                    ? `₦${(dto.productContext.price / 100).toLocaleString()}`
                    : '';
                const productMsg = `Hi! I'm interested in "${dto.productContext.itemName}"${priceFormatted ? ` — ${priceFormatted}` : ''}`;
                await this.sendMessage(conversation._id.toString(), userId, {
                    content: productMsg,
                    type: 'product',
                    metadata: {
                        listingId: dto.productContext.listingId,
                        itemName: dto.productContext.itemName,
                        price: dto.productContext.price,
                        image: dto.productContext.image,
                    },
                });
                conversation = await this.conversationModel
                    .findById(conversation._id)
                    .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
                    .exec();
            }
            if (dto.initialMessage && !dto.productContext) {
                await this.sendMessage(conversation._id.toString(), userId, {
                    content: dto.initialMessage,
                    type: 'text',
                });
                conversation = await this.conversationModel
                    .findById(conversation._id)
                    .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
                    .exec();
            }
            return conversation;
        }
        const [userInfo, participantInfo] = await Promise.all([
            this.getParticipantDisplayInfo(userId),
            this.getParticipantDisplayInfo(participantId, dto.participantType),
        ]);
        const newConversation = await this.conversationModel.create({
            participants: [userObjId, participantObjId],
            unreadCounts: new Map([[userId, 0], [participantId, 0]]),
            contextType,
            participantDetails: new Map([
                [userId, userInfo],
                [participantId, participantInfo],
            ]),
            productContext: dto.productContext
                ? {
                    listingId: new mongoose_2.Types.ObjectId(dto.productContext.listingId),
                    itemName: dto.productContext.itemName,
                    price: dto.productContext.price,
                    image: dto.productContext.image || '',
                }
                : null,
        });
        if (dto.initialMessage) {
            await this.sendMessage(newConversation._id.toString(), userId, {
                content: dto.initialMessage,
                type: 'text',
            });
        }
        if (dto.productContext) {
            await this.sendMessage(newConversation._id.toString(), userId, {
                content: `Hi! I'm interested in "${dto.productContext.itemName}"`,
                type: 'product_card',
                productCard: {
                    listingId: dto.productContext.listingId,
                    itemName: dto.productContext.itemName,
                    price: dto.productContext.price,
                    image: dto.productContext.image || '',
                },
            });
        }
        return this.conversationModel
            .findById(newConversation._id)
            .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
            .exec();
    }
    async getConversations(userId, page = 1, perPage = 20) {
        const userObjId = new mongoose_2.Types.ObjectId(userId);
        const filter = {
            participants: userObjId,
            isDeleted: { $ne: true },
            lastMessage: { $ne: null },
        };
        const [conversations, total] = await Promise.all([
            this.conversationModel
                .find(filter)
                .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
                .sort({ updatedAt: -1 })
                .skip((page - 1) * perPage)
                .limit(perPage)
                .lean()
                .exec(),
            this.conversationModel.countDocuments(filter).exec(),
        ]);
        const data = conversations.map((c) => ({
            ...c,
            peer: this.buildPeer(c, userId),
        }));
        return {
            data,
            pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
        };
    }
    async getConversation(conversationId, userId) {
        const conversation = await this.conversationModel
            .findById(conversationId)
            .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
            .exec();
        if (!conversation)
            throw new common_1.NotFoundException('Conversation not found');
        const isParticipant = conversation.participants.some((p) => p._id?.toString() === userId || p.toString() === userId);
        if (!isParticipant)
            throw new common_1.ForbiddenException('Not a participant');
        const obj = conversation.toObject();
        obj.peer = this.buildPeer(obj, userId);
        return obj;
    }
    async sendMessage(conversationId, senderId, dto) {
        const conversation = await this.conversationModel.findById(conversationId).exec();
        if (!conversation)
            throw new common_1.NotFoundException('Conversation not found');
        const isParticipant = conversation.participants.some((p) => p.toString() === senderId);
        if (!isParticipant)
            throw new common_1.ForbiddenException('Not a participant');
        let replySnapshot = null;
        if (dto.replyTo) {
            const original = await this.messageModel.findById(dto.replyTo).exec();
            if (original) {
                replySnapshot = {
                    messageId: original._id,
                    content: original.content,
                    senderId: original.senderId,
                };
            }
        }
        const message = await this.messageModel.create({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            senderId: new mongoose_2.Types.ObjectId(senderId),
            content: dto.content,
            type: dto.type || 'text',
            productCard: dto.productCard
                ? {
                    listingId: new mongoose_2.Types.ObjectId(dto.productCard.listingId),
                    itemName: dto.productCard.itemName,
                    price: dto.productCard.price,
                    image: dto.productCard.image || '',
                    storeName: dto.productCard.storeName || '',
                }
                : null,
            attachments: dto.attachments || [],
            readBy: [new mongoose_2.Types.ObjectId(senderId)],
            replyTo: replySnapshot,
        });
        const otherParticipants = conversation.participants.filter((p) => p.toString() !== senderId);
        const unreadUpdates = {};
        for (const p of otherParticipants) {
            unreadUpdates[`unreadCounts.${p.toString()}`] = 1;
        }
        await this.conversationModel.findByIdAndUpdate(conversationId, {
            lastMessage: {
                content: dto.content,
                senderId: new mongoose_2.Types.ObjectId(senderId),
                type: dto.type || 'text',
                createdAt: new Date(),
            },
            $inc: unreadUpdates,
        }).exec();
        void this.pushNewMessage(conversation, senderId, dto, conversationId);
        return message;
    }
    async getMessages(conversationId, userId, dto) {
        const conversation = await this.conversationModel.findById(conversationId).exec();
        if (!conversation)
            throw new common_1.NotFoundException('Conversation not found');
        const isParticipant = conversation.participants.some((p) => p.toString() === userId);
        if (!isParticipant)
            throw new common_1.ForbiddenException('Not a participant');
        const { page = 1, perPage = 50, before } = dto;
        const filter = {
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            isDeleted: { $ne: true },
        };
        if (before) {
            filter.createdAt = { $lt: new Date(before) };
        }
        const [messages, total] = await Promise.all([
            this.messageModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * perPage)
                .limit(perPage)
                .lean()
                .exec(),
            this.messageModel.countDocuments(filter).exec(),
        ]);
        return {
            data: messages.reverse(),
            pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
        };
    }
    async editMessage(messageId, userId, content) {
        const message = await this.messageModel.findById(messageId).exec();
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        if (message.senderId.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own messages');
        }
        if (message.isDeleted) {
            throw new common_1.ForbiddenException('Cannot edit a deleted message');
        }
        message.content = content;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();
        return message;
    }
    async deleteMessage(messageId, userId) {
        const message = await this.messageModel.findById(messageId).exec();
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        if (message.senderId.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own messages');
        }
        message.isDeleted = true;
        message.content = '';
        await message.save();
        return message;
    }
    async markAsRead(conversationId, userId) {
        const userObjId = new mongoose_2.Types.ObjectId(userId);
        await this.messageModel.updateMany({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            senderId: { $ne: userObjId },
            readBy: { $ne: userObjId },
        }, { $addToSet: { readBy: userObjId } }).exec();
        await this.conversationModel.findByIdAndUpdate(conversationId, { $set: { [`unreadCounts.${userId}`]: 0 } }, { timestamps: false }).exec();
        return { success: true };
    }
    async getTotalUnreadCount(userId) {
        const conversations = await this.conversationModel
            .find({
            participants: new mongoose_2.Types.ObjectId(userId),
            isDeleted: { $ne: true },
        })
            .select('unreadCounts')
            .lean()
            .exec();
        let total = 0;
        for (const conv of conversations) {
            const counts = conv.unreadCounts;
            total += counts?.[userId] || counts?.get?.(userId) || 0;
        }
        return total;
    }
    async searchConversations(userId, query) {
        if (!query || query.trim().length < 2)
            return [];
        const userObjId = new mongoose_2.Types.ObjectId(userId);
        const conversations = await this.conversationModel
            .find({
            participants: userObjId,
            isDeleted: { $ne: true },
        })
            .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean()
            .exec();
        const q = query.toLowerCase();
        return conversations.filter((conv) => conv.participants.some((p) => p._id.toString() !== userId &&
            (`${p.firstName || ''} ${p.lastName || ''}`).toLowerCase().includes(q)));
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(conversation_schema_1.Conversation.name)),
    __param(1, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        push_service_1.PushService])
], ChatService);
//# sourceMappingURL=chat.service.js.map