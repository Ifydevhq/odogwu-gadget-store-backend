/**
 * listings/dto/listing.dto.ts - Listing DTOs
 * =============================================
 * Data shapes for all listing operations.
 *
 * CreateListingDto: What a seller sends when posting an item.
 *   The seller picks a type (self_listing, consignment, direct_purchase)
 *   and fills in the product details.
 *
 * UpdateListingDto: For editing a listing before it's approved.
 *
 * AdminReviewDto: For admin to approve/reject listings.
 *   Includes pricing fields for consignment/direct purchase.
 *
 * QueryListingsDto: For browsing the marketplace feed.
 */

import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  OmitType,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@common/dto/pagination.dto';
import {
  ListingType,
  ListingStatus,
  ItemCondition,
  Currency,
} from '@config/contants';

// ═══════════════════════════════════════════════════════════════
// EMBEDDED DTOS
// ═══════════════════════════════════════════════════════════════

class ListingLocationDto {
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() state?: string;
  @IsString() @IsOptional() city?: string;
}

class PriceInfoDto {
  @ApiProperty({
    example: 1500000,
    description: 'Price in kobo (₦15,000 = 1500000)',
  })
  @IsNumber()
  @Min(100) // Minimum ₦1 (100 kobo)
  amount: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.NGN })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency = Currency.NGN;

  @ApiPropertyOptional({
    default: false,
    description: 'Is the price negotiable?',
  })
  @IsBoolean()
  @IsOptional()
  negotiable?: boolean = false;
}

class MediaItemDto {
  @ApiProperty({ example: 'https://example.com/product.jpg' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ enum: ['image', 'video'], default: 'image' })
  @IsEnum(['image', 'video'])
  @IsOptional()
  type?: string = 'image';

  @ApiPropertyOptional({ description: 'Thumbnail URL for videos' })
  @IsString()
  @IsOptional()
  thumbnail?: string;
}

// ═══════════════════════════════════════════════════════════════
// CREATE LISTING - Seller posts a new item
// ═══════════════════════════════════════════════════════════════

export class CreateListingDto {
  @ApiPropertyOptional({
    description:
      'Store this listing belongs to (optional — omit for creator-level listings)',
  })
  @IsString()
  @IsOptional()
  storeId?: string;

  @ApiProperty({ example: 'Handmade Leather Bag' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ example: 'Beautiful handcrafted leather bag, made from...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ItemCondition, example: ItemCondition.BrandNew })
  @IsEnum(ItemCondition)
  condition: ItemCondition;

  @ApiProperty({
    enum: ListingType,
    example: ListingType.SelfListing,
    description:
      'How this item will be sold: ' +
      'self_listing (sell yourself via WhatsApp), ' +
      'consignment (Comaket sells for you), ' +
      'direct_purchase (sell item to Comaket)',
  })
  @IsEnum(ListingType)
  type: ListingType;

  @ApiProperty({ type: PriceInfoDto })
  @ValidateNested()
  @Type(() => PriceInfoDto)
  askingPrice: PriceInfoDto;

  @ApiProperty({
    type: [MediaItemDto],
    description: 'At least 1 image required, max 10',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media: MediaItemDto[];

  @ApiPropertyOptional({ example: 'laptops' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 'hp',
    description: 'Sub-category slug (brand/type) within the category',
  })
  @IsString()
  @IsOptional()
  subCategory?: string;

  @ApiPropertyOptional({
    example: ['leather', 'handmade', 'bag'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: 5, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;

  @ApiPropertyOptional({
    example: 'Lagos, Nigeria',
    description: 'Item location',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ListingLocationDto)
  location?: ListingLocationDto;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'WhatsApp number for self-listing contact',
  })
  @IsString()
  @IsOptional()
  whatsappNumber?: string;
}

// ═══════════════════════════════════════════════════════════════
// UPDATE LISTING - Edit before approval
// ═══════════════════════════════════════════════════════════════

export class UpdateListingDto extends PartialType(
  OmitType(CreateListingDto, ['storeId', 'type'] as const),
) {}
// Can't change the store or selling type after creation

// ═══════════════════════════════════════════════════════════════
// ADMIN REVIEW - Approve, reject, set pricing
// ═══════════════════════════════════════════════════════════════

export class AdminReviewListingDto {
  @ApiProperty({
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
  })
  @IsString()
  action: string;

  @ApiPropertyOptional({
    example: 'Item does not meet quality standards',
    description: 'Required when rejecting',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Internal notes (not shown to seller)' })
  @IsString()
  @IsOptional()
  adminNotes?: string;

  // ─── Pricing (for consignment/direct purchase) ───────────

  @ApiPropertyOptional({
    example: 2000000,
    description: 'Selling price in kobo (consignment: what Comaket sells at)',
  })
  @IsNumber()
  @Min(100)
  @IsOptional()
  sellingPrice?: number;

  @ApiPropertyOptional({
    example: 1200000,
    description:
      'Purchase price in kobo (direct purchase: what Comaket pays seller)',
  })
  @IsNumber()
  @Min(100)
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Commission rate as percentage (e.g., 15 = 15%)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  commissionRate?: number;

  // ─── Direct purchase negotiation ─────────────────────────

  @ApiPropertyOptional({
    example: 8000000,
    description:
      "Platform bid amount in kobo (direct purchase: Comaket's offer to buy)",
  })
  @IsNumber()
  @Min(100)
  @IsOptional()
  platformBid?: number;
}

// ═══════════════════════════════════════════════════════════════
// QUERY LISTINGS - Marketplace browsing
// ═══════════════════════════════════════════════════════════════

export class QueryListingsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ListingType })
  @IsEnum(ListingType)
  @IsOptional()
  type?: ListingType;

  @ApiPropertyOptional({ enum: ListingStatus })
  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;

  @ApiPropertyOptional({ enum: ItemCondition })
  @IsEnum(ItemCondition)
  @IsOptional()
  condition?: ItemCondition;

  @ApiPropertyOptional({ example: 'laptops' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 'hp',
    description: 'Filter by sub-category slug (brand/type) within a category',
  })
  @IsString()
  @IsOptional()
  subCategory?: string;

  @ApiPropertyOptional({ description: 'Filter by store ID' })
  @IsString()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Filter by creator ID' })
  @IsString()
  @IsOptional()
  creatorId?: string;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Minimum price in kobo',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({
    example: 5000000,
    description: 'Maximum price in kobo',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    description:
      'Only show buyable items (consignment + direct purchase that are live)',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  buyableOnly?: boolean;
}
