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
exports.AffiliateCommissionSchema = exports.AffiliateCommission = exports.AffiliateCommissionStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var AffiliateCommissionStatus;
(function (AffiliateCommissionStatus) {
    AffiliateCommissionStatus["Pending"] = "pending";
    AffiliateCommissionStatus["Available"] = "available";
    AffiliateCommissionStatus["Reversed"] = "reversed";
    AffiliateCommissionStatus["Cancelled"] = "cancelled";
})(AffiliateCommissionStatus || (exports.AffiliateCommissionStatus = AffiliateCommissionStatus = {}));
let AffiliateCommission = class AffiliateCommission {
};
exports.AffiliateCommission = AffiliateCommission;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AffiliateCommission.prototype, "affiliateUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AffiliateCommission.prototype, "buyerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Order', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AffiliateCommission.prototype, "orderId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Listing', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AffiliateCommission.prototype, "listingId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], AffiliateCommission.prototype, "itemName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], AffiliateCommission.prototype, "orderNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], AffiliateCommission.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], AffiliateCommission.prototype, "commissionPercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(AffiliateCommissionStatus),
        default: AffiliateCommissionStatus.Pending,
        index: true,
    }),
    __metadata("design:type", String)
], AffiliateCommission.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AffiliateCommission.prototype, "walletTxnId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], AffiliateCommission.prototype, "availableAt", void 0);
exports.AffiliateCommission = AffiliateCommission = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], AffiliateCommission);
exports.AffiliateCommissionSchema = mongoose_1.SchemaFactory.createForClass(AffiliateCommission);
exports.AffiliateCommissionSchema.index({ orderId: 1, listingId: 1 }, { unique: true });
exports.AffiliateCommissionSchema.index({ affiliateUserId: 1, status: 1 });
exports.AffiliateCommissionSchema.index({ status: 1, availableAt: 1 });
//# sourceMappingURL=affiliate-commission.schema.js.map