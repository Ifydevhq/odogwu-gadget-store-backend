/**
 * wallet/wallet.service.ts
 * =========================
 * Wallet / store-credit data layer. The WalletTransaction ledger is the source
 * of truth; the Wallet document caches per-bucket balances for fast reads.
 *
 * All amounts are in KOBO (₦1 = 100 kobo). Ledger `amount` is always positive.
 *
 * NOTE (scope): this layer does NOT grant any credit automatically and does NOT
 * touch checkout/cart/order pricing. Later phases (signup credit, referral,
 * affiliate, checkout redemption, withdrawals) will call into these methods.
 */

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import {
  WalletBucket,
  WalletTransaction,
  WalletTransactionDocument,
  WalletTxnDirection,
  WalletTxnStatus,
  WalletTxnType,
} from './schemas/wallet-transaction.schema';
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

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name)
    private readonly txnModel: Model<WalletTransactionDocument>,
  ) {}

  private balanceFieldFor(bucket: WalletBucket): 'promoBalance' | 'earnedBalance' {
    return bucket === WalletBucket.Promo ? 'promoBalance' : 'earnedBalance';
  }

  // ═══════════════════════════════════════════════════════════════════
  // WALLET / BALANCE
  // ═══════════════════════════════════════════════════════════════════

  async getOrCreateWallet(
    userId: string | Types.ObjectId,
  ): Promise<WalletDocument> {
    const uid = new Types.ObjectId(String(userId));
    const wallet = await this.walletModel
      .findOneAndUpdate(
        { userId: uid },
        { $setOnInsert: { userId: uid } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
    return wallet;
  }

  async getBalance(userId: string | Types.ObjectId): Promise<{
    promoBalance: number;
    earnedBalance: number;
    pendingBalance: number;
    total: number;
  }> {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      promoBalance: wallet.promoBalance,
      earnedBalance: wallet.earnedBalance,
      pendingBalance: wallet.pendingBalance,
      total: wallet.promoBalance + wallet.earnedBalance,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // CREDIT
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Append a credit ledger row and update cached balances.
   * - status `available` (default): increments the matching bucket balance.
   * - status `pending`: increments pendingBalance only (matures later).
   * Idempotent: a repeated idempotencyKey returns the existing row and does
   * NOT double-apply. Never throws on a duplicate key.
   */
  async credit(params: CreditParams): Promise<WalletTransactionDocument> {
    if (params.amount == null || params.amount <= 0) {
      throw new BadRequestException('Credit amount must be a positive number of kobo');
    }

    const uid = new Types.ObjectId(String(params.userId));
    const status = params.status ?? WalletTxnStatus.Available;

    // Fast path: if this idempotencyKey already applied, return existing row.
    if (params.idempotencyKey) {
      const existing = await this.txnModel
        .findOne({ idempotencyKey: params.idempotencyKey })
        .exec();
      if (existing) return existing;
    }

    await this.getOrCreateWallet(uid);

    let txn: WalletTransactionDocument;
    try {
      txn = await this.txnModel.create({
        userId: uid,
        amount: params.amount,
        direction: WalletTxnDirection.Credit,
        bucket: params.bucket,
        type: params.type,
        status,
        description: params.description ?? '',
        orderId: params.orderId ? new Types.ObjectId(String(params.orderId)) : null,
        refId: params.refId ?? null,
        idempotencyKey: params.idempotencyKey ?? null,
        availableAt: params.availableAt ?? null,
      });
    } catch (error: any) {
      // Duplicate idempotencyKey raced us — return the already-applied row.
      if (error?.code === 11000 && params.idempotencyKey) {
        const existing = await this.txnModel
          .findOne({ idempotencyKey: params.idempotencyKey })
          .exec();
        if (existing) return existing;
      }
      throw error;
    }

    // Apply to cached balances.
    if (status === WalletTxnStatus.Pending) {
      await this.walletModel
        .updateOne({ userId: uid }, { $inc: { pendingBalance: params.amount } })
        .exec();
    } else if (status === WalletTxnStatus.Available) {
      const field = this.balanceFieldFor(params.bucket);
      await this.walletModel
        .updateOne({ userId: uid }, { $inc: { [field]: params.amount } })
        .exec();
    }

    return txn;
  }

  // ═══════════════════════════════════════════════════════════════════
  // MATURE (pending -> available)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Move a pending credit to available: pendingBalance -> matching bucket
   * balance, and status pending -> available. Idempotent (a non-pending row is
   * left untouched). Used later by the affiliate hold cron.
   */
  async matureTransaction(
    transactionId: string | Types.ObjectId,
  ): Promise<WalletTransactionDocument | null> {
    const txn = await this.txnModel.findById(transactionId).exec();
    if (!txn) throw new BadRequestException('Wallet transaction not found');
    if (txn.status !== WalletTxnStatus.Pending) {
      // Already matured/cancelled — nothing to do.
      return txn;
    }

    txn.status = WalletTxnStatus.Available;
    await txn.save();

    const field = this.balanceFieldFor(txn.bucket);
    await this.walletModel
      .updateOne(
        { userId: txn.userId },
        { $inc: { pendingBalance: -txn.amount, [field]: txn.amount } },
      )
      .exec();

    return txn;
  }

  // ═══════════════════════════════════════════════════════════════════
  // DEBIT
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Decrement a bucket balance and write a `debit`/`spent` ledger row.
   * Throws BadRequest if the bucket has insufficient balance. Idempotent when
   * an idempotencyKey is supplied. Used later by checkout/withdrawal.
   */
  async debit(params: DebitParams): Promise<WalletTransactionDocument> {
    if (params.amount == null || params.amount <= 0) {
      throw new BadRequestException('Debit amount must be a positive number of kobo');
    }

    const uid = new Types.ObjectId(String(params.userId));

    if (params.idempotencyKey) {
      const existing = await this.txnModel
        .findOne({ idempotencyKey: params.idempotencyKey })
        .exec();
      if (existing) return existing;
    }

    const wallet = await this.getOrCreateWallet(uid);
    const field = this.balanceFieldFor(params.bucket);

    if (wallet[field] < params.amount) {
      throw new BadRequestException(
        `Insufficient ${params.bucket} balance for this debit`,
      );
    }

    // Guarded decrement: only succeeds if the balance still covers the amount.
    const res = await this.walletModel
      .updateOne(
        { userId: uid, [field]: { $gte: params.amount } },
        { $inc: { [field]: -params.amount } },
      )
      .exec();

    if (res.modifiedCount === 0) {
      throw new BadRequestException(
        `Insufficient ${params.bucket} balance for this debit`,
      );
    }

    let txn: WalletTransactionDocument;
    try {
      txn = await this.txnModel.create({
        userId: uid,
        amount: params.amount,
        direction: WalletTxnDirection.Debit,
        bucket: params.bucket,
        type: params.type,
        status: WalletTxnStatus.Spent,
        description: params.description ?? '',
        orderId: params.orderId ? new Types.ObjectId(String(params.orderId)) : null,
        idempotencyKey: params.idempotencyKey ?? null,
      });
    } catch (error: any) {
      if (error?.code === 11000 && params.idempotencyKey) {
        // Roll the balance back — this debit was already recorded elsewhere.
        await this.walletModel
          .updateOne({ userId: uid }, { $inc: { [field]: params.amount } })
          .exec();
        const existing = await this.txnModel
          .findOne({ idempotencyKey: params.idempotencyKey })
          .exec();
        if (existing) return existing;
      }
      throw error;
    }

    return txn;
  }

  // ═══════════════════════════════════════════════════════════════════
  // REVERSE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Write a compensating `reversal` row for an original transaction and restore
   * balances. Used on refunds / withdrawal rejections. Idempotent — an original
   * that is already reversed is left untouched.
   */
  async reverse(
    originalTransactionId: string | Types.ObjectId,
    reason: string,
  ): Promise<WalletTransactionDocument | null> {
    const original = await this.txnModel.findById(originalTransactionId).exec();
    if (!original) throw new BadRequestException('Original transaction not found');

    if (original.status === WalletTxnStatus.Reversed) {
      // Already reversed — return the existing compensating row if present.
      return this.txnModel
        .findOne({
          type: WalletTxnType.Reversal,
          refId: String(original._id),
        })
        .exec();
    }

    const field = this.balanceFieldFor(original.bucket);

    // A reversal moves balance in the opposite direction of the original.
    // - reversing a CREDIT  => remove the credited amount from the bucket
    //   (or from pending if it never matured)
    // - reversing a DEBIT   => restore the debited amount to the bucket
    if (original.direction === WalletTxnDirection.Credit) {
      if (original.status === WalletTxnStatus.Pending) {
        await this.walletModel
          .updateOne(
            { userId: original.userId },
            { $inc: { pendingBalance: -original.amount } },
          )
          .exec();
      } else {
        await this.walletModel
          .updateOne(
            { userId: original.userId },
            { $inc: { [field]: -original.amount } },
          )
          .exec();
      }
    } else {
      // Reversing a debit restores the spent amount.
      await this.walletModel
        .updateOne(
          { userId: original.userId },
          { $inc: { [field]: original.amount } },
        )
        .exec();
    }

    original.status = WalletTxnStatus.Reversed;
    await original.save();

    const reversalRow = await this.txnModel.create({
      userId: original.userId,
      amount: original.amount,
      direction:
        original.direction === WalletTxnDirection.Credit
          ? WalletTxnDirection.Debit
          : WalletTxnDirection.Credit,
      bucket: original.bucket,
      type: WalletTxnType.Reversal,
      status: WalletTxnStatus.Reversed,
      description: reason || 'Reversal',
      orderId: original.orderId ?? null,
      refId: String(original._id),
    });

    return reversalRow;
  }

  // ═══════════════════════════════════════════════════════════════════
  // COMPUTE REDEEMABLE (pure — no writes)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * PURE calculation of how much wallet credit could apply to an order.
   * No writes. Checkout will call this then debit() in a later phase.
   *   promoApplied  = min(promoBalance, floor(orderTotal * maxPromoPercent/100))
   *   earnedApplied = min(earnedBalance, orderTotal - promoApplied)
   *   totalApplied  = promoApplied + earnedApplied
   */
  async computeRedeemable(
    userId: string | Types.ObjectId,
    orderTotalKobo: number,
    maxPromoPercent: number,
  ): Promise<{ promoApplied: number; earnedApplied: number; totalApplied: number }> {
    const { promoBalance, earnedBalance } = await this.getBalance(userId);

    const orderTotal = Math.max(0, Math.floor(orderTotalKobo || 0));
    const pct = Math.max(0, Math.min(100, maxPromoPercent || 0));

    const promoCap = Math.floor((orderTotal * pct) / 100);
    const promoApplied = Math.min(promoBalance, promoCap);
    const earnedApplied = Math.min(earnedBalance, orderTotal - promoApplied);

    return {
      promoApplied,
      earnedApplied,
      totalApplied: promoApplied + earnedApplied,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // LIST TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════════

  async listTransactions(userId: string | Types.ObjectId, dto: ListTransactionsDto) {
    const { page = 1, perPage = 20, type, status } = dto;
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(String(userId)),
    };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const [transactions, total] = await Promise.all([
      this.txnModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean()
        .exec(),
      this.txnModel.countDocuments(filter).exec(),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
}
