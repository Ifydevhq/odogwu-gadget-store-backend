/**
 * withdrawals/withdrawals.service.ts
 * ===================================
 * REQUEST-ONLY withdrawals. There is NO Paystack payout here.
 *
 * FLOW
 *   request()  → validate against min & available EARNED balance, create a
 *                pending WithdrawalRequest, then DEBIT the wallet (Earned bucket)
 *                to HOLD the money so it can't be double-spent. The debit uses an
 *                idempotencyKey derived from the request _id.
 *   process()  → admin acts on a pending request:
 *                  mark_paid → status=paid (money already left; admin paid offline)
 *                  reject    → reverse the hold debit (funds return) → status=rejected
 *
 * All amounts are in KOBO.
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WalletService } from '../wallet/wallet.service';
import {
  WalletBucket,
  WalletTxnType,
} from '../wallet/schemas/wallet-transaction.schema';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import {
  WithdrawalRequest,
  WithdrawalRequestDocument,
  WithdrawalStatus,
} from './schemas/withdrawal-request.schema';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import {
  ProcessWithdrawalDto,
  WithdrawalAction,
} from './dto/process-withdrawal.dto';
import { QueryWithdrawalsDto } from './dto/query-withdrawals.dto';

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);

  constructor(
    @InjectModel(WithdrawalRequest.name)
    private readonly withdrawalModel: Model<WithdrawalRequestDocument>,
    private readonly walletService: WalletService,
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════
  // REQUEST (user)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create a withdrawal request and immediately HOLD the funds by debiting the
   * user's EARNED bucket. Validates against the platform minimum and the user's
   * available earned balance before touching the wallet.
   */
  async request(
    userId: string | Types.ObjectId,
    dto: CreateWithdrawalDto,
  ): Promise<WithdrawalRequestDocument> {
    const settings = await this.platformSettingsService.getSettings();
    const minWithdrawal = settings.minWithdrawalAmount;

    if (dto.amount < minWithdrawal) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ${minWithdrawal} kobo (₦${(
          minWithdrawal / 100
        ).toLocaleString()}).`,
      );
    }

    const { earnedBalance } = await this.walletService.getBalance(userId);
    if (dto.amount > earnedBalance) {
      throw new BadRequestException('Insufficient available balance');
    }

    // Create the request first so we have an _id to use as the idempotency key.
    const request = await this.withdrawalModel.create({
      userId: new Types.ObjectId(String(userId)),
      amount: dto.amount,
      status: WithdrawalStatus.Pending,
      bankName: dto.bankName ?? null,
      accountNumber: dto.accountNumber ?? null,
      accountName: dto.accountName ?? null,
      requestedAt: new Date(),
    });

    // HOLD the money: debit the Earned bucket. If this fails (e.g. a race that
    // drained the balance), void the request and surface a clean error.
    try {
      const txn = await this.walletService.debit({
        userId,
        amount: dto.amount,
        bucket: WalletBucket.Earned,
        type: WalletTxnType.Withdrawal,
        description: 'Withdrawal request',
        idempotencyKey: `withdrawal:${request._id}`,
      });

      request.walletTxnId = txn._id as Types.ObjectId;
      await request.save();
    } catch (err) {
      // Roll back the orphaned request so the user can retry cleanly.
      await this.withdrawalModel.deleteOne({ _id: request._id }).exec();
      if (err instanceof BadRequestException) {
        throw new BadRequestException('Insufficient available balance');
      }
      this.logger.error(
        `Failed to hold funds for withdrawal ${request._id}: ${
          (err as Error)?.message
        }`,
      );
      throw new BadRequestException('Could not process withdrawal request');
    }

    return request;
  }

  // ═══════════════════════════════════════════════════════════════════
  // LIST (user)
  // ═══════════════════════════════════════════════════════════════════

  async listMine(
    userId: string | Types.ObjectId,
    { page = 1, perPage = 20 }: QueryWithdrawalsDto,
  ) {
    const filter = { userId: new Types.ObjectId(String(userId)) };

    const [data, total] = await Promise.all([
      this.withdrawalModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean()
        .exec(),
      this.withdrawalModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // LIST (admin)
  // ═══════════════════════════════════════════════════════════════════

  async adminList({ page = 1, perPage = 20, status }: QueryWithdrawalsDto) {
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.withdrawalModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate('userId', 'name email phone')
        .lean()
        .exec(),
      this.withdrawalModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // PROCESS (admin)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Act on a PENDING request. Rejecting reverses the hold debit (funds return to
   * the wallet). Marking paid simply settles it — the money already left the
   * wallet at request time and the admin paid the user offline. A non-pending
   * request is rejected with BadRequest (idempotent-safe).
   */
  async process(
    requestId: string,
    adminId: string | Types.ObjectId,
    dto: ProcessWithdrawalDto,
  ): Promise<WithdrawalRequestDocument> {
    const request = await this.withdrawalModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (request.status !== WithdrawalStatus.Pending) {
      throw new BadRequestException(
        `Withdrawal request is already ${request.status} and cannot be processed again`,
      );
    }

    if (dto.action === WithdrawalAction.Reject) {
      // Return the held funds to the wallet (idempotent in WalletService).
      if (request.walletTxnId) {
        await this.walletService.reverse(
          request.walletTxnId,
          'Withdrawal rejected',
        );
      }
      request.status = WithdrawalStatus.Rejected;
    } else {
      // mark_paid: money already left the wallet; admin paid offline.
      request.status = WithdrawalStatus.Paid;
    }

    request.processedAt = new Date();
    request.processedBy = new Types.ObjectId(String(adminId));
    if (dto.adminNote !== undefined) request.adminNote = dto.adminNote;
    await request.save();

    return request;
  }
}
