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
exports.OrderSchema = exports.Order = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const base_schema_1 = require("../../common/schemas/base-schema");
const contants_1 = require("../../config/contants");
class OrderItem {
}
class ShippingAddress {
}
class PaymentInfo {
}
class RevenueSplit {
}
class TrackingInfo {
}
let Order = class Order extends base_schema_1.BaseSchema {
};
exports.Order = Order;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Order.prototype, "orderNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "buyerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Order.prototype, "receiptEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "sellerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Creator', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "creatorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Store', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "storeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                listingId: { type: mongoose_2.Types.ObjectId, ref: 'Listing', required: true },
                itemName: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                unitPrice: { type: Number, required: true },
                totalPrice: { type: Number, required: true },
                type: { type: String, enum: Object.values(contants_1.ListingType) },
                image: { type: String },
                storeId: { type: mongoose_2.Types.ObjectId, ref: 'Store' },
                sellerId: { type: mongoose_2.Types.ObjectId, ref: 'User' },
                creatorId: { type: mongoose_2.Types.ObjectId, ref: 'Creator' },
                commissionRate: { type: Number, default: 15 },
                affiliateCode: { type: String, default: null },
                affiliateUserId: { type: mongoose_2.Types.ObjectId, ref: 'User', default: null },
                affiliateCommissionPercent: { type: Number, default: null },
                affiliateCommissionAmount: { type: Number, default: null },
            },
        ],
        required: true,
    }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Order.prototype, "subtotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "shippingFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Order.prototype, "totalAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: contants_1.Currency.NGN }),
    __metadata("design:type", String)
], Order.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            totalAmount: { type: Number, required: true },
            platformFee: { type: Number, required: true },
            sellerPayout: { type: Number, required: true },
            commissionRate: { type: Number, required: true },
        },
        required: true,
    }),
    __metadata("design:type", RevenueSplit)
], Order.prototype, "revenueSplit", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(contants_1.OrderStatus),
        default: contants_1.OrderStatus.Pending,
    }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(contants_1.PaymentStatus),
        default: contants_1.PaymentStatus.Pending,
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: [
            'awaiting_completion',
            'awaiting_disbursement',
            'disbursed',
            'not_applicable',
        ],
        default: 'awaiting_completion',
    }),
    __metadata("design:type", String)
], Order.prototype, "disbursementStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], Order.prototype, "disbursedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            method: { type: String, default: 'paystack' },
            reference: { type: String },
            paystackReference: { type: String },
            paidAt: { type: Date },
            status: { type: String },
        },
        default: {},
    }),
    __metadata("design:type", PaymentInfo)
], Order.prototype, "paymentInfo", void 0);
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
    __metadata("design:type", ShippingAddress)
], Order.prototype, "shippingAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            carrier: { type: String },
            trackingNumber: { type: String },
            estimatedDelivery: { type: Date },
            shippedAt: { type: Date },
            deliveredAt: { type: Date },
        },
        default: {},
    }),
    __metadata("design:type", TrackingInfo)
], Order.prototype, "trackingInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Order.prototype, "buyerNote", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Order.prototype, "adminNote", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Order.prototype, "cancellationReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "walletCreditApplied", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            promo: { type: Number, default: 0 },
            earned: { type: Number, default: 0 },
        },
        default: null,
    }),
    __metadata("design:type", Object)
], Order.prototype, "walletCreditBreakdown", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "walletRedemptionTxnId", void 0);
exports.Order = Order = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    })
], Order);
exports.OrderSchema = mongoose_1.SchemaFactory.createForClass(Order);
exports.OrderSchema.index({ orderNumber: 1 }, { unique: true });
exports.OrderSchema.index({ buyerId: 1, status: 1 });
exports.OrderSchema.index({ sellerId: 1, status: 1 });
exports.OrderSchema.index({ 'items.sellerId': 1, status: 1 });
exports.OrderSchema.index({ 'items.storeId': 1 });
exports.OrderSchema.index({ storeId: 1 });
exports.OrderSchema.index({ creatorId: 1 });
exports.OrderSchema.index({ status: 1, createdAt: -1 });
exports.OrderSchema.index({ paymentStatus: 1 });
exports.OrderSchema.index({ disbursementStatus: 1 });
exports.OrderSchema.index({ 'items.sellerId': 1, disbursementStatus: 1 });
exports.OrderSchema.index({ 'paymentInfo.reference': 1 });
exports.OrderSchema.index({ status: 1, 'trackingInfo.deliveredAt': 1 });
//# sourceMappingURL=order.schema.js.map