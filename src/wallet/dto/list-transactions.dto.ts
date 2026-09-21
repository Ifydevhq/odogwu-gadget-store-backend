import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  WalletTxnStatus,
  WalletTxnType,
} from '../schemas/wallet-transaction.schema';

export class ListTransactionsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by transaction type', enum: WalletTxnType })
  @IsOptional()
  @IsEnum(WalletTxnType)
  type?: WalletTxnType;

  @ApiPropertyOptional({ description: 'Filter by transaction status', enum: WalletTxnStatus })
  @IsOptional()
  @IsEnum(WalletTxnStatus)
  status?: WalletTxnStatus;
}
