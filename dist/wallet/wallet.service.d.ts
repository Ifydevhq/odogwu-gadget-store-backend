import { Model, Types } from 'mongoose';
import { WalletDocument } from './schemas/wallet.schema';
import { WalletBucket, WalletTransactionDocument, WalletTxnStatus, WalletTxnType } from './schemas/wallet-transaction.schema';
import { ListTransactionsDto } from './dto/list-transactions.dto';
interface CreditParams {
    userId: string | Types.ObjectId;
    amount: number;
    bucket: WalletBucket;
    type: WalletTxnType;
    status?: WalletTxnStatus;
    description?: string;
    orderId?: string | Types.ObjectId;
    refId?: string;
    idempotencyKey?: string;
    availableAt?: Date;
}
interface DebitParams {
    userId: string | Types.ObjectId;
    amount: number;
    bucket: WalletBucket;
    type: WalletTxnType;
    description?: string;
    orderId?: string | Types.ObjectId;
    idempotencyKey?: string;
}
export declare class WalletService {
    private readonly walletModel;
    private readonly txnModel;
    private readonly logger;
    constructor(walletModel: Model<WalletDocument>, txnModel: Model<WalletTransactionDocument>);
    private balanceFieldFor;
    getOrCreateWallet(userId: string | Types.ObjectId): Promise<WalletDocument>;
    getBalance(userId: string | Types.ObjectId): Promise<{
        promoBalance: number;
        earnedBalance: number;
        pendingBalance: number;
        total: number;
    }>;
    credit(params: CreditParams): Promise<WalletTransactionDocument>;
    matureTransaction(transactionId: string | Types.ObjectId): Promise<WalletTransactionDocument | null>;
    debit(params: DebitParams): Promise<WalletTransactionDocument>;
    reverse(originalTransactionId: string | Types.ObjectId, reason: string): Promise<WalletTransactionDocument | null>;
    reverseOrderRedemptions(orderId: string | Types.ObjectId, reason: string): Promise<number>;
    computeRedeemable(userId: string | Types.ObjectId, orderTotalKobo: number, maxPromoPercent: number): Promise<{
        promoApplied: number;
        earnedApplied: number;
        totalApplied: number;
    }>;
    listTransactions(userId: string | Types.ObjectId, dto: ListTransactionsDto): Promise<{
        data: (import("mongoose").FlattenMaps<WalletTransactionDocument> & {
            _id: Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
}
export {};
