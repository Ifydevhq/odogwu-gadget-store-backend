/**
 * auth/dto/auth.dto.ts - Authentication DTOs
 * =============================================
 * All the data shapes for auth-related requests, grouped in one file
 * since they're closely related. Each DTO validates what the frontend
 * sends to a specific auth endpoint.
 *
 * In your Redymit app these were in separate files. Grouping them is
 * cleaner when they're small — fewer files to manage. If any grows
 * complex, we can split it out later.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// ═══════════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════════

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ss1', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    example: 'AB12CD34',
    description: "Referrer's referral code (optional). Invalid codes are ignored.",
  })
  @IsString()
  @IsOptional()
  referralCode?: string;
}

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ss1' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

// ═══════════════════════════════════════════════════════════════
// GOOGLE AUTH - Frontend sends the Google access token
// ═══════════════════════════════════════════════════════════════

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google OAuth access token from the frontend',
    example: 'ya29.a0AfH6SM...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

// ═══════════════════════════════════════════════════════════════
// EMAIL VERIFICATION
// ═══════════════════════════════════════════════════════════════

export class VerifyEmailDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}

// ═══════════════════════════════════════════════════════════════
// PASSWORD RESET
// ═══════════════════════════════════════════════════════════════

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token received via email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewStrongP@ss1', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}