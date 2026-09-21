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
exports.CheckoutSessionSchema = exports.CheckoutSession = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
class SessionItem {
}
class SessionShippingAddress {
}
let CheckoutSession = class CheckoutSession {
};
exports.CheckoutSession = CheckoutSession;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], CheckoutSession.prototype, "buyerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], CheckoutSession.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                listingId: { type: String, required: true },
                storeId: { type: String, required: true },
                sellerId: { type: String, required: true },
                creatorId: { type: String, required: true },
                itemName: { type: String, required: true },
                quantity: { type: Number, required: true },
                unitPrice: { type: Number, required: true },
                totalPrice: { type: Number, required: true },
                type: { type: String, required: true },
                image: { type: String, default: null },
                commissionRate: { type: Number, required: true },
            },
        ],
        required: true,
    }),
    __metadata("design:type", Array)
], CheckoutSession.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            fullName: { type: String, required: true },
            phoneNumber: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, default: 'Nigeria' },
            zipCode: { type: String },
        },
        required: true,
    }),
    __metadata("design:type", SessionShippingAddress)
], CheckoutSession.prototype, "shippingAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], CheckoutSession.prototype, "buyerNote", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], CheckoutSession.prototype, "grandTotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], CheckoutSession.prototype, "deliveryFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: 'NGN' }),
    __metadata("design:type", String)
], CheckoutSession.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], CheckoutSession.prototype, "walletCreditApplied", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            promo: { type: Number, default: 0 },
            earned: { type: Number, default: 0 },
        },
        default: null,
    }),
    __metadata("design:type", Object)
], CheckoutSession.prototype, "walletCreditBreakdown", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['paystack', 'opay'], default: 'paystack' }),
    __metadata("design:type", String)
], CheckoutSession.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], CheckoutSession.prototype, "paymentReference", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['pending', 'completed', 'failed', 'expired'],
        default: 'pending',
    }),
    __metadata("design:type", String)
], CheckoutSession.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], CheckoutSession.prototype, "orderIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], CheckoutSession.prototype, "expiresAt", void 0);
exports.CheckoutSession = CheckoutSession = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    })
], CheckoutSession);
exports.CheckoutSessionSchema = mongoose_1.SchemaFactory.createForClass(CheckoutSession);
exports.CheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.CheckoutSessionSchema.index({ paymentReference: 1 });
exports.CheckoutSessionSchema.index({ buyerId: 1, status: 1 });
//# sourceMappingURL=checkout-session.schema.js.map