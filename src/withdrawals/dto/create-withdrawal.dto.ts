import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({
    description: 'Amount to withdraw, in KOBO (₦1 = 100 kobo).',
    example: 150000,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'The 6-digit code emailed to the user (send-otp step).',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiPropertyOptional({ description: 'Bank name for the offline payout.' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Paystack bank code for the payout bank.' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ description: 'Account number for the offline payout.' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'Paystack-resolved account holder name for the payout.',
  })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({
    description: 'Save these bank details for next time.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  saveAccount?: boolean;
}
