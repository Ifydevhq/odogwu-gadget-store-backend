import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({
    description: 'Amount to withdraw, in KOBO (₦1 = 100 kobo).',
    example: 150000,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Bank name for the offline payout.' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Account number for the offline payout.' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Account holder name for the offline payout.' })
  @IsOptional()
  @IsString()
  accountName?: string;
}
