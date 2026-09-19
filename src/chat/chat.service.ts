import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateConversationDto, SendMessageDto, QueryMessagesDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  // Look up display info for a user (checks creator and store profiles)
  // typeHint: if provided, prefer that type (e.g., user clicked "creator" vs "store")
  private async getParticipantDisplayInfo(userId: string, typeHint?: 'creator' | 'store'): Promise<{
    displayName: string;
    avatar?: string;
    type: 'user' | 'creator' | 'store';
    entityId?: string;
    username?: string;
    isVerified?: boolean;
    isSuperVerified?: boolean;
  }> {
    const db = this.conversationModel.db;

    // Check if they have a creator profile
    const creator = await db.collection('creators').findOne(
      { userId: new Types.ObjectId(userId), isDeleted: { $ne: true } },
      { projection: { username: 1, businessName: 1, profileImageUrl: 1, _id: 1, isVerified: 1, isSuperVerified: 1 } },
    );

    if (creator) {
      // Fetch user's real name for creator display
      const user = await db.collection('users').findOne(
        { _id: new Types.ObjectId(userId) },
        { projection: { firstName: 1, lastName: 1, avatar: 1 } },
      );
      const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

      // Check if they have a store
      const store = await db.collection('stores').findOne(
        { userId: new Types.ObjectId(userId), isDeleted: { $ne: true } },
        { projection: { name: 1, logo: 1, _id: 1, isVerified: 1, isSuperVerified: 1 } },
      );

      // If typeHint is 'creator' or no store exists, return creator info
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

      // If typeHint is 'store' or default when store exists
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

    // Fallback to user info
    const user = await db.collection('users').findOne(
      { _id: new Types.ObjectId(userId) },
      { projection: { firstName: 1, lastName: 1, avatar: 1 } },
    );

    return {
      displayName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User',
      avatar: user?.avatar,
      type: 'user',
    };
  }

  // Read a participant's denormalized display info regardless of whether the
  // conversation is a lean object (plain map) or a hydrated document (Map).
  private peerDetails(conv: any, otherId?: string): any {
    const pd = conv?.participantDetails;
    if (!pd || !otherId) return undefined;
    if (pd instanceof Map) return pd.get(otherId);
    if (typeof pd.get === 'function') return pd.get(otherId);
    return pd[otherId];
  }

  // Compute the "other side" of a conversation relative to the requesting user,
  // resolving a good display name/avatar. This is what the clients render, so
  // the store side shows the store (name + logo) and the customer side shows the
  // customer's name — or, when they never set one, `Customer - <email prefix>`.
  private buildPeer(conv: any, userId: string) {
    const parts: any[] = conv?.participants || [];
    const other = parts.find((p: any) => {
      const pid = (p && p._id ? p._id : p)?.toString();
      return pid && pid !== userId;
    });
    if (!other) return null;

    const populated = other && other._id ? other : null;
    const otherId = (populated ? populated._id : other).toString();
    const details = this.peerDetails(conv, otherId);
    const personName = populated
      ? `${populated.firstName || ''} ${populated.lastName || ''}`.trim()
      : '';
    const type: string = (details && details.type) || 'user';

    let name = '';
    let avatar: string | undefined;
    if (type === 'store' || type === 'creator') {
      name =
        (details && details.displayName) ||
        personName ||
        (populated && (populated.businessName || populated.username)) ||
        '';
      avatar =
        (details && details.avatar) ||
        (populated && (populated.profileImageUrl || populated.avatar));
    } else {
      name =
        personName ||
        (populated && (populated.businessName || populated.username)) ||
        '';
      avatar =
        (populated && (populated.avatar || populated.profileImageUrl)) ||
        (details && details.avatar);
    }

    if (!name) {
      const email: string | undefined = populated && populated.email;
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

  // ═══════════════════════════════════════════════════════════════════
  // CONVERSATIONS
  // ═══════════════════════════════════════════════════════════════════

  async createOrGetConversation(userId: string, dto: CreateConversationDto) {
    const participantId = dto.participantId;
    if (userId === participantId) {
      throw new ForbiddenException('Cannot create conversation with yourself');
    }

    const userObjId = new Types.ObjectId(userId);
    const participantObjId = new Types.ObjectId(participantId);

    // Determine context type for this conversation
    const contextType = dto.participantType || 'user';

    // Check if conversation already exists between these two users with same context
    let conversation = await this.conversationModel
      .findOne({
        participants: { $all: [userObjId, participantObjId], $size: 2 },
        contextType,
        isDeleted: { $ne: true },
      })
      .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
      .exec();

    if (conversation) {
      // Always send product interest message when productContext is provided
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
        // Re-fetch to get updated lastMessage
        conversation = await this.conversationModel
          .findById(conversation._id)
          .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
          .exec();
      }

      // Send initial message if provided (separate from product message)
      if (dto.initialMessage && !dto.productContext) {
        await this.sendMessage(conversation._id.toString(), userId, {
          content: dto.initialMessage,
          type: 'text',
        });
        // Re-fetch to get updated lastMessage
        conversation = await this.conversationModel
          .findById(conversation._id)
          .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
          .exec();
      }

      return conversation;
    }

    // Look up display info for both participants
    const [userInfo, participantInfo] = await Promise.all([
      this.getParticipantDisplayInfo(userId),
      this.getParticipantDisplayInfo(participantId, dto.participantType),
    ]);

    // Create new conversation
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
            listingId: new Types.ObjectId(dto.productContext.listingId),
            itemName: dto.productContext.itemName,
            price: dto.productContext.price,
            image: dto.productContext.image || '',
          }
        : null,
    });

    // Send initial message if provided
    if (dto.initialMessage) {
      await this.sendMessage(newConversation._id.toString(), userId, {
        content: dto.initialMessage,
        type: 'text',
      });
    }

    // Send product card message if product context exists
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

  async getConversations(userId: string, page = 1, perPage = 20) {
    const userObjId = new Types.ObjectId(userId);
    const filter = {
      participants: userObjId,
      isDeleted: { $ne: true },
      lastMessage: { $ne: null }, // Only show conversations with messages
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

    const data = conversations.map((c: any) => ({
      ...c,
      peer: this.buildPeer(c, userId),
    }));

    return {
      data,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('participants', 'firstName lastName avatar profileImageUrl username businessName email')
      .exec();

    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some(
      (p: any) => p._id?.toString() === userId || p.toString() === userId,
    );
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const obj: any = conversation.toObject();
    obj.peer = this.buildPeer(obj, userId);
    return obj;
  }

  // ═══════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════

  async sendMessage(conversationId: string, senderId: string, dto: SendMessageDto) {
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderId,
    );
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    // Build denormalized reply snapshot if replying to a message
    let replySnapshot: {
      messageId: Types.ObjectId;
      content: string;
      senderId: Types.ObjectId;
    } | null = null;
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
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      content: dto.content,
      type: dto.type || 'text',
      productCard: dto.productCard
        ? {
            listingId: new Types.ObjectId(dto.productCard.listingId),
            itemName: dto.productCard.itemName,
            price: dto.productCard.price,
            image: dto.productCard.image || '',
            storeName: dto.productCard.storeName || '',
          }
        : null,
      attachments: dto.attachments || [],
      readBy: [new Types.ObjectId(senderId)], // Sender has "read" their own message
      replyTo: replySnapshot,
    });

    // Update conversation: lastMessage + increment unread for other participants
    const otherParticipants = conversation.participants.filter(
      (p) => p.toString() !== senderId,
    );

    const unreadUpdates: Record<string, any> = {};
    for (const p of otherParticipants) {
      unreadUpdates[`unreadCounts.${p.toString()}`] = 1;
    }

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content: dto.content,
        senderId: new Types.ObjectId(senderId),
        type: dto.type || 'text',
        createdAt: new Date(),
      },
      $inc: unreadUpdates,
    }).exec();

    return message;
  }

  async getMessages(conversationId: string, userId: string, dto: QueryMessagesDto) {
    // Verify participant
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId,
    );
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const { page = 1, perPage = 50, before } = dto;
    const filter: Record<string, any> = {
      conversationId: new Types.ObjectId(conversationId),
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
      data: messages.reverse(), // Return in chronological order
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // EDIT & DELETE
  // ═══════════════════════════════════════════════════════════════════

  async editMessage(
    messageId: string,
    userId: string,
    content: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');

    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }
    if (message.isDeleted) {
      throw new ForbiddenException('Cannot edit a deleted message');
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    return message;
  }

  async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');

    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.content = '';
    await message.save();

    return message;
  }

  // ═══════════════════════════════════════════════════════════════════
  // READ RECEIPTS & UNREAD COUNTS
  // ═══════════════════════════════════════════════════════════════════

  async markAsRead(conversationId: string, userId: string) {
    const userObjId = new Types.ObjectId(userId);

    // Mark all unread messages in this conversation as read by this user
    await this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: userObjId },
        readBy: { $ne: userObjId },
      },
      { $addToSet: { readBy: userObjId } },
    ).exec();

    // Reset unread count for this user (don't update updatedAt — that should only change on new messages)
    await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { $set: { [`unreadCounts.${userId}`]: 0 } },
      { timestamps: false },
    ).exec();

    return { success: true };
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    const conversations = await this.conversationModel
      .find({
        participants: new Types.ObjectId(userId),
        isDeleted: { $ne: true },
      })
      .select('unreadCounts')
      .lean()
      .exec();

    let total = 0;
    for (const conv of conversations) {
      const counts = conv.unreadCounts as any;
      total += counts?.[userId] || counts?.get?.(userId) || 0;
    }
    return total;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════

  async searchConversations(userId: string, query: string) {
    if (!query || query.trim().length < 2) return [];

    const userObjId = new Types.ObjectId(userId);

    // Find conversations where participant name matches
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
    return conversations.filter((conv: any) =>
      conv.participants.some(
        (p: any) =>
          p._id.toString() !== userId &&
          (`${p.firstName || ''} ${p.lastName || ''}`).toLowerCase().includes(q),
      ),
    );
  }
}
