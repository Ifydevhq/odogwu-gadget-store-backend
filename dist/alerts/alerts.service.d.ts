import { Model, Types } from 'mongoose';
import { AlertDocument } from './schemas/alert.schema';
import { AlertType } from '../config/contants';
import { GetAlertsDto } from './dto/alert.dto';
import { PushService } from '../push/push.service';
export declare class AlertsService {
    private readonly alertModel;
    private readonly pushService?;
    private readonly logger;
    constructor(alertModel: Model<AlertDocument>, pushService?: PushService);
    createAlert(params: {
        userId: string | Types.ObjectId;
        type: AlertType;
        title: string;
        message: string;
        entityId?: string | Types.ObjectId;
        entityType?: 'order' | 'listing' | 'store' | 'dispute' | 'review' | 'user';
        metadata?: Record<string, any>;
    }): Promise<AlertDocument | null>;
    createAlertAndPush(params: Parameters<AlertsService['createAlert']>[0] & {
        route?: string;
    }): Promise<void>;
    createBulkAlerts(userIds: (string | Types.ObjectId)[], params: Omit<Parameters<AlertsService['createAlert']>[0], 'userId'>): Promise<void>;
    getAlerts(userId: string, dto: GetAlertsDto): Promise<{
        data: (import("mongoose").FlattenMaps<AlertDocument> & {
            _id: Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(alertId: string, userId: string): Promise<AlertDocument | null>;
    markAllAsRead(userId: string): Promise<number>;
    deleteAlert(alertId: string, userId: string): Promise<boolean>;
    clearAllAlerts(userId: string): Promise<number>;
}
