/**
 * phone-verification/dto/phone.dto.ts
 * ====================================
 * Request shapes for the phone verification endpoints. The raw phoneNumber is
 * accepted in any common Nigerian format and normalized to E.164 server-side.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestPhoneOtpDto {
  @ApiProperty({
    example: '08031234567',
    description:
      'Nigerian phone number in any common format (0803..., +234803..., 234803...)',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class VerifyPhoneOtpDto {
  @ApiProperty({
    example: '08031234567',
    description: 'The same phone number the OTP was requested for',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '123456', description: 'The SMS OTP code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
