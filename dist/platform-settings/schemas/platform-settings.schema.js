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
exports.PlatformSettingsSchema = exports.PlatformSettings = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let PlatformSettings = class PlatformSettings {
};
exports.PlatformSettings = PlatformSettings;
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: 'platform', unique: true }),
    __metadata("design:type", String)
], PlatformSettings.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], PlatformSettings.prototype, "freeListing", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], PlatformSettings.prototype, "noCommission", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 5 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "selfListingFeePercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 15 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "consignmentCommissionPercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 500000 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "listingFeeCapKobo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 2000000 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "consignmentCommissionCapKobo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], PlatformSettings.prototype, "selfListingEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], PlatformSettings.prototype, "consignmentEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], PlatformSettings.prototype, "directSaleEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], PlatformSettings.prototype, "autoApproveVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], PlatformSettings.prototype, "maintenanceMode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "starterPlanPriceKobo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 300000 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "proPlanPriceKobo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 800000 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "businessPlanPriceKobo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], PlatformSettings.prototype, "starterPlanActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], PlatformSettings.prototype, "proPlanActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], PlatformSettings.prototype, "businessPlanActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 50000 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "minListingPriceKobo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 10 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "maxListingImages", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 15 * 1024 * 1024 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "maxFileSizeBytes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 10 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "maxFilesPerUpload", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 72 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "maxReturnHoursBeforeAutoComplete", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "welcomeCreditAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 20 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "creditMaxPercentPerOrder", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 1000000 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "referralMinOrderAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 100000 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "referralRewardAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 7 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "affiliateHoldDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "affiliateDefaultCommissionPercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 100000 }),
    __metadata("design:type", Number)
], PlatformSettings.prototype, "minWithdrawalAmount", void 0);
exports.PlatformSettings = PlatformSettings = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PlatformSettings);
exports.PlatformSettingsSchema = mongoose_1.SchemaFactory.createForClass(PlatformSettings);
//# sourceMappingURL=platform-settings.schema.js.map