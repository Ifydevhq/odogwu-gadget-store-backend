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
var AffiliateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const affiliate_commission_schema_1 = require("./schemas/affiliate-commission.schema");
const order_schema_1 = require("../orders/schemas/order.schema");
const listing_schema_1 = require("../listings/schemas/listing.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const platform_settings_service_1 = require("../platform-settings/platform-settings.service");
const wallet_service_1 = require("../wallet/wallet.service");
const wallet_transaction_schema_1 = require("../wallet/schemas/wallet-transaction.schema");
let AffiliateService = AffiliateService_1 = class AffiliateService {
    constructor(commissionModel, orderModel, listingModel, userModel, platformSettingsService, walletService, configService) {
        this.commissionModel = commissionModel;
        this.orderModel = orderModel;
        this.listingModel = listingModel;
        this.userModel = userModel;
        this.platformSettingsService = platformSettingsService;
        this.walletService = walletService;
        this.configService = configService;
        this.logger = new common_1.Logger(AffiliateService_1.name);
    }
    async resolveAttributions(buyerId, items, affiliateCodes) {
        const result = new Map();
        if (!affiliateCodes || !items?.length)
            return result;
        try {
            const buyer = String(buyerId);
            const codes = Array.from(new Set(Object.values(affiliateCodes)
                .filter(Boolean)
                .map((c) => String(c).trim().toUpperCase())));
            if (!codes.length)
                return result;
            const affiliates = await this.userModel
                .find({ referralCode: { $in: codes }, isAffiliate: true })
                .select('_id referralCode')
                .lean()
                .exec();
            const affiliateByCode = new Map(affiliates.map((u) => [String(u.referralCode).toUpperCase(), u]));
            if (!affiliateByCode.size)
                return result;
            const listingIds = items
                .map((i) => String(i.listingId))
                .filter((id) => affiliateCodes[id]);
            if (!listingIds.length)
                return result;
            const listings = await this.listingModel
                .find({ _id: { $in: listingIds.map((id) => new mongoose_2.Types.ObjectId(id)) } })
                .select('_id affiliateEnabled affiliateCommissionPercent')
                .lean()
                .exec();
            const listingById = new Map(listings.map((l) => [String(l._id), l]));
            const settings = await this.platformSettingsService.getSettings();
            const defaultPct = settings?.affiliateDefaultCommissionPercent ?? 0;
            for (const item of items) {
                const listingIdStr = String(item.listingId);
                const rawCode = affiliateCodes[listingIdStr];
                if (!rawCode)
                    continue;
                const code = String(rawCode).trim().toUpperCase();
                const affiliate = affiliateByCode.get(code);
                if (!affiliate)
                    continue;
                if (String(affiliate._id) === buyer)
                    continue;
                const listing = listingById.get(listingIdStr);
                if (!listing || !listing.affiliateEnabled)
                    continue;
                const pct = listing.affiliateCommissionPercent > 0
                    ? listing.affiliateCommissionPercent
                    : defaultPct;
                if (!(pct > 0))
                    continue;
                const amount = Math.round((item.totalPrice * pct) / 100);
                if (!(amount > 0))
                    continue;
                result.set(listingIdStr, {
                    affiliateCode: code,
                    affiliateUserId: affiliate._id,
                    affiliateCommissionPercent: pct,
                    affiliateCommissionAmount: amount,
                });
            }
        }
        catch (err) {
            this.logger.error(`resolveAttributions failed: ${err?.message}`);
        }
        return result;
    }
    async processOrderCompletion(order) {
        try {
            if (!order?.items?.length)
                return;
            const settings = await this.platformSettingsService.getSettings();
            const holdDays = settings?.affiliateHoldDays ?? 7;
            const orderId = order._id?.toString?.() ?? String(order._id);
            const buyerId = order.buyerId?.toString?.() ?? String(order.buyerId);
            for (const item of order.items) {
                const affiliateUserId = item.affiliateUserId;
                const amount = item.affiliateCommissionAmount;
                if (!affiliateUserId || !(amount > 0))
                    continue;
                const listingId = item.listingId?.toString?.();
                if (!listingId)
                    continue;
                const existing = await this.commissionModel
                    .findOne({
                    orderId: new mongoose_2.Types.ObjectId(orderId),
                    listingId: new mongoose_2.Types.ObjectId(listingId),
                })
                    .exec();
                if (existing)
                    continue;
                const availableAt = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);
                try {
                    const txn = await this.walletService.credit({
                        userId: affiliateUserId,
                        amount,
                        bucket: wallet_transaction_schema_1.WalletBucket.Earned,
                        type: wallet_transaction_schema_1.WalletTxnType.AffiliateCommission,
                        status: wallet_transaction_schema_1.WalletTxnStatus.Pending,
                        description: `Affiliate commission for order ${order.orderNumber}`,
                        refId: orderId,
                        idempotencyKey: `affcomm:${orderId}:${listingId}`,
                        availableAt,
                    });
                    await this.commissionModel.create({
                        affiliateUserId,
                        buyerId: new mongoose_2.Types.ObjectId(buyerId),
                        orderId: new mongoose_2.Types.ObjectId(orderId),
                        listingId: new mongoose_2.Types.ObjectId(listingId),
                        itemName: item.itemName ?? '',
                        orderNumber: order.orderNumber ?? '',
                        amount,
                        commissionPercent: item.affiliateCommissionPercent ?? 0,
                        status: affiliate_commission_schema_1.AffiliateCommissionStatus.Pending,
                        walletTxnId: txn._id,
                        availableAt,
                    });
                }
                catch (err) {
                    if (err?.code === 11000)
                        continue;
                    this.logger.error(`processOrderCompletion item failed (order=${orderId} listing=${listingId}): ${err?.message}`);
                }
            }
        }
        catch (err) {
            this.logger.error(`processOrderCompletion failed (order=${order?._id}): ${err?.message}`);
        }
    }
    async reverseForOrder(orderId, reason) {
        try {
            const oid = new mongoose_2.Types.ObjectId(String(orderId));
            const commissions = await this.commissionModel
                .find({
                orderId: oid,
                status: {
                    $in: [
                        affiliate_commission_schema_1.AffiliateCommissionStatus.Pending,
                        affiliate_commission_schema_1.AffiliateCommissionStatus.Available,
                    ],
                },
            })
                .exec();
            for (const commission of commissions) {
                try {
                    if (commission.walletTxnId) {
                        await this.walletService.reverse(commission.walletTxnId, reason);
                    }
                    commission.status =
                        commission.status === affiliate_commission_schema_1.AffiliateCommissionStatus.Pending
                            ? affiliate_commission_schema_1.AffiliateCommissionStatus.Cancelled
                            : affiliate_commission_schema_1.AffiliateCommissionStatus.Reversed;
                    await commission.save();
                }
                catch (err) {
                    this.logger.error(`reverseForOrder commission ${commission._id} failed: ${err?.message}`);
                }
            }
        }
        catch (err) {
            this.logger.error(`reverseForOrder failed (order=${String(orderId)}): ${err?.message}`);
        }
    }
    async matureDueCommissions() {
        try {
            const now = new Date();
            const due = await this.commissionModel
                .find({
                status: affiliate_commission_schema_1.AffiliateCommissionStatus.Pending,
                availableAt: { $lte: now },
            })
                .exec();
            if (!due.length)
                return;
            let matured = 0;
            for (const commission of due) {
                try {
                    if (commission.walletTxnId) {
                        await this.walletService.matureTransaction(commission.walletTxnId);
                    }
                    commission.status = affiliate_commission_schema_1.AffiliateCommissionStatus.Available;
                    await commission.save();
                    matured++;
                }
                catch (err) {
                    this.logger.error(`matureDueCommissions commission ${commission._id} failed: ${err?.message}`);
                }
            }
            if (matured > 0) {
                this.logger.log(`Matured ${matured} affiliate commission(s).`);
            }
        }
        catch (err) {
            this.logger.error(`matureDueCommissions failed: ${err?.message}`);
        }
    }
    async join(userId) {
        await this.userModel
            .updateOne({ _id: new mongoose_2.Types.ObjectId(userId) }, { $set: { isAffiliate: true } })
            .exec();
        return { isAffiliate: true };
    }
    async getSummary(userId) {
        const uid = new mongoose_2.Types.ObjectId(userId);
        const [user, agg] = await Promise.all([
            this.userModel.findById(uid).select('isAffiliate').lean().exec(),
            this.commissionModel.aggregate([
                { $match: { affiliateUserId: uid } },
                { $group: { _id: '$status', total: { $sum: '$amount' } } },
            ]),
        ]);
        let pendingAmount = 0;
        let availableAmount = 0;
        for (const row of agg) {
            if (row._id === affiliate_commission_schema_1.AffiliateCommissionStatus.Pending)
                pendingAmount = row.total;
            else if (row._id === affiliate_commission_schema_1.AffiliateCommissionStatus.Available)
                availableAmount = row.total;
        }
        return {
            isAffiliate: !!user?.isAffiliate,
            pendingAmount,
            availableAmount,
            totalEarned: pendingAmount + availableAmount,
        };
    }
    async listCommissions(userId, paging) {
        const page = paging.page ?? 1;
        const perPage = paging.perPage ?? 20;
        const skip = (page - 1) * perPage;
        const affiliateUserId = new mongoose_2.Types.ObjectId(userId);
        const [items, total] = await Promise.all([
            this.commissionModel
                .find({ affiliateUserId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage)
                .exec(),
            this.commissionModel.countDocuments({ affiliateUserId }).exec(),
        ]);
        return {
            items,
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
        };
    }
    async getLink(userId, listingId) {
        const [user, listing] = await Promise.all([
            this.userModel.findById(userId).select('referralCode').lean().exec(),
            this.listingModel
                .findById(listingId)
                .select('affiliateEnabled')
                .lean()
                .exec(),
        ]);
        if (!listing) {
            throw new Error('Listing not found');
        }
        if (!listing.affiliateEnabled) {
            throw new Error('This product does not have affiliate enabled');
        }
        const code = user?.referralCode ?? '';
        const frontendUrl = this.configService.get('app.frontendUrl') ||
            'http://localhost:3000';
        const base = frontendUrl.replace(/\/+$/, '');
        const link = `${base}/product/${listingId}?aff=${code}`;
        return { listingId, affiliateCode: code, link };
    }
    async listAffiliateProducts(paging) {
        const page = paging.page ?? 1;
        const perPage = paging.perPage ?? 20;
        const skip = (page - 1) * perPage;
        const filter = { affiliateEnabled: true, status: 'live' };
        const [items, total] = await Promise.all([
            this.listingModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage)
                .exec(),
            this.listingModel.countDocuments(filter).exec(),
        ]);
        return {
            items,
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
        };
    }
};
exports.AffiliateService = AffiliateService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AffiliateService.prototype, "matureDueCommissions", null);
exports.AffiliateService = AffiliateService = AffiliateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(affiliate_commission_schema_1.AffiliateCommission.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(2, (0, mongoose_1.InjectModel)(listing_schema_1.Listing.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        platform_settings_service_1.PlatformSettingsService,
        wallet_service_1.WalletService,
        config_1.ConfigService])
], AffiliateService);
//# sourceMappingURL=affiliate.service.js.map