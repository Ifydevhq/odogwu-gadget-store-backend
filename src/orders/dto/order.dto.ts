/**
 * orders/dto/order.dto.ts - Order DTOs
 * =======================================
 * Data shapes for order operations.
 *
 * CreateOrderDto: What a buyer sends when purchasing an item.
 *   Just the listing ID, quantity, and shipping address.
 *   Pricing is calculated server-side from the listing data.
 *
 * UpdateOrderStatusDto: For admin to move orders through the pipeline.
 *
 * QueryOrdersDto: For browsing orders (buyer, seller, admin views).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@common/dto/pagination.dto';
import { OrderStatus, PaymentStatus } from '@config/contants';

// ═══════════════════════════════════════════════════════════════
// SHIPPING ADDRESS
// ═══════════════════════════════════════════════════════════════

class ShippingAddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '12 Broad Street, Ikeja' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Ikeja' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ example: 'Nigeria', default: 'Nigeria' })
  @IsString()
  @IsOptional()
  country?: string = 'Nigeria';

  @ApiPropertyOptional({ example: '100001' })
  @IsString()
  @IsOptional()
  zipCode?: string;
}

// ═══════════════════════════════════════════════════════════════
// CREATE ORDER - Buyer places an order
// ═══════════════════════════════════════════════════════════════

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID of the listing to purchase',
  })
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({
    example: 'Please handle with care',
    description: 'Special instructions for the order',
  })
  @IsString()
  @IsOptional()
  buyerNote?: string;

  // ─── Wallet credit (opt-in) ──────────────────────────────
  @ApiPropertyOptional({
    description:
      'Opt in to pay part of this order with wallet/store credit. When true, ' +
      'the server applies the maximum redeemable credit (promo capped at the ' +
      'platform %, earned uncapped) and reduces the amount charged to the ' +
      'payment provider. Absent/false = no credit applied.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  applyWalletCredit?: boolean;

  @ApiPropertyOptional({
    description:
      'Optional cap (kobo) on how much wallet credit to apply. Presence of a ' +
      'positive value also opts the order in. Never exceeds the redeemable ' +
      'maximum or the order total.',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  walletCreditAmount?: number;

  // ─── Affiliate attribution ───────────────────────────────
  @ApiPropertyOptional({
    description:
      'Optional map of listingId -> affiliate code. When a code resolves to a ' +
      'valid affiliate (not the buyer) and the listing has affiliate enabled, ' +
      'the commission is snapshotted onto the order item. Invalid entries are ' +
      'silently ignored and never block checkout.',
    example: { '65e5f6a7b8c9d0e1f2a3b4c5': 'AB12CD' },
  })
  @IsObject()
  @IsOptional()
  affiliateCodes?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// UPDATE ORDER STATUS - Admin moves order through pipeline
// ═══════════════════════════════════════════════════════════════

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description:
      'New order status. Optional so an admin can record a payment without ' +
      'also moving the order along the fulfilment track.',
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description:
      'New payment status. Setting this to "success" is how a pay-on-delivery ' +
      'order is settled once cash has been collected — it stamps paidAt and ' +
      'sends the buyer their receipt.',
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Admin note about this status change' })
  @IsString()
  @IsOptional()
  adminNote?: string;

  @ApiPropertyOptional({
    description: 'Reason for cancellation (when cancelling)',
  })
  @IsString()
  @IsOptional()
  cancellationReason?: string;

  // ─── Shipping info (when marking as shipped) ─────────────

  @ApiPropertyOptional({ example: 'GIG Logistics' })
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiPropertyOptional({ example: 'TRK-123456789' })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z' })
  @IsOptional()
  estimatedDelivery?: string;
}

// ═══════════════════════════════════════════════════════════════
// QUERY ORDERS
// ═══════════════════════════════════════════════════════════════

export class QueryOrdersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    enum: [
      'awaiting_completion',
      'awaiting_disbursement',
      'disbursed',
      'not_applicable',
    ],
    description: 'Filter by disbursement status',
  })
  @IsString()
  @IsOptional()
  disbursementStatus?: string;

  @ApiPropertyOptional({ description: 'Filter by store ID' })
  @IsString()
  @IsOptional()
  storeId?: string;
}