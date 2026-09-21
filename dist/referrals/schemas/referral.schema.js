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
exports.ReferralSchema = exports.Referral = exports.ReferralStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var ReferralStatus;
(function (ReferralStatus) {
    ReferralStatus["Pending"] = "pending";
    ReferralStatus["Qualified"] = "qualified";
    ReferralStatus["Rewarded"] = "rewarded";
    ReferralStatus["Void"] = "void";
})(ReferralStatus || (exports.ReferralStatus = ReferralStatus = {}));
let Referral = class Referral {
};
exports.Referral = Referral;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Referral.prototype, "referrerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, unique: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Referral.prototype, "refereeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Referral.prototype, "refereePhoneE164", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(ReferralStatus),
        default: ReferralStatus.Pending,
        index: true,
    }),
    __metadata("design:type", String)
], Referral.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Referral.prototype, "cumulativeQualifyingSpend", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Referral.prototype, "rewardTxnId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], Referral.prototype, "qualifiedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], Referral.prototype, "rewardedAt", void 0);
exports.Referral = Referral = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Referral);
exports.ReferralSchema = mongoose_1.SchemaFactory.createForClass(Referral);
exports.ReferralSchema.index({ refereeId: 1 }, { unique: true });
exports.ReferralSchema.index({ referrerId: 1, status: 1 });
//# sourceMappingURL=referral.schema.js.map