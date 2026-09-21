import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { WithdrawalStatus } from '../schemas/withdrawal-request.schema';

export class QueryWithdrawalsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by withdrawal status.',
    enum: WithdrawalStatus,
  })
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;
}
