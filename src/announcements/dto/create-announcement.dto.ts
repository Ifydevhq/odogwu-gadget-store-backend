import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { UserRole } from '@config/contants';

export type AnnouncementChannel = 'in_app' | 'push' | 'email';
export type AnnouncementAudience = 'all' | 'role' | 'users';

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    isArray: true,
    enum: ['in_app', 'push', 'email'],
    description: 'Delivery channels (at least one)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['in_app', 'push', 'email'], { each: true })
  channels: AnnouncementChannel[];

  @ApiProperty({ enum: ['all', 'role', 'users'] })
  @IsIn(['all', 'role', 'users'])
  audienceType: AnnouncementAudience;

  @ApiPropertyOptional({ enum: UserRole, description: 'Required when audienceType = role' })
  @IsOptional()
  @IsEnum(UserRole)
  audienceRole?: UserRole;

  @ApiPropertyOptional({ type: [String], description: 'Required when audienceType = users' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audienceUserIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Arbitrary payload, e.g. { route: "/shop" }' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'ISO date; if in the future the announcement is scheduled' })
  @IsOptional()
  @IsDateString()
  scheduleAt?: string;
}
