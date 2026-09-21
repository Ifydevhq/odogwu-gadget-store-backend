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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTransactionSchema = exports.WalletTransaction = exports.WalletTxnStatus = exports.WalletTxnType = exports.WalletBucket = exports.WalletTxnDirection = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var WalletTxnDirection;
(function (WalletTxnDirection) {
    WalletTxnDirection["Credit"] = "credit";
    WalletTxnDirection["Debit"] = "debit";
})(WalletTxnDirection || (exports.WalletTxnDirection = WalletTxnDirection = {}));
var WalletBucket;
(function (WalletBucket) {
    WalletBucket["Promo"] = "promo";
    WalletBucket["Earned"] = "earned";
})(WalletBucket || (exports.WalletBucket = WalletBucket = {}));
var WalletTxnType;
(function (WalletTxnType) {
    WalletTxnType["SignupCredit"] = "signup_credit";
    WalletTxnType["ReferralReward"] = "referral_reward";
    WalletTxnType["AffiliateCommission"] = "affiliate_commission";
    WalletTxnType["PurchaseRedemption"] = "purchase_redemption";
    WalletTxnType["PurchaseRefund"] = "purchase_refund";
    WalletTxnType["Withdrawal"] = "withdrawal";
    WalletTxnType["Reversal"] = "reversal";
    WalletTxnType["AdminAdjustment"] = "admin_adjustment";
})(WalletTxnType || (exports.WalletTxnType = WalletTxnType = {}));
var WalletTxnStatus;
(function (WalletTxnStatus) {
    WalletTxnStatus["Pending"] = "pending";
    WalletTxnStatus["Available"] = "available";
    WalletTxnStatus["Spent"] = "spent";
    WalletTxnStatus["Reversed"] = "reversed";
    WalletTxnStatus["Cancelled"] = "cancelled";
})(WalletTxnStatus || (exports.WalletTxnStatus = WalletTxnStatus = {}));
let WalletTransaction = class WalletTransaction {
};
exports.WalletTransaction = WalletTransaction;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WalletTransaction.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 0 }),
    __metadata("design:type", Number)
], WalletTransaction.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: WalletTxnDirection, required: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "direction", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: WalletBucket, required: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "bucket", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: WalletTxnType, required: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: WalletTxnStatus, required: true, default: WalletTxnStatus.Available }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WalletTransaction.prototype, "orderId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "refId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "idempotencyKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], WalletTransaction.prototype, "availableAt", void 0);
exports.WalletTransaction = WalletTransaction = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], WalletTransaction);
exports.WalletTransactionSchema = mongoose_1.SchemaFactory.createForClass(WalletTransaction);
exports.WalletTransactionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
exports.WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
exports.WalletTransactionSchema.index({ userId: 1, type: 1, status: 1, createdAt: -1 });
//# sourceMappingURL=wallet-transaction.schema.js.map