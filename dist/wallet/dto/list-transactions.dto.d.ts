import { PaginationDto } from '../../common/dto/pagination.dto';
import { WalletTxnStatus, WalletTxnType } from '../schemas/wallet-transaction.schema';
export declare class ListTransactionsDto extends PaginationDto {
    type?: WalletTxnType;
    status?: WalletTxnStatus;
}
