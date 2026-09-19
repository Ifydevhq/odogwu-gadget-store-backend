import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

// ─── Create Conversation ───────────────────────────────────────────

class ProductContextDto {
  @ApiProperty()
  @IsString()
  listingId: string;

  @ApiProperty()
  @IsString()
  itemName: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;
}

export class CreateConversationDto {
  @ApiProperty({ description: 'The other participant user ID' })
  @IsString()
  participantId: string;

  @ApiPropertyOptional({ description: 'Product context if initiated from a listing' })
  @ValidateNested()
  @Type(() => ProductContextDto)
  @IsOptional()
  productContext?: ProductContextDto;

  @ApiPropertyOptional({ description: 'Initial message to send' })
  @IsString()
  @IsOptional()
  initialMessage?: string;

  @ApiPropertyOptional({ description: 'Hint: creator or store', enum: ['creator', 'store'] })
  @IsString()
  @IsOptional()
  participantType?: 'creator' | 'store';
}

// ─── Send Message ──────────────────────────────────────────────────

class ProductCardDto {
  @ApiProperty()
  @IsString()
  listingId: string;

  @ApiProperty()
  @IsString()
  itemName: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  storeName?: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: ['text', 'image', 'product_card', 'product'] })
  @IsEnum(['text', 'image', 'product_card', 'product'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => ProductCardDto)
  @IsOptional()
  productCard?: ProductCardDto;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata for the message' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'ID of the message being replied to' })
  @IsString()
  @IsOptional()
  replyTo?: string;
}

// ─── Edit Message ──────────────────────────────────────────────────

export class EditMessageDto {
  @ApiProperty()
  @IsString()
  content: string;
}

// ─── Query Messages ────────────────────────────────────────────────

export class QueryMessagesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Cursor: get messages before this timestamp' })
  @IsString()
  @IsOptional()
  before?: string;
}

// ─── Search ────────────────────────────────────────────────────────

export class SearchChatDto {
  @ApiProperty()
  @IsString()
  q: string;
}
