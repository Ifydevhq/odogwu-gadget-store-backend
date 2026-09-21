import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** A Paystack-verified bank account the user wants to save for future payouts. */
export class SaveBankAccountDto {
  @ApiProperty({ example: 'Access Bank' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ example: '044' })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: 'JOHN DOE' })
  @IsString()
  @IsNotEmpty()
  accountName: string;
}
