import { Model, Types } from 'mongoose';
import { WalletService } from '../wallet/wallet.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { WithdrawalRequestDocument } from './schemas/withdrawal-request.schema';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ProcessWithdrawalDto } from './dto/process-withdrawal.dto';
import { QueryWithdrawalsDto } from './dto/query-withdrawals.dto';
export declare class WithdrawalsService {
    private readonly withdrawalModel;
    private readonly walletService;
    private readonly platformSettingsService;
    private readonly logger;
    constructor(withdrawalModel: Model<WithdrawalRequestDocument>, walletService: WalletService, platformSettingsService: PlatformSettingsService);
    request(userId: string | Types.ObjectId, dto: CreateWithdrawalDto): Promise<WithdrawalRequestDocument>;
    listMine(userId: string | Types.ObjectId, { page, perPage }: QueryWithdrawalsDto): Promise<{
        data: (import("mongoose").FlattenMaps<WithdrawalRequestDocument> & {
            _id: Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    adminList({ page, perPage, status }: QueryWithdrawalsDto): Promise<{
        data: (import("mongoose").FlattenMaps<WithdrawalRequestDocument> & {
            _id: Types.ObjectId;
        })[];
        pagination: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    process(requestId: string, adminId: string | Types.ObjectId, dto: ProcessWithdrawalDto): Promise<WithdrawalRequestDocument>;
}
