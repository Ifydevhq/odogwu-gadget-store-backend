import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser, JwtPayload } from '@common/decorators/get-user.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import {
  CreateConversationDto,
  SendMessageDto,
  EditMessageDto,
  QueryMessagesDto,
  SearchChatDto,
} from './dto/chat.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // ─── Conversations ─────────────────────────────────────────────

  @Post('conversations')
  @ApiOperation({ summary: 'Create or get existing conversation' })
  @ResponseMessage('Conversation retrieved')
  async createOrGetConversation(
    @GetUser() user: JwtPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createOrGetConversation(user.sub, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations' })
  @ResponseMessage('Conversations retrieved')
  async getConversations(
    @GetUser() user: JwtPayload,
    @Query() dto: PaginationDto,
  ) {
    return this.chatService.getConversations(user.sub, dto.page, dto.perPage);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation' })
  @ResponseMessage('Conversation retrieved')
  async getConversation(
    @GetUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.chatService.getConversation(id, user.sub);
  }

  // ─── Messages ──────────────────────────────────────────────────

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message (REST fallback)' })
  @ResponseMessage('Message sent')
  async sendMessage(
    @GetUser() user: JwtPayload,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chatService.sendMessage(conversationId, user.sub, dto);

    // Emit socket events so all participants get real-time updates
    const server = this.chatGateway.server;
    if (server) {
      // Broadcast message to conversation room
      server.to(`conversation:${conversationId}`).emit('newMessage', {
        message: message.toObject(),
        conversationId,
      });

      // Send to each participant's personal room
      const conversation = await this.chatService.getConversation(conversationId, user.sub);
      if (conversation) {
        for (const p of conversation.participants) {
          const pId = (p as any)._id?.toString() || p.toString();
          if (pId !== user.sub) {
            // Check if recipient is viewing this conversation
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

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get message history' })
  @ResponseMessage('Messages retrieved')
  async getMessages(
    @GetUser() user: JwtPayload,
    @Param('id') conversationId: string,
    @Query() dto: QueryMessagesDto,
  ) {
    return this.chatService.getMessages(conversationId, user.sub, dto);
  }

  @Patch('messages/:messageId')
  @ApiOperation({ summary: 'Edit a message' })
  @ResponseMessage('Message edited')
  async editMessage(
    @GetUser() user: JwtPayload,
    @Param('messageId') messageId: string,
    @Body() dto: EditMessageDto,
  ) {
    const message = await this.chatService.editMessage(
      messageId,
      user.sub,
      dto.content,
    );

    // Emit socket event so all participants get real-time updates
    const server = this.chatGateway.server;
    if (server) {
      server
        .to(`conversation:${message.conversationId.toString()}`)
        .emit('messageEdited', message.toObject());
    }

    return message;
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ResponseMessage('Message deleted')
  async deleteMessage(
    @GetUser() user: JwtPayload,
    @Param('messageId') messageId: string,
  ) {
    const message = await this.chatService.deleteMessage(messageId, user.sub);

    // Emit socket event so all participants get real-time updates
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

  // ─── Read Receipts & Unread ────────────────────────────────────

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  @ResponseMessage('Conversation marked as read')
  async markAsRead(
    @GetUser() user: JwtPayload,
    @Param('id') conversationId: string,
  ) {
    const result = await this.chatService.markAsRead(conversationId, user.sub);

    // Emit read receipt and updated unread count via socket
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

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  @ResponseMessage('Unread count retrieved')
  async getUnreadCount(@GetUser() user: JwtPayload) {
    const count = await this.chatService.getTotalUnreadCount(user.sub);
    return { count };
  }

  // ─── Search ────────────────────────────────────────────────────

  @Get('search')
  @ApiOperation({ summary: 'Search conversations' })
  @ResponseMessage('Search results')
  async search(@GetUser() user: JwtPayload, @Query() dto: SearchChatDto) {
    return this.chatService.searchConversations(user.sub, dto.q);
  }
}
