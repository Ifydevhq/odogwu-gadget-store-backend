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
exports.QueryOrdersDto = exports.UpdateOrderStatusDto = exports.CreateOrderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const contants_1 = require("../../config/contants");
class ShippingAddressDto {
    constructor() {
        this.country = 'Nigeria';
    }
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+2348012345678' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12 Broad Street, Ikeja' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ikeja' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Lagos' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Nigeria', default: 'Nigeria' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '100001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "zipCode", void 0);
class CreateOrderDto {
    constructor() {
        this.quantity = 1;
    }
}
exports.CreateOrderDto = CreateOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the listing to purchase',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "listingId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, default: 1, minimum: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ShippingAddressDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ShippingAddressDto),
    __metadata("design:type", ShippingAddressDto)
], CreateOrderDto.prototype, "shippingAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Please handle with care',
        description: 'Special instructions for the order',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "buyerNote", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Opt in to pay part of this order with wallet/store credit. When true, ' +
            'the server applies the maximum redeemable credit (promo capped at the ' +
            'platform %, earned uncapped) and reduces the amount charged to the ' +
            'payment provider. Absent/false = no credit applied.',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateOrderDto.prototype, "applyWalletCredit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional cap (kobo) on how much wallet credit to apply. Presence of a ' +
            'positive value also opts the order in. Never exceeds the redeemable ' +
            'maximum or the order total.',
        example: 50000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "walletCreditAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional map of listingId -> affiliate code. When a code resolves to a ' +
            'valid affiliate (not the buyer) and the listing has affiliate enabled, ' +
            'the commission is snapshotted onto the order item. Invalid entries are ' +
            'silently ignored and never block checkout.',
        example: { '65e5f6a7b8c9d0e1f2a3b4c5': 'AB12CD' },
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateOrderDto.prototype, "affiliateCodes", void 0);
class UpdateOrderStatusDto {
}
exports.UpdateOrderStatusDto = UpdateOrderStatusDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: contants_1.OrderStatus,
        description: 'New order status. Optional so an admin can record a payment without ' +
            'also moving the order along the fulfilment track.',
    }),
    (0, class_validator_1.IsEnum)(contants_1.OrderStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: contants_1.PaymentStatus,
        description: 'New payment status. Setting this to "success" is how a pay-on-delivery ' +
            'order is settled once cash has been collected — it stamps paidAt and ' +
            'sends the buyer their receipt.',
    }),
    (0, class_validator_1.IsEnum)(contants_1.PaymentStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "paymentStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Admin note about this status change' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "adminNote", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Reason for cancellation (when cancelling)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "cancellationReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'GIG Logistics' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "carrier", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'TRK-123456789' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "trackingNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-03-01T00:00:00Z' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "estimatedDelivery", void 0);
class QueryOrdersDto extends pagination_dto_1.PaginationDto {
}
exports.QueryOrdersDto = QueryOrdersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: contants_1.OrderStatus }),
    (0, class_validator_1.IsEnum)(contants_1.OrderStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryOrdersDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: contants_1.PaymentStatus }),
    (0, class_validator_1.IsEnum)(contants_1.PaymentStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryOrdersDto.prototype, "paymentStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: [
            'awaiting_completion',
            'awaiting_disbursement',
            'disbursed',
            'not_applicable',
        ],
        description: 'Filter by disbursement status',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryOrdersDto.prototype, "disbursementStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by store ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryOrdersDto.prototype, "storeId", void 0);
//# sourceMappingURL=order.dto.js.map