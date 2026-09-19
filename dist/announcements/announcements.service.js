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
var AnnouncementsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const schedule_1 = require("@nestjs/schedule");
const mongoose_2 = require("mongoose");
const announcement_schema_1 = require("./schemas/announcement.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const alerts_service_1 = require("../alerts/alerts.service");
const push_service_1 = require("../push/push.service");
const notifications_service_1 = require("../notifications/notifications.service");
const contants_1 = require("../config/contants");
const announcement_templates_1 = require("./announcement-templates");
let AnnouncementsService = AnnouncementsService_1 = class AnnouncementsService {
    constructor(announcementModel, userModel, alertsService, pushService, notificationsService) {
        this.announcementModel = announcementModel;
        this.userModel = userModel;
        this.alertsService = alertsService;
        this.pushService = pushService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(AnnouncementsService_1.name);
    }
    async resolveAudienceUserIds(dto) {
        if (dto.audienceType === 'users') {
            return (dto.audienceUserIds || []).map((id) => String(id));
        }
        const filter = {
            isSuspended: { $ne: true },
            isDeleted: { $ne: true },
        };
        if (dto.audienceType === 'role' && dto.audienceRole) {
            filter.role = dto.audienceRole;
        }
        const users = await this.userModel.find(filter).select('_id').lean().exec();
        return users.map((u) => String(u._id));
    }
    async dispatch(doc) {
        const counts = { inApp: 0, push: 0, email: 0 };
        try {
            const userIds = await this.resolveAudienceUserIds({
                audienceType: doc.audienceType,
                audienceRole: doc.audienceRole,
                audienceUserIds: doc.audienceUserIds,
            });
            const announcementId = doc._id.toString();
            if (doc.channels.includes('in_app') && userIds.length > 0) {
                try {
                    await this.alertsService.createBulkAlerts(userIds, {
                        type: contants_1.AlertType.SystemAnnouncement,
                        title: doc.title,
                        message: doc.message,
                        entityType: 'user',
                        entityId: announcementId,
                        metadata: { announcementId, ...(doc.data || {}) },
                    });
                    counts.inApp = userIds.length;
                }
                catch (err) {
                    this.logger.error(`In-app dispatch failed: ${err.message}`);
                }
            }
            if (doc.channels.includes('push') && userIds.length > 0) {
                try {
                    const stringData = { announcementId };
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
                }
                catch (err) {
                    this.logger.error(`Push dispatch failed: ${err.message}`);
                }
            }
            if (doc.channels.includes('email') && userIds.length > 0) {
                try {
                    const users = await this.userModel
                        .find({ _id: { $in: userIds } })
                        .select('email firstName')
                        .lean()
                        .exec();
                    const recipients = users
                        .filter((u) => u.email)
                        .map((u) => ({
                        email: u.email,
                        name: u.firstName,
                    }));
                    const res = await this.notificationsService.sendBroadcastEmail(recipients, {
                        subject: doc.title,
                        heading: doc.title,
                        body: doc.message,
                        imageUrl: doc.imageUrl || undefined,
                        ctaText: doc.data?.route ? 'Open' : undefined,
                        ctaUrl: doc.data?.route
                            ? `${process.env.FRONTEND_URL || ''}${doc.data.route}`
                            : undefined,
                    });
                    counts.email = res.sent;
                }
                catch (err) {
                    this.logger.error(`Email dispatch failed: ${err.message}`);
                }
            }
            doc.counts = counts;
            doc.status = 'sent';
            doc.sentAt = new Date();
            await doc.save();
        }
        catch (err) {
            this.logger.error(`Announcement dispatch failed: ${err.message}`);
            doc.status = 'failed';
            await doc.save().catch(() => { });
        }
        return doc;
    }
    async createAndSend(dto, adminUserId) {
        const scheduleAt = dto.scheduleAt ? new Date(dto.scheduleAt) : null;
        const isFuture = scheduleAt && scheduleAt.getTime() > Date.now();
        const doc = await this.announcementModel.create({
            title: dto.title,
            message: dto.message,
            channels: dto.channels,
            audienceType: dto.audienceType,
            audienceRole: dto.audienceRole || null,
            audienceUserIds: (dto.audienceUserIds || []).map((id) => new mongoose_2.Types.ObjectId(id)),
            imageUrl: dto.imageUrl || null,
            data: dto.data || null,
            scheduleAt: scheduleAt,
            status: isFuture ? 'scheduled' : 'sending',
            createdBy: new mongoose_2.Types.ObjectId(adminUserId),
        });
        if (isFuture) {
            return doc;
        }
        return this.dispatch(doc);
    }
    async sendNow(id) {
        const doc = await this.announcementModel.findById(id).exec();
        if (!doc)
            throw new common_1.NotFoundException('Announcement not found');
        if (doc.status === 'sent')
            return doc;
        doc.status = 'sending';
        await doc.save();
        return this.dispatch(doc);
    }
    async processScheduled() {
        const now = new Date();
        const due = await this.announcementModel
            .find({ status: 'scheduled', scheduleAt: { $lte: now } })
            .exec();
        if (due.length === 0)
            return;
        this.logger.log(`Processing ${due.length} scheduled announcement(s)`);
        for (const doc of due) {
            doc.status = 'sending';
            await doc.save();
            await this.dispatch(doc);
        }
    }
    async list(query) {
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
    async getById(id) {
        const doc = await this.announcementModel.findById(id).exec();
        if (!doc)
            throw new common_1.NotFoundException('Announcement not found');
        return doc;
    }
    async cancelScheduled(id) {
        const doc = await this.announcementModel.findById(id).exec();
        if (!doc)
            throw new common_1.NotFoundException('Announcement not found');
        if (doc.status !== 'scheduled') {
            return doc;
        }
        doc.status = 'cancelled';
        await doc.save();
        return doc;
    }
    getTemplates() {
        return announcement_templates_1.ANNOUNCEMENT_TEMPLATES;
    }
};
exports.AnnouncementsService = AnnouncementsService;
__decorate([
    (0, schedule_1.Cron)('0 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnnouncementsService.prototype, "processScheduled", null);
exports.AnnouncementsService = AnnouncementsService = AnnouncementsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(announcement_schema_1.Announcement.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        alerts_service_1.AlertsService,
        push_service_1.PushService,
        notifications_service_1.NotificationsService])
], AnnouncementsService);
//# sourceMappingURL=announcements.service.js.map