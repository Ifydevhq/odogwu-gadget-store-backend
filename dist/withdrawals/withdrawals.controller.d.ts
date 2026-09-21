import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { SaveBankAccountDto } from './dto/save-bank-account.dto';
import { ProcessWithdrawalDto } from './dto/process-withdrawal.dto';
import { QueryWithdrawalsDto } from './dto/query-withdrawals.dto';
export declare class WithdrawalsController {
    private readonly withdrawalsService;
    constructor(withdrawalsService: WithdrawalsService);
    sendOtp(userId: string): Promise<{
        sent: true;
    }>;
    verifyOtp(userId: string, otp: string): Promise<{
        valid: true;
    }>;
    listBankAccounts(userId: string): Promise<import("mongoose").FlattenMaps<{
        _id?: import("mongoose").Types.ObjectId;
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
    }>[]>;
    saveBankAccount(userId: string, dto: SaveBankAccountDto): Promise<{
        _id?: import("mongoose").Types.ObjectId;
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
    }[]>;
    deleteBankAccount(userId: string, id: string): Promise<import("mongoose").FlattenMaps<{
        _id?: import("mongoose").Types.ObjectId;
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
    }>[]>;
    request(userId: string, dto: CreateWithdrawalDto): Promise<import("./schemas/withdrawal-request.schema").WithdrawalRequestDocument>;
    listMine(userId: string, dto: QueryWithdrawalsDto): Promise<{
        data: (import("mongoose").FlattenMaps<import("./schemas/withdrawal-request.schema").WithdrawalRequestDocument> & {
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
export declare class AdminWithdrawalsController {
    private readonly withdrawalsService;
    constructor(withdrawalsService: WithdrawalsService);
    adminList(dto: QueryWithdrawalsDto): Promise<{
        data: (import("mongoose").FlattenMaps<import("./schemas/withdrawal-request.schema").WithdrawalRequestDocument> & {
            _id: import("mongoose").Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    process(id: string, adminId: string, dto: ProcessWithdrawalDto): Promise<import("./schemas/withdrawal-request.schema").WithdrawalRequestDocument>;
}
