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
var ReferralsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const referral_schema_1 = require("./schemas/referral.schema");
const phone_registry_schema_1 = require("../phone-verification/schemas/phone-registry.schema");
const order_schema_1 = require("../orders/schemas/order.schema");
const users_service_1 = require("../users/users.service");
const platform_settings_service_1 = require("../platform-settings/platform-settings.service");
const wallet_service_1 = require("../wallet/wallet.service");
const wallet_transaction_schema_1 = require("../wallet/schemas/wallet-transaction.schema");
const contants_1 = require("../config/contants");
let ReferralsService = ReferralsService_1 = class ReferralsService {
    constructor(referralModel, phoneRegistryModel, orderModel, usersService, platformSettingsService, walletService, configService) {
        this.referralModel = referralModel;
        this.phoneRegistryModel = phoneRegistryModel;
        this.orderModel = orderModel;
        this.usersService = usersService;
        this.platformSettingsService = platformSettingsService;
        this.walletService = walletService;
        this.configService = configService;
        this.logger = new common_1.Logger(ReferralsService_1.name);
    }
    async registerReferral(referrerId, refereeId) {
        const referrer = String(referrerId);
        const referee = String(refereeId);
        if (!referrer || !referee || referrer === referee) {
            return null;
        }
        try {
            const existing = await this.referralModel
                .findOne({ refereeId: new mongoose_2.Types.ObjectId(referee) })
                .exec();
            if (existing)
                return existing;
            return await this.referralModel.create({
                referrerId: new mongoose_2.Types.ObjectId(referrer),
                refereeId: new mongoose_2.Types.ObjectId(referee),
                status: referral_schema_1.ReferralStatus.Pending,
                cumulativeQualifyingSpend: 0,
            });
        }
        catch (err) {
            if (err?.code === 11000) {
                return this.referralModel
                    .findOne({ refereeId: new mongoose_2.Types.ObjectId(referee) })
                    .exec();
            }
            this.logger.error(`registerReferral failed (referrer=${referrer} referee=${referee}): ${err?.message}`);
            return null;
        }
    }
    async activateOnPhoneVerified(refereeId, phoneE164) {
        try {
            const referee = new mongoose_2.Types.ObjectId(String(refereeId));
            const referral = await this.referralModel.findOne({ refereeId: referee }).exec();
            if (!referral)
                return;
            if (referral.status === referral_schema_1.ReferralStatus.Rewarded ||
                referral.status === referral_schema_1.ReferralStatus.Void) {
                return;
            }
            const registry = await this.phoneRegistryModel
                .findOne({ phoneE164 })
                .exec();
            if (registry?.referralRedeemed) {
                referral.status = referral_schema_1.ReferralStatus.Void;
                referral.refereePhoneE164 = phoneE164;
                await referral.save();
                this.logger.warn(`Referral for referee ${referee.toString()} voided: phone ${phoneE164} already redeemed a referral.`);
                return;
            }
            const claim = await this.phoneRegistryModel
                .updateOne({ phoneE164, referralRedeemed: { $ne: true } }, { $set: { referralRedeemed: true } })
                .exec();
            if (claim.matchedCount === 0) {
                referral.status = referral_schema_1.ReferralStatus.Void;
                referral.refereePhoneE164 = phoneE164;
                await referral.save();
                return;
            }
            referral.refereePhoneE164 = phoneE164;
            await referral.save();
        }
        catch (err) {
            this.logger.error(`activateOnPhoneVerified failed (referee=${String(refereeId)} phone=${phoneE164}): ${err?.message}`);
        }
    }
    async recordCompletedOrder(refereeId, _orderAmount) {
        try {
            const referee = new mongoose_2.Types.ObjectId(String(refereeId));
            const referral = await this.referralModel.findOne({ refereeId: referee }).exec();
            if (!referral)
                return;
            if (referral.status === referral_schema_1.ReferralStatus.Void ||
                referral.status === referral_schema_1.ReferralStatus.Rewarded) {
                return;
            }
            const eligible = await this.usersService.isRewardEligible(referee.toString());
            if (!eligible)
                return;
            const agg = await this.orderModel.aggregate([
                {
                    $match: {
                        buyerId: referee,
                        status: contants_1.OrderStatus.Completed,
                    },
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]);
            const totalSpend = agg[0]?.total ?? 0;
            referral.cumulativeQualifyingSpend = totalSpend;
            const settings = await this.platformSettingsService.getSettings();
            const minSpend = settings?.referralMinOrderAmount ?? 1000000;
            const rewardAmount = settings?.referralRewardAmount ?? 100000;
            if (totalSpend < minSpend) {
                await referral.save();
                return;
            }
            if (!referral.qualifiedAt) {
                referral.qualifiedAt = new Date();
                referral.status = referral_schema_1.ReferralStatus.Qualified;
            }
            if (rewardAmount > 0) {
                const txn = await this.walletService.credit({
                    userId: referral.referrerId,
                    amount: rewardAmount,
                    bucket: wallet_transaction_schema_1.WalletBucket.Earned,
                    type: wallet_transaction_schema_1.WalletTxnType.ReferralReward,
                    description: 'Referral reward',
                    refId: referee.toString(),
                    idempotencyKey: `referral:${referee.toString()}`,
                });
                referral.rewardTxnId = txn._id;
            }
            referral.status = referral_schema_1.ReferralStatus.Rewarded;
            referral.rewardedAt = new Date();
            await referral.save();
        }
        catch (err) {
            this.logger.error(`recordCompletedOrder failed (referee=${String(refereeId)}): ${err?.message}`);
        }
    }
    buildReferralLink(referralCode) {
        const frontendUrl = this.configService.get('app.frontendUrl') ||
            'http://localhost:3000';
        const base = frontendUrl.replace(/\/+$/, '');
        return referralCode ? `${base}/?ref=${referralCode}` : base;
    }
    async getMyReferralSummary(userId) {
        const user = await this.usersService.findById(userId);
        const referralCode = user.referralCode ?? '';
        const referrerId = new mongoose_2.Types.ObjectId(userId);
        const [totalReferred, totalQualified, rewardedAgg] = await Promise.all([
            this.referralModel.countDocuments({ referrerId }).exec(),
            this.referralModel
                .countDocuments({
                referrerId,
                status: { $in: [referral_schema_1.ReferralStatus.Qualified, referral_schema_1.ReferralStatus.Rewarded] },
            })
                .exec(),
            this.referralModel.countDocuments({
                referrerId,
                status: referral_schema_1.ReferralStatus.Rewarded,
            }).exec(),
        ]);
        const settings = await this.platformSettingsService.getSettings();
        const rewardAmount = settings?.referralRewardAmount ?? 100000;
        return {
            referralCode,
            referralLink: this.buildReferralLink(referralCode),
            totalReferred,
            totalQualified,
            totalRewardedAmount: rewardedAgg * rewardAmount,
        };
    }
    async listMyReferrals(userId, paging) {
        const page = paging.page ?? 1;
        const perPage = paging.perPage ?? 20;
        const referrerId = new mongoose_2.Types.ObjectId(userId);
        const skip = (page - 1) * perPage;
        const [rows, total] = await Promise.all([
            this.referralModel
                .find({ referrerId })
                .populate('refereeId', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage)
                .exec(),
            this.referralModel.countDocuments({ referrerId }).exec(),
        ]);
        const items = rows.map((r) => {
            const referee = r.refereeId;
            return {
                id: r._id.toString(),
                name: this.maskName(referee?.firstName, referee?.lastName),
                status: r.status,
                cumulativeQualifyingSpend: r.cumulativeQualifyingSpend,
                qualifiedAt: r.qualifiedAt,
                rewardedAt: r.rewardedAt,
                createdAt: r.createdAt,
            };
        });
        return {
            items,
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
        };
    }
    maskName(firstName, lastName) {
        const first = (firstName || '').trim();
        const last = (lastName || '').trim();
        const initial = last ? `${last.charAt(0).toUpperCase()}.` : '';
        return [first || 'Anonymous', initial].filter(Boolean).join(' ');
    }
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = ReferralsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(referral_schema_1.Referral.name)),
    __param(1, (0, mongoose_1.InjectModel)(phone_registry_schema_1.PhoneRegistry.name)),
    __param(2, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService,
        platform_settings_service_1.PlatformSettingsService,
        wallet_service_1.WalletService,
        config_1.ConfigService])
], ReferralsService);
//# sourceMappingURL=referrals.service.js.map