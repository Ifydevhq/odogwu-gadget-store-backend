import { PaginationDto } from '../../common/dto/pagination.dto';
import { WithdrawalStatus } from '../schemas/withdrawal-request.schema';
export declare class QueryWithdrawalsDto extends PaginationDto {
    status?: WithdrawalStatus;
}
