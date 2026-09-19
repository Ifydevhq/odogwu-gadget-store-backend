import { Model, Types } from 'mongoose';
import { AnnouncementDocument } from './schemas/announcement.schema';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { AlertsService } from '../alerts/alerts.service';
import { PushService } from '../push/push.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class AnnouncementsService {
    private readonly announcementModel;
    private readonly userModel;
    private readonly alertsService;
    private readonly pushService;
    private readonly notificationsService;
    private readonly logger;
    constructor(announcementModel: Model<AnnouncementDocument>, userModel: Model<UserDocument>, alertsService: AlertsService, pushService: PushService, notificationsService: NotificationsService);
    resolveAudienceUserIds(dto: {
        audienceType: string;
        audienceRole?: string;
        audienceUserIds?: (string | Types.ObjectId)[];
    }): Promise<string[]>;
    dispatch(doc: AnnouncementDocument): Promise<AnnouncementDocument>;
    createAndSend(dto: CreateAnnouncementDto, adminUserId: string): Promise<AnnouncementDocument>;
    sendNow(id: string): Promise<AnnouncementDocument>;
    processScheduled(): Promise<void>;
    list(query: {
        page?: number;
        perPage?: number;
    }): Promise<{
        data: (import("mongoose").FlattenMaps<AnnouncementDocument> & {
            _id: Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    getById(id: string): Promise<AnnouncementDocument>;
    cancelScheduled(id: string): Promise<AnnouncementDocument>;
    getTemplates(): import("./announcement-templates").AnnouncementTemplate[];
}
