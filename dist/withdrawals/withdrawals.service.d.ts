import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { WalletService } from '../wallet/wallet.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserDocument } from '../users/schemas/user.schema';
import { WithdrawalRequestDocument } from './schemas/withdrawal-request.schema';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { SaveBankAccountDto } from './dto/save-bank-account.dto';
import { ProcessWithdrawalDto } from './dto/process-withdrawal.dto';
import { QueryWithdrawalsDto } from './dto/query-withdrawals.dto';
export declare class WithdrawalsService {
    private readonly withdrawalModel;
    private readonly userModel;
    private readonly walletService;
    private readonly platformSettingsService;
    private readonly notificationsService;
    private readonly configService;
    private readonly logger;
    private readonly otpPepper;
    constructor(withdrawalModel: Model<WithdrawalRequestDocument>, userModel: Model<UserDocument>, walletService: WalletService, platformSettingsService: PlatformSettingsService, notificationsService: NotificationsService, configService: ConfigService);
    private hashOtp;
    sendOtp(userId: string): Promise<{
        sent: true;
    }>;
    private validateOtp;
    verifyOtp(userId: string, code: string): Promise<{
        valid: true;
    }>;
    listBankAccounts(userId: string): Promise<import("mongoose").FlattenMaps<{
        _id?: Types.ObjectId;
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
    }>[]>;
    saveBankAccount(userId: string, dto: SaveBankAccountDto): Promise<{
        _id?: Types.ObjectId;
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
    }[]>;
    deleteBankAccount(userId: string, accountId: string): Promise<import("mongoose").FlattenMaps<{
        _id?: Types.ObjectId;
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
    }>[]>;
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
