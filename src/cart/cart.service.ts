/**
 * cart/cart.service.ts - Shopping Cart Logic
 * ============================================
 * Manages the user's shopping cart and checkout sessions.
 *
 * Key design decisions:
 * - One cart per user (upserted on first add)
 * - Item snapshots stored at add time (name, price, image)
 * - Cart validated against live data at checkout
 * - Only buyable listings can be added (consignment + direct_purchase)
 * - Checkout creates a SESSION (not orders) → Paystack payment
 * - Orders are ONLY created after payment is confirmed
 * - Cart items removed only after successful payment
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import {
  CheckoutSession,
  CheckoutSessionDocument,
} from './schema/checkout-session.schema';
import { Listing, ListingDocument } from '../listings/schemas/listing.schema';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectModel(Cart.name)
    private cartModel: Model<CartDocument>,
    @InjectModel(CheckoutSession.name)
    private checkoutSessionModel: Model<CheckoutSessionDocument>,
    @InjectModel(Listing.name)
    private listingModel: Model<ListingDocument>,
    private ordersService: OrdersService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) {}

  // ─── Add to Cart ─────────────────────────────────────────────────

  /**
   * POST /cart/add
   *
   * Adds a listing to the user's cart. If the listing is already in
   * the cart, increments the quantity.
   */
  async addToCart(userId: string, listingId: string, quantity = 1) {
    // 1. Verify listing exists and is buyable
    const listing = await this.listingModel.findById(listingId).lean();
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    const buyableTypes = ['consignment', 'direct_purchase', 'admin'];
    if (!buyableTypes.includes(listing.type)) {
      throw new BadRequestException(
        'This listing is not available for direct purchase. Contact the seller via WhatsApp.',
      );
    }
    if (listing.status !== 'live') {
      throw new BadRequestException('This listing is no longer available');
    }

    // 2. Check quantity against available stock
    if (quantity > listing.quantity) {
      throw new BadRequestException(
        `Only ${listing.quantity} available in stock`,
      );
    }

    // 3. Determine the effective price
    const unitPrice =
      listing.discountPrice ||
        listing.adminPricing?.sellingPrice ||
        listing.askingPrice?.amount;
    const image = listing.media?.[0]?.url || null;

    // 4. Upsert: find or create user's cart
    let cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      cart = await this.cartModel.create({
        userId: new Types.ObjectId(userId),
        items: [],
      });
    }

    // 5. Check if listing already in cart
    const existingIndex = cart.items.findIndex(
      (item) => item.listingId.toString() === listingId,
    );

    if (existingIndex > -1) {
      // Update quantity
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > listing.quantity) {
        throw new BadRequestException(
          `Cannot add more. Only ${listing.quantity} available (${cart.items[existingIndex].quantity} already in cart)`,
        );
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      // Add new item with snapshot
      cart.items.push({
        listingId: new Types.ObjectId(listingId),
        storeId: listing.storeId as Types.ObjectId,
        quantity,
        itemName: listing.itemName,
        unitPrice,
        currency: listing.askingPrice?.currency || 'NGN',
        image,
        type: listing.type,
        sellerId: listing.userId as Types.ObjectId,
      } as any);
    }

    await cart.save();

    return this.formatCart(cart);
  }

  // ─── Get Cart ────────────────────────────────────────────────────

  /**
   * GET /cart
   *
   * Returns the user's cart with computed totals.
   */
  async getCart(userId: string) {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'items.listingId',
        // discountPrice/formerPrice/discountPercent MUST be selected — the cart
        // resolves the live price as discountPrice || adminPricing.sellingPrice
        // || askingPrice, so omitting discountPrice made scripted products show
        // the struck-through (former) price at checkout instead of the discount.
        select:
          'itemName status type condition quantity media askingPrice discountPrice formerPrice discountPercent adminPricing storeId creatorId userId',
      })
      .populate({
        path: 'items.storeId',
        select: 'name slug logo',
      });

    if (!cart || cart.items.length === 0) {
      return {
        items: [],
        itemCount: 0,
        subtotal: 0,
        currency: 'NGN',
      };
    }

    return this.formatCart(cart);
  }

  // ─── Update Item Quantity ────────────────────────────────────────

  /**
   * PATCH /cart/items/:listingId
   *
   * Updates the quantity of an item in the cart.
   */
  async updateQuantity(userId: string, listingId: string, quantity: number) {
    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      throw new NotFoundException('Cart is empty');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.listingId.toString() === listingId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    // Validate against available stock
    const listing = await this.listingModel.findById(listingId).lean();
    if (listing && quantity > listing.quantity) {
      throw new BadRequestException(
        `Only ${listing.quantity} available in stock`,
      );
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return this.formatCart(cart);
  }

  // ─── Remove Item ─────────────────────────────────────────────────

  /**
   * DELETE /cart/items/:listingId
   *
   * Removes an item from the cart.
   */
  async removeItem(userId: string, listingId: string) {
    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      throw new NotFoundException('Cart is empty');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.listingId.toString() !== listingId,
    ) as any;

    if (cart.items.length === initialLength) {
      throw new NotFoundException('Item not found in cart');
    }

    await cart.save();

    return this.formatCart(cart);
  }

  // ─── Clear Cart ──────────────────────────────────────────────────

  /**
   * DELETE /cart
   *
   * Removes all items from the cart.
   */
  async clearCart(userId: string) {
    await this.cartModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { items: [] } },
    );

    return { message: 'Cart cleared', items: [], itemCount: 0, subtotal: 0 };
  }

  // ─── Validate Cart ───────────────────────────────────────────────

  /**
   * POST /cart/validate
   *
   * Validates all cart items against live listing data.
   * Returns which items are still valid and which have issues.
   * Call this before checkout to show the user any problems.
   */
  async validateCart(userId: string) {
    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const listingIds = cart.items.map((item) => item.listingId);
    const listings = await this.listingModel
      .find({ _id: { $in: listingIds } })
      .lean();

    const listingMap = new Map(listings.map((l) => [l._id.toString(), l]));

    const validItems: any[] = [];
    const issues: any[] = [];
    let priceChanged = false;

    for (const item of cart.items) {
      const listing = listingMap.get(item.listingId.toString());

      if (!listing) {
        issues.push({
          listingId: item.listingId,
          itemName: item.itemName,
          issue: 'Listing no longer exists',
        });
        continue;
      }

      const buyableTypes = ['consignment', 'direct_purchase', 'admin'];
      const isBuyable =
        buyableTypes.includes(listing.type) && listing.status === 'live';

      if (!isBuyable) {
        issues.push({
          listingId: item.listingId,
          itemName: item.itemName,
          issue: 'Listing is no longer available for purchase',
        });
        continue;
      }

      if (item.quantity > listing.quantity) {
        issues.push({
          listingId: item.listingId,
          itemName: item.itemName,
          issue: `Only ${listing.quantity} available (you have ${item.quantity} in cart)`,
        });
        continue;
      }

      // Check if price changed
      const currentPrice =
        listing.discountPrice ||
        listing.adminPricing?.sellingPrice ||
        listing.askingPrice?.amount;
      if (currentPrice !== item.unitPrice) {
        priceChanged = true;
        // Update the snapshot
        item.unitPrice = currentPrice;
      }

      validItems.push(item);
    }

    // Save updated prices if any changed
    if (priceChanged) {
      await cart.save();
    }

    return {
      valid: issues.length === 0,
      validItems: validItems.length,
      totalItems: cart.items.length,
      issues,
    };
  }

  // ─── Checkout ─────────────────────────────────────────────────────

  /**
   * POST /cart/checkout
   *
   * The checkout flow:
   * 1. Validate selected cart items against live listing data
   * 2. Skip unavailable items (don't block checkout)
   * 3. Create a CheckoutSession with validated data
   * 4. Initialize ONE Paystack payment
   * 5. Return the payment URL + session info
   *
   * Orders are NOT created here — they're created after payment
   * is confirmed in fulfillCheckoutSession().
   *
   * If NO items are valid, checkout fails.
   */
  async checkout(
    userId: string,
    email: string,
    shippingAddress: any,
    listingIds?: string[],
    buyerNote?: string,
    callbackUrl?: string,
    deliveryFee: number = 0,
    paymentMethod: 'paystack' | 'opay' | 'pay_on_delivery' = 'paystack',
    applyWalletCredit: boolean = false,
    walletCreditAmount?: number,
    affiliateCodes?: Record<string, string>,
  ) {
    // 1. Get and validate cart
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!cart || !cart.items.length) {
      throw new BadRequestException('Your cart is empty');
    }

    // Filter cart items to only the selected ones (if listingIds provided)
    const selectedItems = listingIds?.length
      ? cart.items.filter((item) =>
          listingIds.includes(item.listingId.toString()),
        )
      : cart.items;

    if (selectedItems.length === 0) {
      throw new BadRequestException(
        'None of the selected items are in your cart',
      );
    }

    // Fetch all listings for selected items
    const listingIdsToFetch = selectedItems.map((item) => item.listingId);
    const listings = await this.listingModel
      .find({ _id: { $in: listingIdsToFetch } })
      .lean();

    const listingMap = new Map(listings.map((l) => [l._id.toString(), l]));

    const validItems: any[] = [];
    const skippedItems: any[] = [];

    for (const item of selectedItems) {
      const listing = listingMap.get(item.listingId.toString());

      if (!listing) {
        skippedItems.push({
          listingId: item.listingId,
          itemName: item.itemName,
          reason: 'Listing no longer exists',
        });
        continue;
      }

      const buyableTypes = ['consignment', 'direct_purchase', 'admin'];
      if (!buyableTypes.includes(listing.type) || listing.status !== 'live') {
        skippedItems.push({
          listingId: item.listingId,
          itemName: item.itemName,
          reason: 'Listing is no longer available for purchase',
        });
        continue;
      }

      if (item.quantity > listing.quantity) {
        skippedItems.push({
          listingId: item.listingId,
          itemName: item.itemName,
          reason: `Only ${listing.quantity} available`,
        });
        continue;
      }

      // Can't buy your own listing
      if (listing.userId?.toString() === userId) {
        skippedItems.push({
          listingId: item.listingId,
          itemName: item.itemName,
          reason: 'You cannot purchase your own listing',
        });
        continue;
      }

      // Resolve current price
      const currentPrice =
        listing.discountPrice ||
        listing.adminPricing?.sellingPrice ||
        listing.askingPrice?.amount;
      const commissionRate = listing.adminPricing?.commissionRate ?? 15;

      validItems.push({
        listingId: listing._id.toString(),
        storeId: listing.storeId?.toString(),
        sellerId: listing.userId?.toString(),
        creatorId: listing.creatorId?.toString(),
        itemName: listing.itemName,
        quantity: item.quantity,
        unitPrice: currentPrice,
        totalPrice: currentPrice * item.quantity,
        type: listing.type,
        image: listing.media?.[0]?.url || null,
        commissionRate,
      });
    }

    // If nothing is valid, reject
    if (validItems.length === 0) {
      throw new BadRequestException({
        message: 'None of the items in your cart are available for purchase.',
        skippedItems,
      });
    }

    // 2. Calculate grand total (items + delivery fee)
    const itemsTotal = validItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const grandTotal = itemsTotal + deliveryFee;

    // Opt-in wallet credit (default false → behaviour unchanged)
    const wantsCredit =
      applyWalletCredit === true || (walletCreditAmount ?? 0) > 0;

    // ─── Pay on Delivery — no online payment, create the order now ───
    if (paymentMethod === 'pay_on_delivery') {
      const order = await this.ordersService.createPayOnDeliveryOrder(
        userId,
        validItems,
        shippingAddress,
        buyerNote,
        email,
        deliveryFee,
        wantsCredit
          ? { apply: true, capKobo: walletCreditAmount }
          : undefined,
        affiliateCodes,
      );

      // Remove the checked-out items from the cart immediately.
      await this.removeCheckedOutItems(
        userId,
        validItems.map((i) => i.listingId),
      );

      this.logger.log(
        `Pay-on-delivery order created: ${order.orderNumber} ` +
          `(${validItems.length} items, total ${grandTotal})`,
      );

      return {
        paymentMethod: 'pay_on_delivery',
        codOrder: true,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount, // amount to collect on delivery (net of credit)
          itemCount: order.items.length,
        },
        grandTotal, // gross (before wallet credit)
        walletCreditApplied: order.walletCreditApplied || 0,
        amountDue: order.totalAmount,
        itemCount: validItems.length,
        skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
      };
    }

    // ─── Wallet credit (opt-in, ONLINE) ─────────────────────
    // Compute the intended credit and reduce what the provider is charged.
    // The wallet is NOT debited here — the debit happens in confirmPayment
    // after the money lands, so an abandoned/failed session never touches the
    // wallet. The intended split is stored on the session and applied at
    // fulfilment.
    let creditPlan = { promo: 0, earned: 0, total: 0 };
    if (wantsCredit) {
      try {
        creditPlan = await this.ordersService.computeCreditPlan(
          userId,
          grandTotal,
          walletCreditAmount,
        );
      } catch (err) {
        this.logger.warn(
          `Wallet credit preview failed for user ${userId}: ${err?.message}`,
        );
        creditPlan = { promo: 0, earned: 0, total: 0 };
      }
    }
    const amountToCharge = grandTotal - creditPlan.total;

    // ─── Fully covered by credit — no online payment needed ──
    // Create the order now, apply the reserved credit, confirm it as
    // wallet-funded, and clear the paid items from the cart.
    if (wantsCredit && creditPlan.total > 0 && amountToCharge <= 0) {
      const order = await this.ordersService.createCartOrder(
        userId,
        validItems,
        shippingAddress,
        buyerNote,
        email,
        deliveryFee,
        true,
        { mode: 'reserve', promo: creditPlan.promo, earned: creditPlan.earned },
        affiliateCodes,
      );

      await this.ordersService.confirmPayment(
        order._id.toString(),
        `WALLET-${order._id}`,
        `WALLET-${order._id}`,
        'wallet_credit',
      );

      await this.removeCheckedOutItems(
        userId,
        validItems.map((i) => i.listingId),
      );

      this.logger.log(
        `Wallet-funded checkout order created: ${order.orderNumber} ` +
          `(fully covered by ${creditPlan.total} kobo credit)`,
      );

      return {
        paymentMethod: 'wallet_credit',
        walletFunded: true,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount, // 0 charged, fully credit-funded
          itemCount: order.items.length,
        },
        grandTotal, // gross (before wallet credit)
        walletCreditApplied: creditPlan.total,
        amountDue: 0,
        itemCount: validItems.length,
        skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
      };
    }

    // 3. Initialize payment via chosen provider (reduced amount)
    const itemsSummary = validItems.map((i) => ({
      itemName: i.itemName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));

    const payment =
      paymentMethod === 'opay'
        ? await this.paymentsService.initializeOPayCheckoutSessionPayment(
            amountToCharge,
            email,
            itemsSummary,
            shippingAddress,
            callbackUrl,
          )
        : await this.paymentsService.initializeCheckoutSessionPayment(
            amountToCharge,
            email,
            itemsSummary,
            shippingAddress,
            callbackUrl,
          );

    // 4. Create CheckoutSession with validated snapshot
    const session = await this.checkoutSessionModel.create({
      buyerId: new Types.ObjectId(userId),
      email,
      items: validItems,
      shippingAddress,
      buyerNote,
      grandTotal: amountToCharge, // amount actually charged to the provider
      deliveryFee,
      currency: 'NGN',
      paymentMethod,
      paymentReference: payment.reference,
      status: 'pending',
      // Intended wallet credit — debited at fulfilment, never before.
      walletCreditApplied: creditPlan.total,
      walletCreditBreakdown:
        creditPlan.total > 0
          ? { promo: creditPlan.promo, earned: creditPlan.earned }
          : null,
      // Affiliate attribution — applied to order items at fulfilment.
      affiliateCodes: affiliateCodes || null,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    this.logger.log(
      `Checkout session created: ${session._id}, ` +
        `user ${userId}, ${validItems.length} items, ${skippedItems.length} skipped, ` +
        `charge ${amountToCharge} (credit ${creditPlan.total}), ref ${payment.reference}`,
    );

    // 5. Return — cart is untouched, no orders yet
    return {
      sessionId: session._id,
      paymentMethod,
      payment: {
        authorizationUrl: payment.authorizationUrl,
        accessCode: payment.accessCode,
        reference: payment.reference,
        grandTotal: amountToCharge,
      },
      walletCreditApplied: creditPlan.total,
      itemCount: validItems.length,
      skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
    };
  }

  // ─── Fulfill Checkout Session (called after payment confirms) ──────

  /**
   * Called by PaymentsService after Paystack confirms payment.
   * Reads the session → creates orders → removes cart items → marks session done.
   *
   * Returns the created orders.
   */
  async fulfillCheckoutSession(
    sessionId: string,
    paymentReference: string,
    paystackReference: string,
  ) {
    const session = await this.checkoutSessionModel.findById(sessionId).exec();

    if (!session) {
      this.logger.error(`Checkout session not found: ${sessionId}`);
      throw new NotFoundException('Checkout session not found or expired');
    }

    if (session.status === 'completed') {
      this.logger.warn(`Checkout session already fulfilled: ${sessionId}`);
      return { alreadyFulfilled: true, orderIds: session.orderIds };
    }

    if (session.status !== 'pending') {
      this.logger.warn(
        `Checkout session in unexpected state: ${session.status}`,
      );
      throw new BadRequestException(`Checkout session is ${session.status}`);
    }

    // 1. Create a single order with all items. If the session carried an
    //    intended wallet-credit split, reserve it on the order (reduces the
    //    stored payable); the actual debit happens in confirmPayment below.
    const sessionCredit = (session as any).walletCreditApplied || 0;
    const sessionBreakdown = (session as any).walletCreditBreakdown;
    const order = await this.ordersService.createCartOrder(
      session.buyerId.toString(),
      session.items as any[],
      session.shippingAddress,
      session.buyerNote,
      session.email, // Receipt email (checkout override or user email)
      (session as any).deliveryFee || 0,
      true,
      sessionCredit > 0 && sessionBreakdown
        ? {
            mode: 'reserve',
            promo: sessionBreakdown.promo || 0,
            earned: sessionBreakdown.earned || 0,
          }
        : undefined,
      (session as any).affiliateCodes || undefined,
    );

    // Mark as paid immediately since payment is already confirmed.
    // confirmPayment settles (debits) any reserved wallet credit.
    await this.ordersService.confirmPayment(
      order._id.toString(),
      paymentReference,
      paystackReference,
    );

    // 2. Remove paid items from cart
    const paidListingIds = session.items.map((i) => i.listingId);
    await this.removeCheckedOutItems(
      session.buyerId.toString(),
      paidListingIds,
    );

    // 3. Mark session as completed (extend TTL to 24h for debugging)
    session.status = 'completed';
    session.orderIds = [order._id.toString()];
    session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await session.save();

    this.logger.log(
      `Checkout session fulfilled: ${sessionId}, ` +
        `1 order created (${session.items.length} items), ` +
        `${paidListingIds.length} items removed from cart`,
    );

    return {
      orders: [
        {
          _id: order._id,
          orderNumber: order.orderNumber,
          itemCount: order.items.length,
          totalAmount: order.totalAmount,
        },
      ],
    };
  }

  // ─── Mark Session Failed ──────────────────────────────────────────

  /**
   * Called when payment fails. Marks session as failed so it doesn't
   * get retried. Cart remains untouched.
   */
  async failCheckoutSession(paymentReference: string) {
    const session = await this.checkoutSessionModel.findOne({
      paymentReference,
      status: 'pending',
    });

    if (session) {
      session.status = 'failed';
      session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await session.save();
      this.logger.log(`Checkout session marked failed: ${session._id}`);
    }
  }

  // ─── Find Session by Payment Reference ────────────────────────────

  async findSessionByReference(paymentReference: string) {
    return this.checkoutSessionModel.findOne({ paymentReference }).exec();
  }

  // ─── Get Cart Item Count ─────────────────────────────────────────

  /**
   * GET /cart/count
   */
  async getItemCount(userId: string) {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .select('items')
      .lean();

    const count =
      cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    return { count };
  }

  // ─── Clear cart after successful checkout (internal) ─────────────

  async clearCartInternal(userId: string) {
    await this.cartModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { items: [] } },
    );
  }

  // ─── Remove specific items after successful payment (internal) ──

  /**
   * Called by PaymentsService after Paystack confirms payment.
   * Removes only the paid-for listings from the user's cart.
   */
  async removeCheckedOutItems(userId: string, listingIds: string[]) {
    const listingOids = listingIds.map((id) => new Types.ObjectId(id));
    await this.cartModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $pull: { items: { listingId: { $in: listingOids } } } },
    );
  }

  // ─── Private Helpers ─────────────────────────────────────────────

  private formatCart(cart: CartDocument | any) {
    const items = (cart.items || []).map((item: any) => {
      // The populated listing (live data from DB)
      const listing =
        item.listingId && item.listingId._id ? item.listingId : null;

      // Determine availability from live data
      const buyableTypes = ['consignment', 'direct_purchase', 'admin'];
      const isAvailable = listing
        ? buyableTypes.includes(listing.type) && listing.status === 'live'
        : false;

      // Live price vs snapshot
      const livePrice =
        listing?.discountPrice ||
        listing?.adminPricing?.sellingPrice ||
        listing?.askingPrice?.amount;
      const priceChanged = livePrice && livePrice !== item.unitPrice;

      return {
        // ─── Cart snapshot (what was saved when item was added) ──
        listingId: listing?._id || item.listingId,
        storeId: item.storeId?._id || item.storeId,
        quantity: item.quantity,
        currency: item.currency,

        // Snapshot values (from when item was added to cart)
        snapshot: {
          itemName: item.itemName,
          unitPrice: item.unitPrice,
          image: item.image,
          type: item.type,
        },

        // ─── Live data (current state of the listing) ───────────
        listing: listing
          ? {
              _id: listing._id,
              itemName: listing.itemName,
              status: listing.status,
              type: listing.type,
              condition: listing.condition,
              quantity: listing.quantity,
              media: listing.media,
              askingPrice: listing.askingPrice,
              adminPricing: listing.adminPricing,
              effectivePrice: livePrice,
              formerPrice: listing.formerPrice,
              discountPercent: listing.discountPercent,
            }
          : null,

        // ─── Populated store ────────────────────────────────────
        store: item.storeId?.name
          ? {
              _id: item.storeId._id,
              name: item.storeId.name,
              slug: item.storeId.slug,
              logo: item.storeId.logo,
            }
          : undefined,

        // ─── Computed flags for the frontend ────────────────────
        isAvailable,
        isDeleted: !listing,
        priceChanged: priceChanged || false,

        // ─── Convenience: live values, fall back to snapshot ────
        itemName: listing?.itemName || item.itemName,
        unitPrice: livePrice || item.unitPrice,
        totalPrice: (livePrice || item.unitPrice) * item.quantity,
      };
    });

    const validItems = items.filter((i: any) => i.isAvailable);

    const subtotal = validItems.reduce(
      (sum: number, item: any) => sum + item.totalPrice,
      0,
    );

    const itemCount = items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    );

    return {
      items,
      itemCount,
      subtotal,
      currency: 'NGN',
      hasIssues: validItems.length < items.length,
    };
  }
}
