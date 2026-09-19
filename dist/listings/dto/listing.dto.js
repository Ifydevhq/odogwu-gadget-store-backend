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
exports.QueryListingsDto = exports.AdminReviewListingDto = exports.UpdateListingDto = exports.CreateListingDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const contants_1 = require("../../config/contants");
class ListingLocationDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListingLocationDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListingLocationDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListingLocationDto.prototype, "city", void 0);
class PriceInfoDto {
    constructor() {
        this.currency = contants_1.Currency.NGN;
        this.negotiable = false;
    }
}
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1500000,
        description: 'Price in kobo (₦15,000 = 1500000)',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100),
    __metadata("design:type", Number)
], PriceInfoDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: contants_1.Currency, default: contants_1.Currency.NGN }),
    (0, class_validator_1.IsEnum)(contants_1.Currency),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PriceInfoDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: false,
        description: 'Is the price negotiable?',
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PriceInfoDto.prototype, "negotiable", void 0);
class MediaItemDto {
    constructor() {
        this.type = 'image';
    }
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://example.com/product.jpg' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MediaItemDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['image', 'video'], default: 'image' }),
    (0, class_validator_1.IsEnum)(['image', 'video']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MediaItemDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Thumbnail URL for videos' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MediaItemDto.prototype, "thumbnail", void 0);
class CreateListingDto {
    constructor() {
        this.quantity = 1;
    }
}
exports.CreateListingDto = CreateListingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Store this listing belongs to (optional — omit for creator-level listings)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Handmade Leather Bag' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "itemName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Beautiful handcrafted leather bag, made from...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: contants_1.ItemCondition, example: contants_1.ItemCondition.BrandNew }),
    (0, class_validator_1.IsEnum)(contants_1.ItemCondition),
    __metadata("design:type", String)
], CreateListingDto.prototype, "condition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: contants_1.ListingType,
        example: contants_1.ListingType.SelfListing,
        description: 'How this item will be sold: ' +
            'self_listing (sell yourself via WhatsApp), ' +
            'consignment (Comaket sells for you), ' +
            'direct_purchase (sell item to Comaket)',
    }),
    (0, class_validator_1.IsEnum)(contants_1.ListingType),
    __metadata("design:type", String)
], CreateListingDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: PriceInfoDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PriceInfoDto),
    __metadata("design:type", PriceInfoDto)
], CreateListingDto.prototype, "askingPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 2000000,
        description: 'Optional former/original price in kobo. When higher than the asking ' +
            '(selling) price it is struck through on the marketplace and the ' +
            'discount percent is auto-calculated.',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "formerPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [MediaItemDto],
        description: 'At least 1 image required, max 10',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MediaItemDto),
    __metadata("design:type", Array)
], CreateListingDto.prototype, "media", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'laptops' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'hp',
        description: 'Sub-category slug (brand/type) within the category',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "subCategory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['leather', 'handmade', 'bag'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateListingDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5, default: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Lagos, Nigeria',
        description: 'Item location',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ListingLocationDto),
    __metadata("design:type", ListingLocationDto)
], CreateListingDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '+2348012345678',
        description: 'WhatsApp number for self-listing contact',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "whatsappNumber", void 0);
class UpdateListingDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(CreateListingDto, ['storeId', 'type'])) {
}
exports.UpdateListingDto = UpdateListingDto;
class AdminReviewListingDto {
}
exports.AdminReviewListingDto = AdminReviewListingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [
            'approve',
            'reject',
            'suspend',
            'reinstate',
            'delist',
            'make_offer',
            'accept_counter',
            'reject_counter',
            'mark_awaiting_fee',
            'mark_awaiting_product',
            'mark_live',
            'mark_received',
        ],
        description: 'Admin action on the listing',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminReviewListingDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Item does not meet quality standards',
        description: 'Required when rejecting',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdminReviewListingDto.prototype, "rejectionReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Internal notes (not shown to seller)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdminReviewListingDto.prototype, "adminNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 2000000,
        description: 'Selling price in kobo (consignment: what Comaket sells at)',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdminReviewListingDto.prototype, "sellingPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1200000,
        description: 'Purchase price in kobo (direct purchase: what Comaket pays seller)',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdminReviewListingDto.prototype, "purchasePrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 15,
        description: 'Commission rate as percentage (e.g., 15 = 15%)',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdminReviewListingDto.prototype, "commissionRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 8000000,
        description: "Platform bid amount in kobo (direct purchase: Comaket's offer to buy)",
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdminReviewListingDto.prototype, "platformBid", void 0);
class QueryListingsDto extends pagination_dto_1.PaginationDto {
}
exports.QueryListingsDto = QueryListingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: contants_1.ListingType }),
    (0, class_validator_1.IsEnum)(contants_1.ListingType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryListingsDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: contants_1.ListingStatus }),
    (0, class_validator_1.IsEnum)(contants_1.ListingStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryListingsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: contants_1.ItemCondition }),
    (0, class_validator_1.IsEnum)(contants_1.ItemCondition),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryListingsDto.prototype, "condition", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'laptops' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryListingsDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'hp',
        description: 'Filter by sub-category slug (brand/type) within a category',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryListingsDto.prototype, "subCategory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by store ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryListingsDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by creator ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryListingsDto.prototype, "creatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 50000,
        description: 'Minimum price in kobo',
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryListingsDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 5000000,
        description: 'Maximum price in kobo',
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryListingsDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Only show buyable items (consignment + direct purchase that are live)',
    }),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], QueryListingsDto.prototype, "buyableOnly", void 0);
//# sourceMappingURL=listing.dto.js.map