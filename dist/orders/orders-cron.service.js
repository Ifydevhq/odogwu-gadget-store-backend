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
var OrdersCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("./schemas/order.schema");
const platform_settings_service_1 = require("../platform-settings/platform-settings.service");
const referrals_service_1 = require("../referrals/referrals.service");
const affiliate_service_1 = require("../affiliate/affiliate.service");
const contants_1 = require("../config/contants");
let OrdersCronService = OrdersCronService_1 = class OrdersCronService {
    constructor(orderModel, platformSettingsService, referralsService, affiliateService) {
        this.orderModel = orderModel;
        this.platformSettingsService = platformSettingsService;
        this.referralsService = referralsService;
        this.affiliateService = affiliateService;
        this.logger = new common_1.Logger(OrdersCronService_1.name);
    }
    async autoCompleteDeliveredOrders() {
        try {
            const settings = await this.platformSettingsService.getSettings();
            const maxHours = settings?.maxReturnHoursBeforeAutoComplete ?? 72;
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - maxHours);
            const qualifying = await this.orderModel
                .find({
                status: contants_1.OrderStatus.Delivered,
                'trackingInfo.deliveredAt': { $lte: cutoffDate },
            })
                .exec();
            const result = await this.orderModel.updateMany({
                status: contants_1.OrderStatus.Delivered,
                'trackingInfo.deliveredAt': { $lte: cutoffDate },
            }, {
                $set: {
                    status: contants_1.OrderStatus.Completed,
                    adminNote: `Auto-completed after ${maxHours}h return window expired`,
                },
            });
            if (result.modifiedCount > 0) {
                await this.orderModel.updateMany({
                    status: contants_1.OrderStatus.Completed,
                    adminNote: { $regex: /^Auto-completed after/ },
                    disbursementStatus: 'awaiting_completion',
                }, {
                    $set: { disbursementStatus: 'awaiting_disbursement' },
                });
                this.logger.log(`Auto-completed ${result.modifiedCount} delivered order(s) ` +
                    `(return window: ${maxHours}h, cutoff: ${cutoffDate.toISOString()})`);
                const distinctBuyers = new Set(qualifying.map((o) => o.buyerId?.toString()).filter(Boolean));
                for (const buyerId of distinctBuyers) {
                    await this.referralsService.recordCompletedOrder(buyerId);
                }
                for (const order of qualifying) {
                    await this.affiliateService.processOrderCompletion(order);
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to auto-complete delivered orders: ${error.message}`, error.stack);
        }
    }
};
exports.OrdersCronService = OrdersCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrdersCronService.prototype, "autoCompleteDeliveredOrders", null);
exports.OrdersCronService = OrdersCronService = OrdersCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        platform_settings_service_1.PlatformSettingsService,
        referrals_service_1.ReferralsService,
        affiliate_service_1.AffiliateService])
], OrdersCronService);
//# sourceMappingURL=orders-cron.service.js.map