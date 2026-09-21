/**
 * users/dto/create-user.dto.ts - Create User Data Shape
 * ========================================================
 * A DTO (Data Transfer Object) defines what data is expected when
 * creating a new user. It's used INTERNALLY by the auth service —
 * the public-facing DTOs are in the auth/ folder (RegisterDto, etc.)
 *
 * The decorators do two things:
 * 1. VALIDATE: @IsEmail() checks format, @MinLength(2) checks length
 * 2. DOCUMENT: @ApiProperty() generates Swagger docs automatically
 *
 * When someone hits POST /auth/register, NestJS:
 * 1. Receives the JSON body
 * 2. Validates it against this DTO (rejects bad data with 400)
 * 3. Passes the clean, typed data to your controller method
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuthProvider } from '@config/contants';

class MobileDto {
  @ApiProperty({ example: '+2341234567890' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'NG', default: 'NG' })
  @IsString()
  @IsOptional()
  isoCode?: string = 'NG';
}

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'StrongP@ss1' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ enum: AuthProvider })
  @IsEnum(AuthProvider)
  @IsOptional()
  authProvider?: AuthProvider;

  @ApiPropertyOptional({ type: MobileDto })
  @ValidateNested()
  @Type(() => MobileDto)
  @IsOptional()
  mobile?: MobileDto;

  @ApiPropertyOptional({
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsISO8601()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Nigeria' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Ikeja' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  // ─── Internal fields (set by auth service, not by the user) ───

  // Resolved referrer's user id (from the referral code used at signup).
  @IsMongoId()
  @IsOptional()
  referredBy?: string;

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @IsString()
  @IsOptional()
  verificationCode?: string;

  @Type(() => Date)
  @IsOptional()
  verificationExpires?: Date;

  @IsString()
  @IsOptional()
  passwordResetToken?: string;

  @Type(() => Date)
  @IsOptional()
  passwordResetExpires?: Date;
}