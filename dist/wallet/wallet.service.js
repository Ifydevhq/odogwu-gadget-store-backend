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
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const wallet_schema_1 = require("./schemas/wallet.schema");
const wallet_transaction_schema_1 = require("./schemas/wallet-transaction.schema");
let WalletService = WalletService_1 = class WalletService {
    constructor(walletModel, txnModel) {
        this.walletModel = walletModel;
        this.txnModel = txnModel;
        this.logger = new common_1.Logger(WalletService_1.name);
    }
    balanceFieldFor(bucket) {
        return bucket === wallet_transaction_schema_1.WalletBucket.Promo ? 'promoBalance' : 'earnedBalance';
    }
    async getOrCreateWallet(userId) {
        const uid = new mongoose_2.Types.ObjectId(String(userId));
        const wallet = await this.walletModel
            .findOneAndUpdate({ userId: uid }, { $setOnInsert: { userId: uid } }, { upsert: true, new: true, setDefaultsOnInsert: true })
            .exec();
        return wallet;
    }
    async getBalance(userId) {
        const wallet = await this.getOrCreateWallet(userId);
        return {
            promoBalance: wallet.promoBalance,
            earnedBalance: wallet.earnedBalance,
            pendingBalance: wallet.pendingBalance,
            total: wallet.promoBalance + wallet.earnedBalance,
        };
    }
    async credit(params) {
        if (params.amount == null || params.amount <= 0) {
            throw new common_1.BadRequestException('Credit amount must be a positive number of kobo');
        }
        const uid = new mongoose_2.Types.ObjectId(String(params.userId));
        const status = params.status ?? wallet_transaction_schema_1.WalletTxnStatus.Available;
        if (params.idempotencyKey) {
            const existing = await this.txnModel
                .findOne({ idempotencyKey: params.idempotencyKey })
                .exec();
            if (existing)
                return existing;
        }
        await this.getOrCreateWallet(uid);
        let txn;
        try {
            txn = await this.txnModel.create({
                userId: uid,
                amount: params.amount,
                direction: wallet_transaction_schema_1.WalletTxnDirection.Credit,
                bucket: params.bucket,
                type: params.type,
                status,
                description: params.description ?? '',
                orderId: params.orderId ? new mongoose_2.Types.ObjectId(String(params.orderId)) : null,
                refId: params.refId ?? null,
                idempotencyKey: params.idempotencyKey ?? null,
                availableAt: params.availableAt ?? null,
            });
        }
        catch (error) {
            if (error?.code === 11000 && params.idempotencyKey) {
                const existing = await this.txnModel
                    .findOne({ idempotencyKey: params.idempotencyKey })
                    .exec();
                if (existing)
                    return existing;
            }
            throw error;
        }
        if (status === wallet_transaction_schema_1.WalletTxnStatus.Pending) {
            await this.walletModel
                .updateOne({ userId: uid }, { $inc: { pendingBalance: params.amount } })
                .exec();
        }
        else if (status === wallet_transaction_schema_1.WalletTxnStatus.Available) {
            const field = this.balanceFieldFor(params.bucket);
            await this.walletModel
                .updateOne({ userId: uid }, { $inc: { [field]: params.amount } })
                .exec();
        }
        return txn;
    }
    async matureTransaction(transactionId) {
        const txn = await this.txnModel.findById(transactionId).exec();
        if (!txn)
            throw new common_1.BadRequestException('Wallet transaction not found');
        if (txn.status !== wallet_transaction_schema_1.WalletTxnStatus.Pending) {
            return txn;
        }
        txn.status = wallet_transaction_schema_1.WalletTxnStatus.Available;
        await txn.save();
        const field = this.balanceFieldFor(txn.bucket);
        await this.walletModel
            .updateOne({ userId: txn.userId }, { $inc: { pendingBalance: -txn.amount, [field]: txn.amount } })
            .exec();
        return txn;
    }
    async debit(params) {
        if (params.amount == null || params.amount <= 0) {
            throw new common_1.BadRequestException('Debit amount must be a positive number of kobo');
        }
        const uid = new mongoose_2.Types.ObjectId(String(params.userId));
        if (params.idempotencyKey) {
            const existing = await this.txnModel
                .findOne({ idempotencyKey: params.idempotencyKey })
                .exec();
            if (existing)
                return existing;
        }
        const wallet = await this.getOrCreateWallet(uid);
        const field = this.balanceFieldFor(params.bucket);
        if (wallet[field] < params.amount) {
            throw new common_1.BadRequestException(`Insufficient ${params.bucket} balance for this debit`);
        }
        const res = await this.walletModel
            .updateOne({ userId: uid, [field]: { $gte: params.amount } }, { $inc: { [field]: -params.amount } })
            .exec();
        if (res.modifiedCount === 0) {
            throw new common_1.BadRequestException(`Insufficient ${params.bucket} balance for this debit`);
        }
        let txn;
        try {
            txn = await this.txnModel.create({
                userId: uid,
                amount: params.amount,
                direction: wallet_transaction_schema_1.WalletTxnDirection.Debit,
                bucket: params.bucket,
                type: params.type,
                status: wallet_transaction_schema_1.WalletTxnStatus.Spent,
                description: params.description ?? '',
                orderId: params.orderId ? new mongoose_2.Types.ObjectId(String(params.orderId)) : null,
                idempotencyKey: params.idempotencyKey ?? null,
            });
        }
        catch (error) {
            if (error?.code === 11000 && params.idempotencyKey) {
                await this.walletModel
                    .updateOne({ userId: uid }, { $inc: { [field]: params.amount } })
                    .exec();
                const existing = await this.txnModel
                    .findOne({ idempotencyKey: params.idempotencyKey })
                    .exec();
                if (existing)
                    return existing;
            }
            throw error;
        }
        return txn;
    }
    async reverse(originalTransactionId, reason) {
        const original = await this.txnModel.findById(originalTransactionId).exec();
        if (!original)
            throw new common_1.BadRequestException('Original transaction not found');
        if (original.status === wallet_transaction_schema_1.WalletTxnStatus.Reversed) {
            return this.txnModel
                .findOne({
                type: wallet_transaction_schema_1.WalletTxnType.Reversal,
                refId: String(original._id),
            })
                .exec();
        }
        const field = this.balanceFieldFor(original.bucket);
        if (original.direction === wallet_transaction_schema_1.WalletTxnDirection.Credit) {
            if (original.status === wallet_transaction_schema_1.WalletTxnStatus.Pending) {
                await this.walletModel
                    .updateOne({ userId: original.userId }, { $inc: { pendingBalance: -original.amount } })
                    .exec();
            }
            else {
                await this.walletModel
                    .updateOne({ userId: original.userId }, { $inc: { [field]: -original.amount } })
                    .exec();
            }
        }
        else {
            await this.walletModel
                .updateOne({ userId: original.userId }, { $inc: { [field]: original.amount } })
                .exec();
        }
        original.status = wallet_transaction_schema_1.WalletTxnStatus.Reversed;
        await original.save();
        const reversalRow = await this.txnModel.create({
            userId: original.userId,
            amount: original.amount,
            direction: original.direction === wallet_transaction_schema_1.WalletTxnDirection.Credit
                ? wallet_transaction_schema_1.WalletTxnDirection.Debit
                : wallet_transaction_schema_1.WalletTxnDirection.Credit,
            bucket: original.bucket,
            type: wallet_transaction_schema_1.WalletTxnType.Reversal,
            status: wallet_transaction_schema_1.WalletTxnStatus.Reversed,
            description: reason || 'Reversal',
            orderId: original.orderId ?? null,
            refId: String(original._id),
        });
        return reversalRow;
    }
    async computeRedeemable(userId, orderTotalKobo, maxPromoPercent) {
        const { promoBalance, earnedBalance } = await this.getBalance(userId);
        const orderTotal = Math.max(0, Math.floor(orderTotalKobo || 0));
        const pct = Math.max(0, Math.min(100, maxPromoPercent || 0));
        const promoCap = Math.floor((orderTotal * pct) / 100);
        const promoApplied = Math.min(promoBalance, promoCap);
        const earnedApplied = Math.min(earnedBalance, orderTotal - promoApplied);
        return {
            promoApplied,
            earnedApplied,
            totalApplied: promoApplied + earnedApplied,
        };
    }
    async listTransactions(userId, dto) {
        const { page = 1, perPage = 20, type, status } = dto;
        const filter = {
            userId: new mongoose_2.Types.ObjectId(String(userId)),
        };
        if (type)
            filter.type = type;
        if (status)
            filter.status = status;
        const [transactions, total] = await Promise.all([
            this.txnModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * perPage)
                .limit(perPage)
                .lean()
                .exec(),
            this.txnModel.countDocuments(filter).exec(),
        ]);
        return {
            data: transactions,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(wallet_schema_1.Wallet.name)),
    __param(1, (0, mongoose_1.InjectModel)(wallet_transaction_schema_1.WalletTransaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], WalletService);
//# sourceMappingURL=wallet.service.js.map