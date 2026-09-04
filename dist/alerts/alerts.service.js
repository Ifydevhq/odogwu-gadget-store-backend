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
var AlertsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const alert_schema_1 = require("./schemas/alert.schema");
let AlertsService = AlertsService_1 = class AlertsService {
    constructor(alertModel) {
        this.alertModel = alertModel;
        this.logger = new common_1.Logger(AlertsService_1.name);
    }
    async createAlert(params) {
        try {
            const alert = await this.alertModel.create({
                userId: new mongoose_2.Types.ObjectId(String(params.userId)),
                type: params.type,
                title: params.title,
                message: params.message,
                entityId: params.entityId ? new mongoose_2.Types.ObjectId(String(params.entityId)) : null,
                entityType: params.entityType || null,
                metadata: params.metadata || null,
            });
            this.logger.log(`Alert created: [${params.type}] for user ${params.userId}`);
            return alert;
        }
        catch (error) {
            this.logger.error(`Failed to create alert [${params.type}] for user ${params.userId}: ${error.message}`);
            return null;
        }
    }
    async createBulkAlerts(userIds, params) {
        const docs = userIds.map((userId) => ({
            userId: new mongoose_2.Types.ObjectId(String(userId)),
            type: params.type,
            title: params.title,
            message: params.message,
            entityId: params.entityId ? new mongoose_2.Types.ObjectId(String(params.entityId)) : null,
            entityType: params.entityType || null,
            metadata: params.metadata || null,
        }));
        await this.alertModel.insertMany(docs);
        this.logger.log(`Bulk alerts created: [${params.type}] for ${userIds.length} users`);
    }
    async getAlerts(userId, dto) {
        const { page = 1, perPage = 20, isRead, type } = dto;
        const filter = {
            userId: new mongoose_2.Types.ObjectId(userId),
            isDeleted: { $ne: true },
        };
        if (isRead === 'true')
            filter.isRead = true;
        if (isRead === 'false')
            filter.isRead = false;
        if (type)
            filter.type = type;
        const [alerts, total] = await Promise.all([
            this.alertModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * perPage)
                .limit(perPage)
                .lean()
                .exec(),
            this.alertModel.countDocuments(filter).exec(),
        ]);
        return {
            data: alerts,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }
    async getUnreadCount(userId) {
        return this.alertModel.countDocuments({
            userId: new mongoose_2.Types.ObjectId(userId),
            isRead: false,
            isDeleted: { $ne: true },
        }).exec();
    }
    async markAsRead(alertId, userId) {
        return this.alertModel.findOneAndUpdate({ _id: new mongoose_2.Types.ObjectId(alertId), userId: new mongoose_2.Types.ObjectId(userId) }, { isRead: true }, { new: true }).exec();
    }
    async markAllAsRead(userId) {
        const result = await this.alertModel.updateMany({ userId: new mongoose_2.Types.ObjectId(userId), isRead: false }, { isRead: true }).exec();
        return result.modifiedCount;
    }
    async deleteAlert(alertId, userId) {
        const result = await this.alertModel.findOneAndUpdate({ _id: new mongoose_2.Types.ObjectId(alertId), userId: new mongoose_2.Types.ObjectId(userId) }, { isDeleted: true, deletedAt: new Date() }).exec();
        return !!result;
    }
    async clearAllAlerts(userId) {
        const result = await this.alertModel.updateMany({ userId: new mongoose_2.Types.ObjectId(userId), isDeleted: { $ne: true } }, { isDeleted: true, deletedAt: new Date() }).exec();
        return result.modifiedCount;
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = AlertsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(alert_schema_1.Alert.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map