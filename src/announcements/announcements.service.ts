/**
 * announcements/announcements.service.ts - Broadcast System
 * ===========================================================
 * Sends admin announcements across in-app, push, and email channels,
 * either immediately or scheduled, with audience targeting.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import {
  Announcement,
  AnnouncementDocument,
} from './schemas/announcement.schema';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AlertsService } from '../alerts/alerts.service';
import { PushService } from '../push/push.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AlertType } from '../config/contants';
import { ANNOUNCEMENT_TEMPLATES } from './announcement-templates';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly alertsService: AlertsService,
    private readonly pushService: PushService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // AUDIENCE RESOLUTION
  // ═══════════════════════════════════════════════════════════

  /** Resolves an announcement's audience to a list of user id strings. */
  async resolveAudienceUserIds(dto: {
    audienceType: string;
    audienceRole?: string;
    audienceUserIds?: (string | Types.ObjectId)[];
  }): Promise<string[]> {
    if (dto.audienceType === 'users') {
      return (dto.audienceUserIds || []).map((id) => String(id));
    }

    const filter: Record<string, any> = {
      isSuspended: { $ne: true },
      isDeleted: { $ne: true },
    };
    if (dto.audienceType === 'role' && dto.audienceRole) {
      filter.role = dto.audienceRole;
    }

    const users = await this.userModel.find(filter).select('_id').lean().exec();
    return users.map((u) => String((u as any)._id));
  }

  // ═══════════════════════════════════════════════════════════
  // DISPATCH
  // ═══════════════════════════════════════════════════════════

  /** Delivers an announcement across all of its configured channels. */
  async dispatch(doc: AnnouncementDocument): Promise<AnnouncementDocument> {
    const counts = { inApp: 0, push: 0, email: 0 };

    try {
      const userIds = await this.resolveAudienceUserIds({
        audienceType: doc.audienceType,
        audienceRole: doc.audienceRole,
        audienceUserIds: doc.audienceUserIds,
      });

      const announcementId = doc._id.toString();

      // ── In-app alerts ──────────────────────────────────────
      if (doc.channels.includes('in_app') && userIds.length > 0) {
        try {
          await this.alertsService.createBulkAlerts(userIds, {
            type: AlertType.SystemAnnouncement,
            title: doc.title,
            message: doc.message,
            entityType: 'user',
            entityId: announcementId,
            metadata: { announcementId, ...(doc.data || {}) },
          });
          counts.inApp = userIds.length;
        } catch (err) {
          this.logger.error(`In-app dispatch failed: ${err.message}`);
        }
      }

      // ── Push notifications ─────────────────────────────────
      if (doc.channels.includes('push') && userIds.length > 0) {
        try {
          const stringData: Record<string, string> = { announcementId };
          for (const [k, v] of Object.entries(doc.data || {})) {
            stringData[k] = String(v);
          }
          const res = await this.pushService.sendToUsers(userIds, {
            title: doc.title,
            body: doc.message,
            data: stringData,
            imageUrl: doc.imageUrl || undefined,
          });
          counts.push = res.successCount;
        } catch (err) {
          this.logger.error(`Push dispatch failed: ${err.message}`);
        }
      }

      // ── Email ──────────────────────────────────────────────
      if (doc.channels.includes('email') && userIds.length > 0) {
        try {
          const users = await this.userModel
            .find({ _id: { $in: userIds } })
            .select('email firstName')
            .lean()
            .exec();
          const recipients = users
            .filter((u) => (u as any).email)
            .map((u) => ({
              email: (u as any).email as string,
              name: (u as any).firstName as string,
            }));
          const res = await this.notificationsService.sendBroadcastEmail(
            recipients,
            {
              subject: doc.title,
              heading: doc.title,
              body: doc.message,
              imageUrl: doc.imageUrl || undefined,
              ctaText: doc.data?.route ? 'Open' : undefined,
              ctaUrl: doc.data?.route
                ? `${process.env.FRONTEND_URL || ''}${doc.data.route}`
                : undefined,
            },
          );
          counts.email = res.sent;
        } catch (err) {
          this.logger.error(`Email dispatch failed: ${err.message}`);
        }
      }

      doc.counts = counts;
      doc.status = 'sent';
      doc.sentAt = new Date();
      await doc.save();
    } catch (err) {
      this.logger.error(`Announcement dispatch failed: ${err.message}`);
      doc.status = 'failed';
      await doc.save().catch(() => {});
    }

    return doc;
  }

  // ═══════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════

  async createAndSend(
    dto: CreateAnnouncementDto,
    adminUserId: string,
  ): Promise<AnnouncementDocument> {
    const scheduleAt = dto.scheduleAt ? new Date(dto.scheduleAt) : null;
    const isFuture = scheduleAt && scheduleAt.getTime() > Date.now();

    const doc = await this.announcementModel.create({
      title: dto.title,
      message: dto.message,
      channels: dto.channels,
      audienceType: dto.audienceType,
      audienceRole: dto.audienceRole || null,
      audienceUserIds: (dto.audienceUserIds || []).map(
        (id) => new Types.ObjectId(id),
      ),
      imageUrl: dto.imageUrl || null,
      data: dto.data || null,
      scheduleAt: scheduleAt,
      status: isFuture ? 'scheduled' : 'sending',
      createdBy: new Types.ObjectId(adminUserId),
    });

    if (isFuture) {
      return doc;
    }

    return this.dispatch(doc);
  }

  /** Sends a scheduled (or otherwise not-yet-sent) announcement now. */
  async sendNow(id: string): Promise<AnnouncementDocument> {
    const doc = await this.announcementModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Announcement not found');
    if (doc.status === 'sent') return doc;

    doc.status = 'sending';
    await doc.save();
    return this.dispatch(doc);
  }

  // ═══════════════════════════════════════════════════════════
  // SCHEDULED PROCESSING (cron)
  // ═══════════════════════════════════════════════════════════

  @Cron('0 * * * * *') // every minute
  async processScheduled(): Promise<void> {
    const now = new Date();
    const due = await this.announcementModel
      .find({ status: 'scheduled', scheduleAt: { $lte: now } })
      .exec();

    if (due.length === 0) return;
    this.logger.log(`Processing ${due.length} scheduled announcement(s)`);

    for (const doc of due) {
      doc.status = 'sending';
      await doc.save();
      await this.dispatch(doc);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // READ / HISTORY
  // ═══════════════════════════════════════════════════════════

  async list(query: { page?: number; perPage?: number }) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.perPage) || 20;

    const [data, total] = await Promise.all([
      this.announcementModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean()
        .exec(),
      this.announcementModel.countDocuments().exec(),
    ]);

    return {
      data,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async getById(id: string): Promise<AnnouncementDocument> {
    const doc = await this.announcementModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Announcement not found');
    return doc;
  }

  async cancelScheduled(id: string): Promise<AnnouncementDocument> {
    const doc = await this.announcementModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Announcement not found');
    if (doc.status !== 'scheduled') {
      // Only scheduled announcements can be cancelled.
      return doc;
    }
    doc.status = 'cancelled';
    await doc.save();
    return doc;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════

  getTemplates() {
    return ANNOUNCEMENT_TEMPLATES;
  }
}
