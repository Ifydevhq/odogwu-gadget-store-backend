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
exports.WithdrawalRequestSchema = exports.WithdrawalRequest = exports.WithdrawalStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["Pending"] = "pending";
    WithdrawalStatus["Paid"] = "paid";
    WithdrawalStatus["Rejected"] = "rejected";
})(WithdrawalStatus || (exports.WithdrawalStatus = WithdrawalStatus = {}));
let WithdrawalRequest = class WithdrawalRequest {
};
exports.WithdrawalRequest = WithdrawalRequest;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WithdrawalRequest.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 1 }),
    __metadata("design:type", Number)
], WithdrawalRequest.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: WithdrawalStatus,
        required: true,
        default: WithdrawalStatus.Pending,
        index: true,
    }),
    __metadata("design:type", String)
], WithdrawalRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], WithdrawalRequest.prototype, "bankName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], WithdrawalRequest.prototype, "bankCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], WithdrawalRequest.prototype, "accountNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], WithdrawalRequest.prototype, "accountName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'WalletTransaction', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WithdrawalRequest.prototype, "walletTxnId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], WithdrawalRequest.prototype, "adminNote", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], WithdrawalRequest.prototype, "requestedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], WithdrawalRequest.prototype, "processedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WithdrawalRequest.prototype, "processedBy", void 0);
exports.WithdrawalRequest = WithdrawalRequest = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], WithdrawalRequest);
exports.WithdrawalRequestSchema = mongoose_1.SchemaFactory.createForClass(WithdrawalRequest);
exports.WithdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
exports.WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });
//# sourceMappingURL=withdrawal-request.schema.js.map