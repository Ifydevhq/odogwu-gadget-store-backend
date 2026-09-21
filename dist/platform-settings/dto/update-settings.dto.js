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
exports.UpdatePlatformSettingsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdatePlatformSettingsDto {
}
exports.UpdatePlatformSettingsDto = UpdatePlatformSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Waive self-listing fees' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlatformSettingsDto.prototype, "freeListing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Waive consignment commissions' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlatformSettingsDto.prototype, "noCommission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Self-listing fee %', example: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "selfListingFeePercent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Consignment commission %', example: 15 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "consignmentCommissionPercent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Listing fee cap in kobo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "listingFeeCapKobo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Consignment commission cap in kobo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "consignmentCommissionCapKobo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlatformSettingsDto.prototype, "selfListingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlatformSettingsDto.prototype, "consignmentEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlatformSettingsDto.prototype, "directSaleEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlatformSettingsDto.prototype, "autoApproveVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlatformSettingsDto.prototype, "maintenanceMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Starter plan price in kobo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "starterPlanPriceKobo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Pro plan price in kobo', example: 300000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "proPlanPriceKobo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Business plan price in kobo', example: 800000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "businessPlanPriceKobo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Starter plan active' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlatformSettingsDto.prototype, "starterPlanActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Pro plan active' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlatformSettingsDto.prototype, "proPlanActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Business plan active' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlatformSettingsDto.prototype, "businessPlanActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Min listing price in kobo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "minListingPriceKobo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Max images per listing' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "maxListingImages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Max hours before auto-complete (return window)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "maxReturnHoursBeforeAutoComplete", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Welcome/promo credit per verified phone in kobo (0 = disabled)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "welcomeCreditAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Max % of an order payable from promo credit', example: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "creditMaxPercentPerOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Referee cumulative spend that triggers referrer reward, in kobo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "referralMinOrderAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Referrer reward amount in kobo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "referralRewardAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Days an affiliate commission stays pending before maturing', example: 7 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "affiliateHoldDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Default affiliate commission %', example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "affiliateDefaultCommissionPercent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Minimum wallet withdrawal request in kobo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePlatformSettingsDto.prototype, "minWithdrawalAmount", void 0);
//# sourceMappingURL=update-settings.dto.js.map