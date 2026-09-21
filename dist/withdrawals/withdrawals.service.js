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
var WithdrawalsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const wallet_service_1 = require("../wallet/wallet.service");
const wallet_transaction_schema_1 = require("../wallet/schemas/wallet-transaction.schema");
const platform_settings_service_1 = require("../platform-settings/platform-settings.service");
const withdrawal_request_schema_1 = require("./schemas/withdrawal-request.schema");
const process_withdrawal_dto_1 = require("./dto/process-withdrawal.dto");
let WithdrawalsService = WithdrawalsService_1 = class WithdrawalsService {
    constructor(withdrawalModel, walletService, platformSettingsService) {
        this.withdrawalModel = withdrawalModel;
        this.walletService = walletService;
        this.platformSettingsService = platformSettingsService;
        this.logger = new common_1.Logger(WithdrawalsService_1.name);
    }
    async request(userId, dto) {
        const settings = await this.platformSettingsService.getSettings();
        const minWithdrawal = settings.minWithdrawalAmount;
        if (dto.amount < minWithdrawal) {
            throw new common_1.BadRequestException(`Minimum withdrawal amount is ${minWithdrawal} kobo (₦${(minWithdrawal / 100).toLocaleString()}).`);
        }
        const { earnedBalance } = await this.walletService.getBalance(userId);
        if (dto.amount > earnedBalance) {
            throw new common_1.BadRequestException('Insufficient available balance');
        }
        const request = await this.withdrawalModel.create({
            userId: new mongoose_2.Types.ObjectId(String(userId)),
            amount: dto.amount,
            status: withdrawal_request_schema_1.WithdrawalStatus.Pending,
            bankName: dto.bankName ?? null,
            accountNumber: dto.accountNumber ?? null,
            accountName: dto.accountName ?? null,
            requestedAt: new Date(),
        });
        try {
            const txn = await this.walletService.debit({
                userId,
                amount: dto.amount,
                bucket: wallet_transaction_schema_1.WalletBucket.Earned,
                type: wallet_transaction_schema_1.WalletTxnType.Withdrawal,
                description: 'Withdrawal request',
                idempotencyKey: `withdrawal:${request._id}`,
            });
            request.walletTxnId = txn._id;
            await request.save();
        }
        catch (err) {
            await this.withdrawalModel.deleteOne({ _id: request._id }).exec();
            if (err instanceof common_1.BadRequestException) {
                throw new common_1.BadRequestException('Insufficient available balance');
            }
            this.logger.error(`Failed to hold funds for withdrawal ${request._id}: ${err?.message}`);
            throw new common_1.BadRequestException('Could not process withdrawal request');
        }
        return request;
    }
    async listMine(userId, { page = 1, perPage = 20 }) {
        const filter = { userId: new mongoose_2.Types.ObjectId(String(userId)) };
        const [data, total] = await Promise.all([
            this.withdrawalModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * perPage)
                .limit(perPage)
                .lean()
                .exec(),
            this.withdrawalModel.countDocuments(filter).exec(),
        ]);
        return {
            data,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }
    async adminList({ page = 1, perPage = 20, status }) {
        const filter = {};
        if (status)
            filter.status = status;
        const [data, total] = await Promise.all([
            this.withdrawalModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * perPage)
                .limit(perPage)
                .populate('userId', 'name email phone')
                .lean()
                .exec(),
            this.withdrawalModel.countDocuments(filter).exec(),
        ]);
        return {
            data,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }
    async process(requestId, adminId, dto) {
        const request = await this.withdrawalModel.findById(requestId).exec();
        if (!request) {
            throw new common_1.NotFoundException('Withdrawal request not found');
        }
        if (request.status !== withdrawal_request_schema_1.WithdrawalStatus.Pending) {
            throw new common_1.BadRequestException(`Withdrawal request is already ${request.status} and cannot be processed again`);
        }
        if (dto.action === process_withdrawal_dto_1.WithdrawalAction.Reject) {
            if (request.walletTxnId) {
                await this.walletService.reverse(request.walletTxnId, 'Withdrawal rejected');
            }
            request.status = withdrawal_request_schema_1.WithdrawalStatus.Rejected;
        }
        else {
            request.status = withdrawal_request_schema_1.WithdrawalStatus.Paid;
        }
        request.processedAt = new Date();
        request.processedBy = new mongoose_2.Types.ObjectId(String(adminId));
        if (dto.adminNote !== undefined)
            request.adminNote = dto.adminNote;
        await request.save();
        return request;
    }
};
exports.WithdrawalsService = WithdrawalsService;
exports.WithdrawalsService = WithdrawalsService = WithdrawalsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(withdrawal_request_schema_1.WithdrawalRequest.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        wallet_service_1.WalletService,
        platform_settings_service_1.PlatformSettingsService])
], WithdrawalsService);
//# sourceMappingURL=withdrawals.service.js.map