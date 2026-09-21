import {
  IsMongoId,
  IsNumber,
  Min,
  IsOptional,
  ValidateNested,
  IsString,
  IsArray,
  IsIn,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({
    description: 'Listing ID to add',
    example: '65e5f6a7b8c9d0e1f2a3b4c5',
  })
  @IsMongoId()
  listingId: string;

  @ApiPropertyOptional({ description: 'Quantity to add', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number = 1;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ShippingAddressDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsString()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;
}

export class CheckoutCartDto {
  @ApiProperty({ description: 'Shipping address' })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({
    description:
      'Listing IDs to checkout. If omitted, all valid cart items are checked out.',
    example: ['65e5f6a7b8c9d0e1f2a3b4c5'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  listingIds?: string[];

  @ApiPropertyOptional({
    description: 'Email for order receipts. Overrides user email if provided.',
    example: 'buyer@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Note to sellers' })
  @IsOptional()
  @IsString()
  buyerNote?: string;

  @ApiPropertyOptional({ description: 'Payment callback URL' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiPropertyOptional({ description: 'Delivery fee in kobo (from delivery zones)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiPropertyOptional({
    description: 'Payment method (defaults to paystack)',
    enum: ['paystack', 'opay', 'pay_on_delivery'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['paystack', 'opay', 'pay_on_delivery'])
  paymentMethod?: 'paystack' | 'opay' | 'pay_on_delivery';

  // ─── Wallet credit (opt-in) ──────────────────────────────
  @ApiPropertyOptional({
    description:
      'Opt in to pay part of this checkout with wallet/store credit. When ' +
      'true, the server applies the maximum redeemable credit and reduces the ' +
      'amount charged to the provider (or collected on delivery). Absent/' +
      'false = no credit applied (unchanged behaviour).',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  applyWalletCredit?: boolean;

  @ApiPropertyOptional({
    description:
      'Optional cap (kobo) on wallet credit to apply. A positive value also ' +
      'opts the checkout in. Never exceeds the redeemable maximum or the total.',
    example: 50000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  walletCreditAmount?: number;

  // ─── Affiliate attribution ───────────────────────────────
  @ApiPropertyOptional({
    description:
      'Optional map of listingId -> affiliate code. Resolved per item at ' +
      'order build time; invalid entries are ignored and never block checkout.',
    example: { '65e5f6a7b8c9d0e1f2a3b4c5': 'AB12CD' },
  })
  @IsOptional()
  @IsObject()
  affiliateCodes?: Record<string, string>;
}
