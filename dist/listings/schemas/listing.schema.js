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
exports.ListingSchema = exports.Listing = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const contants_1 = require("../../config/contants");
const base_schema_1 = require("../../common/schemas/base-schema");
class PriceInfo {
}
class MediaItem {
}
class AdminPricing {
}
class ReviewInfo {
}
let Listing = class Listing extends base_schema_1.BaseSchema {
};
exports.Listing = Listing;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Store', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Listing.prototype, "storeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Creator', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Listing.prototype, "creatorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Listing.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Listing.prototype, "itemName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Listing.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Object.values(contants_1.ItemCondition), required: true }),
    __metadata("design:type", String)
], Listing.prototype, "condition", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Listing.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Listing.prototype, "subCategory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Listing.prototype, "tags", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 1, min: 1 }),
    __metadata("design:type", Number)
], Listing.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                url: { type: String, required: true },
                type: { type: String, enum: ['image', 'video'], default: 'image' },
                thumbnail: { type: String },
            },
        ],
        default: [],
        validate: {
            validator: (v) => v.length > 0,
            message: 'At least one image is required',
        },
    }),
    __metadata("design:type", Array)
], Listing.prototype, "media", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(contants_1.ListingType),
        required: true,
    }),
    __metadata("design:type", String)
], Listing.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            amount: { type: Number, required: true },
            currency: { type: String, default: contants_1.Currency.NGN },
            negotiable: { type: Boolean, default: false },
        },
        required: true,
    }),
    __metadata("design:type", PriceInfo)
], Listing.prototype, "askingPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            sellingPrice: { type: Number },
            purchasePrice: { type: Number },
            commissionRate: { type: Number },
        },
        default: null,
    }),
    __metadata("design:type", AdminPricing)
], Listing.prototype, "adminPricing", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Number)
], Listing.prototype, "discountPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Number)
], Listing.prototype, "formerPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Number)
], Listing.prototype, "discountPercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Number)
], Listing.prototype, "listingFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Listing.prototype, "feePaidAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['pending', 'paid', 'waived', null],
        default: null,
    }),
    __metadata("design:type", String)
], Listing.prototype, "listingFeeStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Listing.prototype, "isExpectingFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Listing.prototype, "wasLive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Number)
], Listing.prototype, "platformBid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Number)
], Listing.prototype, "counterOffer", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(contants_1.ListingStatus),
        default: contants_1.ListingStatus.InReview,
    }),
    __metadata("design:type", String)
], Listing.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            reviewedBy: { type: String },
            reviewedAt: { type: Date },
            rejectionReason: { type: String },
            adminNotes: { type: String },
        },
        default: null,
    }),
    __metadata("design:type", ReviewInfo)
], Listing.prototype, "reviewInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            country: { type: String },
            state: { type: String },
            city: { type: String },
        },
        default: null,
    }),
    __metadata("design:type", Object)
], Listing.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Listing.prototype, "whatsappNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], Listing.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Listing.prototype, "views", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Listing.prototype, "likes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Listing.prototype, "totalSales", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Listing.prototype, "affiliateEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['percent', 'flat'], default: 'percent' }),
    __metadata("design:type", String)
], Listing.prototype, "affiliateCommissionType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0, min: 0, max: 100 }),
    __metadata("design:type", Number)
], Listing.prototype, "affiliateCommissionPercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0, min: 0 }),
    __metadata("design:type", Number)
], Listing.prototype, "affiliateCommissionAmount", void 0);
exports.Listing = Listing = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    })
], Listing);
exports.ListingSchema = mongoose_1.SchemaFactory.createForClass(Listing);
exports.ListingSchema.virtual('isBuyable').get(function () {
    const buyableTypes = [contants_1.ListingType.Consignment, contants_1.ListingType.DirectPurchase, contants_1.ListingType.Admin];
    return buyableTypes.includes(this.type) && this.status === contants_1.ListingStatus.Live;
});
exports.ListingSchema.virtual('effectivePrice').get(function () {
    if (this.discountPrice) {
        return {
            amount: this.discountPrice,
            currency: this.askingPrice?.currency || contants_1.Currency.NGN,
        };
    }
    if (this.adminPricing?.sellingPrice) {
        return {
            amount: this.adminPricing.sellingPrice,
            currency: this.askingPrice?.currency || contants_1.Currency.NGN,
        };
    }
    return {
        amount: this.askingPrice?.amount,
        currency: this.askingPrice?.currency || contants_1.Currency.NGN,
    };
});
exports.ListingSchema.index({ storeId: 1, status: 1 });
exports.ListingSchema.index({ creatorId: 1, status: 1 });
exports.ListingSchema.index({ userId: 1 });
exports.ListingSchema.index({ type: 1, status: 1 });
exports.ListingSchema.index({ category: 1, status: 1 });
exports.ListingSchema.index({ category: 1, subCategory: 1, status: 1 });
exports.ListingSchema.index({ status: 1, createdAt: -1 });
exports.ListingSchema.index({ itemName: 'text', description: 'text', tags: 'text' });
exports.ListingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
//# sourceMappingURL=listing.schema.js.map