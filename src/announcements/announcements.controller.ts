/**
 * announcements/announcements.controller.ts - Admin Broadcast Endpoints
 * ======================================================================
 * All routes are admin-only:
 *   POST   /admin/announcements            -> create + send (or schedule)
 *   GET    /admin/announcements            -> history (paginated)
 *   GET    /admin/announcements/templates  -> standard templates
 *   GET    /admin/announcements/:id        -> one announcement
 *   POST   /admin/announcements/:id/send   -> send a scheduled/draft now
 *   DELETE /admin/announcements/:id        -> cancel a scheduled announcement
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { GetUser, JwtPayload } from '@common/decorators/get-user.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { UserRole } from '@config/contants';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('admin-announcements')
@ApiBearerAuth('JWT-auth')
@Controller('admin/announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create and send (or schedule) an announcement' })
  @ResponseMessage('Announcement created')
  async create(
    @GetUser() user: JwtPayload,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.createAndSend(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List announcements (history)' })
  @ResponseMessage('Announcements retrieved')
  async list(@Query() dto: PaginationDto) {
    return this.announcementsService.list({
      page: dto.page,
      perPage: dto.perPage,
    });
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get standard announcement templates' })
  @ResponseMessage('Templates retrieved')
  getTemplates() {
    return this.announcementsService.getTemplates();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an announcement' })
  @ResponseMessage('Announcement retrieved')
  async getById(@Param('id') id: string) {
    return this.announcementsService.getById(id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send a scheduled/draft announcement now' })
  @ResponseMessage('Announcement sent')
  async sendNow(@Param('id') id: string) {
    return this.announcementsService.sendNow(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a scheduled announcement' })
  @ResponseMessage('Announcement cancelled')
  async cancel(@Param('id') id: string) {
    return this.announcementsService.cancelScheduled(id);
  }
}
