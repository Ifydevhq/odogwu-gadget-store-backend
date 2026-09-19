/**
 * announcements/announcements.module.ts - Announcements Module
 * =============================================================
 * Admin broadcast system (in-app + push + email, now or scheduled).
 *
 * AlertsService, PushService and NotificationsService are all provided by
 * GLOBAL modules, so we only need to register our own schemas + the User
 * schema (for audience resolution).
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import {
  Announcement,
  AnnouncementSchema,
} from './schemas/announcement.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Announcement.name, schema: AnnouncementSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
