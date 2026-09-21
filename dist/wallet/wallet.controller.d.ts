import { WalletService } from './wallet.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getBalance(userId: string): Promise<{
        promoBalance: number;
        earnedBalance: number;
        pendingBalance: number;
        total: number;
    }>;
    listTransactions(userId: string, dto: ListTransactionsDto): Promise<{
        data: (import("mongoose").FlattenMaps<import("./schemas/wallet-transaction.schema").WalletTransactionDocument> & {
            _id: import("mongoose").Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
}
