import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim()),
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  // userId → Set of socket IDs (supports multiple tabs)
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════
  // CONNECTION LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload; // { sub, email, role }
      const userId = payload.sub;

      // Join personal room
      client.join(`user:${userId}`);

      // Track online status
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);

      // Broadcast online status to users who share conversations
      this.broadcastOnlineStatus(userId, true);

      // Send initial unread count on connection
      try {
        const unreadCount = await this.chatService.getTotalUnreadCount(userId);
        client.emit('unreadCountUpdate', { totalUnread: unreadCount });
      } catch (e) {
        // non-critical
      }

      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch (err) {
      this.logger.warn(`Auth failed for socket ${client.id}: ${err.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.user?.sub;
    if (!userId) return;

    // Remove from online tracking
    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
        // Broadcast offline status
        this.broadcastOnlineStatus(userId, false);
      }
    }

    this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // MESSAGE EVENTS
  // ═══════════════════════════════════════════════════════════════════

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; type?: string; productCard?: any; attachments?: string[]; replyTo?: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    try {
      const message = await this.chatService.sendMessage(data.conversationId, userId, {
        content: data.content,
        type: data.type,
        productCard: data.productCard,
        attachments: data.attachments,
        replyTo: data.replyTo,
      });

      // Broadcast to conversation room
      this.server.to(`conversation:${data.conversationId}`).emit('newMessage', {
        message: message.toObject(),
        conversationId: data.conversationId,
      });

      // Also send to participants' personal rooms (for unread count updates)
      const conversation = await this.chatService.getConversation(data.conversationId, userId);
      if (conversation) {
        const conversationRoom = `conversation:${data.conversationId}`;
        for (const p of conversation.participants) {
          const pId = (p as any)._id?.toString() || p.toString();
          if (pId !== userId) {
            // Check if recipient is currently viewing this conversation
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

            // If recipient is viewing this conversation, notify them to mark as read on their end
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
            // Also emit newMessage to personal room in case they're not in the conversation room
            this.server.to(`user:${pId}`).emit('newMessage', {
              message: message.toObject(),
              conversationId: data.conversationId,
            });
          }
        }
      }

      return { success: true, message: message.toObject() };
    } catch (err) {
      this.logger.error(`sendMessage error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    try {
      const message = await this.chatService.editMessage(
        data.messageId,
        userId,
        data.content,
      );

      this.server
        .to(`conversation:${message.conversationId.toString()}`)
        .emit('messageEdited', message.toObject());

      return { success: true, message: message.toObject() };
    } catch (err) {
      this.logger.error(`editMessage error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    try {
      const message = await this.chatService.deleteMessage(
        data.messageId,
        userId,
      );

      this.server
        .to(`conversation:${message.conversationId.toString()}`)
        .emit('messageDeleted', {
          conversationId: message.conversationId.toString(),
          messageId: message._id.toString(),
        });

      return { success: true };
    } catch (err) {
      this.logger.error(`deleteMessage error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    try {
      // Verify user is a participant
      await this.chatService.getConversation(data.conversationId, userId);
      client.join(`conversation:${data.conversationId}`);
      this.logger.log(`User ${userId} joined conversation:${data.conversationId}`);

      // Auto mark as read when joining
      await this.chatService.markAsRead(data.conversationId, userId);
      const unreadCount = await this.chatService.getTotalUnreadCount(userId);
      client.emit('unreadCountUpdate', { conversationId: data.conversationId, totalUnread: unreadCount });
    } catch (err) {
      this.logger.warn(`joinConversation failed: ${err.message}`);
    }
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    await this.chatService.markAsRead(data.conversationId, userId);

    // Notify other participants about read receipt
    this.server.to(`conversation:${data.conversationId}`).emit('messageRead', {
      conversationId: data.conversationId,
      readBy: userId,
      readAt: new Date(),
    });

    // Update sender's unread count
    const unreadCount = await this.chatService.getTotalUnreadCount(userId);
    client.emit('unreadCountUpdate', { conversationId: data.conversationId, totalUnread: unreadCount });
  }

  // ═══════════════════════════════════════════════════════════════════
  // TYPING EVENTS
  // ═══════════════════════════════════════════════════════════════════

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;
    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;
    client.to(`conversation:${data.conversationId}`).emit('userStopTyping', {
      conversationId: data.conversationId,
      userId,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // ONLINE STATUS
  // ═══════════════════════════════════════════════════════════════════

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds: string[] },
  ) {
    const onlineIds = data.userIds.filter((id) => this.onlineUsers.has(id));
    return { onlineUsers: onlineIds };
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId)!.size > 0;
  }

  isUserInRoom(userId: string, room: string): boolean {
    try {
      const userSockets = this.onlineUsers.get(userId);
      if (!userSockets || !this.server) return false;
      // Try both the namespaced sockets and default sockets
      const nsp = (this.server as any).sockets || this.server;
      const allSockets = nsp?.sockets;
      if (!allSockets) return false;
      for (const socketId of userSockets) {
        const socket = allSockets.get(socketId);
        if (socket && socket.rooms?.has(room)) return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  private broadcastOnlineStatus(userId: string, isOnline: boolean) {
    const event = isOnline ? 'userOnline' : 'userOffline';
    // Broadcast to all connected clients (they'll filter by their conversation participants)
    this.server.emit(event, { userId });
  }
}
