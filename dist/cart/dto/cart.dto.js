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
exports.CheckoutCartDto = exports.ShippingAddressDto = exports.UpdateCartItemDto = exports.AddToCartDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class AddToCartDto {
    constructor() {
        this.quantity = 1;
    }
}
exports.AddToCartDto = AddToCartDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Listing ID to add',
        example: '65e5f6a7b8c9d0e1f2a3b4c5',
    }),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], AddToCartDto.prototype, "listingId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quantity to add', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AddToCartDto.prototype, "quantity", void 0);
class UpdateCartItemDto {
}
exports.UpdateCartItemDto = UpdateCartItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'New quantity' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateCartItemDto.prototype, "quantity", void 0);
class ShippingAddressDto {
}
exports.ShippingAddressDto = ShippingAddressDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "zipCode", void 0);
class CheckoutCartDto {
}
exports.CheckoutCartDto = CheckoutCartDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Shipping address' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ShippingAddressDto),
    __metadata("design:type", ShippingAddressDto)
], CheckoutCartDto.prototype, "shippingAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Listing IDs to checkout. If omitted, all valid cart items are checked out.',
        example: ['65e5f6a7b8c9d0e1f2a3b4c5'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    __metadata("design:type", Array)
], CheckoutCartDto.prototype, "listingIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email for order receipts. Overrides user email if provided.',
        example: 'buyer@example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckoutCartDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Note to sellers' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckoutCartDto.prototype, "buyerNote", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Payment callback URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckoutCartDto.prototype, "callbackUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Delivery fee in kobo (from delivery zones)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CheckoutCartDto.prototype, "deliveryFee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Payment method (defaults to paystack)',
        enum: ['paystack', 'opay', 'pay_on_delivery'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['paystack', 'opay', 'pay_on_delivery']),
    __metadata("design:type", String)
], CheckoutCartDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Opt in to pay part of this checkout with wallet/store credit. When ' +
            'true, the server applies the maximum redeemable credit and reduces the ' +
            'amount charged to the provider (or collected on delivery). Absent/' +
            'false = no credit applied (unchanged behaviour).',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CheckoutCartDto.prototype, "applyWalletCredit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional cap (kobo) on wallet credit to apply. A positive value also ' +
            'opts the checkout in. Never exceeds the redeemable maximum or the total.',
        example: 50000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CheckoutCartDto.prototype, "walletCreditAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional map of listingId -> affiliate code. Resolved per item at ' +
            'order build time; invalid entries are ignored and never block checkout.',
        example: { '65e5f6a7b8c9d0e1f2a3b4c5': 'AB12CD' },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CheckoutCartDto.prototype, "affiliateCodes", void 0);
//# sourceMappingURL=cart.dto.js.map