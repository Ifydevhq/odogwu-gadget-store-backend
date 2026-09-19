/**
 * orders/orders.service.ts - Order Business Logic
 * ==================================================
 * Handles the entire order lifecycle:
 * - Creating orders (with revenue split calculation)
 * - Status transitions (pending → confirmed → shipped → delivered)
 * - Buyer, seller, and admin order views
 * - Payment confirmation (called by Paystack webhook)
 *
 * REVENUE SPLIT CALCULATION:
 *
 *   Consignment example:
 *     sellingPrice = ₦20,000 (2,000,000 kobo)
 *     commissionRate = 15%
 *     platformFee = 2,000,000 × 0.15 = 300,000 kobo (₦3,000)
 *     sellerPayout = 2,000,000 - 300,000 = 1,700,000 kobo (₦17,000)
 *
 *   Direct Purchase:
 *     sellingPrice = ₦25,000 (Comaket's selling price)
 *     purchasePrice = ₦18,000 (what Comaket paid the seller)
 *     platformFee = 2,500,000 (entire amount — Comaket owns the item)
 *     sellerPayout = 0 (already paid when item was acquired)
 *
 * ORDER NUMBER FORMAT: "CMK-YYYYMMDD-XXXX"
 *   CMK = Comaket prefix
 *   YYYYMMDD = Date
 *   XXXX = Random 4-char alphanumeric
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { StoresService } from '../stores/stores.service';
import { CreatorsService } from '../creators/creators.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  QueryOrdersDto,
} from './dto/order.dto';
import {
  OrderStatus,
  PaymentStatus,
  ListingType,
  ListingStatus,
} from '@config/contants';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { ListingsService } from 'src/listings/listings.service';
import { AlertsService } from '../alerts/alerts.service';
import { AlertType } from '@config/contants';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private listingsService: ListingsService,
    private storesService: StoresService,
    private creatorsService: CreatorsService,
    private notificationsService: NotificationsService,
    private alertsService: AlertsService,
  ) {}

  // ─── Helpers ─────────────────────────────────────────────

  /**
   * Generate a human-readable order number.
   * Format: CMK-20260220-A3F2
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CMK-${dateStr}-${suffix}`;
  }

  /**
   * Calculate revenue split based on listing type and admin pricing.
   *
   * Returns:
   *   totalAmount: What the buyer pays
   *   platformFee: Comaket's cut
   *   sellerPayout: What the seller gets
   *   commissionRate: The percentage applied
   */
  private calculateRevenueSplit(
    listing: any,
    quantity: number,
  ): {
    unitPrice: number;
    totalAmount: number;
    platformFee: number;
    sellerPayout: number;
    commissionRate: number;
  } {
    // Use admin's selling price if set, otherwise asking price
    const unitPrice =
      listing.discountPrice ||
      listing.adminPricing?.sellingPrice ||
      listing.askingPrice.amount;
    const totalAmount = unitPrice * quantity;

    if (listing.type === ListingType.DirectPurchase) {
      // Comaket owns the item — entire amount is platform revenue
      // Seller was already paid at purchasePrice when item was acquired
      return {
        unitPrice,
        totalAmount,
        platformFee: totalAmount,
        sellerPayout: 0,
        commissionRate: 100,
      };
    }

    if (listing.type === ListingType.Consignment) {
      // Revenue split: Comaket takes commission, rest goes to seller
      const commissionRate = listing.adminPricing?.commissionRate ?? 15;
      const platformFee = Math.round(totalAmount * (commissionRate / 100));
      const sellerPayout = totalAmount - platformFee;

      return {
        unitPrice,
        totalAmount,
        platformFee,
        sellerPayout,
        commissionRate,
      };
    }

    // Shouldn't reach here — self-listed items can't be ordered
    throw new BadRequestException('Invalid listing type for ordering');
  }

  // ─── Create Order ────────────────────────────────────────

  /**
   * POST /orders
   *
   * Flow:
   * 1. Fetch the listing and validate it's buyable
   * 2. Check stock (quantity available)
   * 3. Calculate revenue split
   * 4. Create the order with status PENDING
   * 5. Return the order (frontend then initiates Paystack payment)
   *
   * The order stays PENDING until Paystack confirms payment,
   * at which point confirmPayment() updates it to CONFIRMED.
   */
  /**
   * Fires the in-app alerts that EVERY order-creation path must send:
   *   - NewOrderReceived → each distinct seller/store owner in the order
   *     (order.sellerId if set, plus each distinct items[].sellerId)
   *   - OrderPlaced → the buyer (unless notifyBuyer is false)
   *
   * AlertsService swallows its own errors, and each call is fire-and-forget,
   * so this can never break order creation.
   */
  private async notifyOrderCreated(
    order: OrderDocument,
    opts: { notifyBuyer?: boolean } = {},
  ): Promise<void> {
    const { notifyBuyer = true } = opts;
    const buyerId = order.buyerId?.toString();

    // Distinct sellers: order-level sellerId + each item-level sellerId
    const sellerIds = new Set<string>();
    const orderSeller =
      (order as any).sellerId?._id?.toString() ||
      (order as any).sellerId?.toString();
    if (orderSeller) sellerIds.add(orderSeller);
    for (const item of order.items || []) {
      const sid = (item as any).sellerId?.toString();
      if (sid) sellerIds.add(sid);
    }
    // A buyer is never notified as their own seller (self-purchase guard).
    if (buyerId) sellerIds.delete(buyerId);

    const itemsSummary =
      order.items.length === 1
        ? order.items[0].itemName
        : `${order.items.length} items`;

    for (const sellerId of sellerIds) {
      this.alertsService
        .createAlert({
          userId: sellerId,
          type: AlertType.NewOrderReceived,
          title: 'New Order Received! 🎉',
          message: `You received a new order #${order.orderNumber} for ${itemsSummary}. Check your orders for details.`,
          entityId: order._id.toString(),
          entityType: 'order',
          metadata: { orderNumber: order.orderNumber },
        })
        .catch(() => {});
    }

    if (notifyBuyer && buyerId) {
      this.alertsService
        .createAlert({
          userId: buyerId,
          type: AlertType.OrderPlaced,
          title: 'Order placed 🛍️',
          message: `We have received your order #${order.orderNumber} for ${itemsSummary}.`,
          entityId: order._id.toString(),
          entityType: 'order',
          metadata: { orderNumber: order.orderNumber },
        })
        .catch(() => {});
    }
  }

  async create(
    buyerId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderDocument> {
    const { listingId, quantity, shippingAddress, buyerNote } = createOrderDto;

    // Fetch the listing
    const listing = await this.listingsService.findById(listingId);

    // ─── Validation ────────────────────────────────────────

    // Can't buy your own item
    if (listing.userId.toString() === buyerId) {
      throw new BadRequestException('You cannot purchase your own listing');
    }

    // Must be a buyable type (consignment or direct_purchase)
    if (listing.type === ListingType.SelfListing) {
      throw new BadRequestException(
        'Self-listed items cannot be purchased on the platform. ' +
          'Please contact the seller via WhatsApp.',
      );
    }

    // Must be live
    if (listing.status !== ListingStatus.Live) {
      throw new BadRequestException(
        'This listing is not available for purchase',
      );
    }

    // Check stock
    if (listing.quantity < quantity) {
      throw new BadRequestException(
        `Only ${listing.quantity} item(s) available`,
      );
    }

    // ─── Calculate pricing ─────────────────────────────────

    const split = this.calculateRevenueSplit(listing, quantity);

    // ─── Create order ──────────────────────────────────────

    const order = new this.orderModel({
      orderNumber: this.generateOrderNumber(),
      buyerId: new Types.ObjectId(buyerId),
      sellerId: listing.userId,
      creatorId: listing.creatorId,
      storeId: listing.storeId,
      items: [
        {
          listingId: listing._id,
          itemName: listing.itemName,
          quantity,
          unitPrice: split.unitPrice,
          totalPrice: split.totalAmount,
          type: listing.type,
          image: listing.media?.[0]?.url || null,
        },
      ],
      subtotal: split.totalAmount,
      shippingFee: 0, // TODO: Calculate based on location
      discount: 0,
      totalAmount: split.totalAmount, // + shippingFee - discount
      currency: listing.askingPrice.currency,
      revenueSplit: {
        totalAmount: split.totalAmount,
        platformFee: split.platformFee,
        sellerPayout: split.sellerPayout,
        commissionRate: split.commissionRate,
      },
      shippingAddress,
      buyerNote,
      status: OrderStatus.Pending,
      paymentStatus: PaymentStatus.Pending,
      disbursementStatus:
        split.sellerPayout > 0 ? 'awaiting_completion' : 'not_applicable',
    });

    const saved = await order.save();

    // In-app alerts: notify the store owner(s) + buyer that an order exists.
    await this.notifyOrderCreated(saved);

    return saved;
  }

  // ─── Create Order from Cart Checkout ────────────────────

  /**
   * Creates a single order from pre-validated cart items for one store.
   * Called by CartService.checkout() — items are already validated.
   *
   * @param buyerId - The buyer's user ID
   * @param storeGroup - Grouped items for one store (already validated)
   * @param shippingAddress - Shipping address
   * @param buyerNote - Optional note
   * @returns Created order document
   */
  async createCartOrder(
    buyerId: string,
    items: Array<{
      listingId: string;
      storeId: string;
      sellerId: string;
      creatorId: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      type: string;
      image: string | null;
      commissionRate: number;
    }>,
    shippingAddress: any,
    buyerNote?: string,
    receiptEmail?: string,
    deliveryFee: number = 0,
    notifyBuyer: boolean = true,
  ): Promise<OrderDocument> {
    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

    // Calculate combined revenue split for the order
    let totalPlatformFee = 0;
    let totalSellerPayout = 0;

    for (const item of items) {
      if (item.type === 'direct_purchase') {
        totalPlatformFee += item.totalPrice;
      } else {
        // consignment
        const fee = Math.round(item.totalPrice * (item.commissionRate / 100));
        totalPlatformFee += fee;
        totalSellerPayout += item.totalPrice - fee;
      }
    }

    const avgCommission =
      subtotal > 0 ? Math.round((totalPlatformFee / subtotal) * 100) : 0;

    // Determine if single-seller order (for backward compat)
    const uniqueSellers = [...new Set(items.map((i) => i.sellerId))];
    const uniqueStores = [...new Set(items.map((i) => i.storeId))];
    const uniqueCreators = [...new Set(items.map((i) => i.creatorId))];

    const order = new this.orderModel({
      orderNumber: this.generateOrderNumber(),
      buyerId: new Types.ObjectId(buyerId),
      // Set order-level fields only if single seller/store
      sellerId:
        uniqueSellers.length === 1
          ? new Types.ObjectId(uniqueSellers[0])
          : null,
      creatorId:
        uniqueCreators.length === 1
          ? new Types.ObjectId(uniqueCreators[0])
          : null,
      storeId:
        uniqueStores.length === 1 ? new Types.ObjectId(uniqueStores[0]) : null,
      items: items.map((i) => ({
        listingId: new Types.ObjectId(i.listingId),
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        type: i.type,
        image: i.image,
        storeId: new Types.ObjectId(i.storeId),
        sellerId: new Types.ObjectId(i.sellerId),
        creatorId: new Types.ObjectId(i.creatorId),
        commissionRate: i.commissionRate,
      })),
      subtotal,
      shippingFee: deliveryFee,
      discount: 0,
      totalAmount: subtotal + deliveryFee,
      currency: 'NGN',
      revenueSplit: {
        totalAmount: subtotal,
        platformFee: totalPlatformFee,
        sellerPayout: totalSellerPayout,
        commissionRate: avgCommission,
      },
      shippingAddress,
      buyerNote,
      receiptEmail: receiptEmail || null,
      status: OrderStatus.Pending,
      paymentStatus: PaymentStatus.Pending,
      disbursementStatus:
        totalSellerPayout > 0 ? 'awaiting_completion' : 'not_applicable',
    });

    const saved = await order.save();

    // In-app alerts: notify each distinct store owner + (optionally) the buyer.
    // COD passes notifyBuyer=false — it sends its own COD-specific "order
    // placed" alert from dispatchPayOnDeliveryNotifications, so we skip the
    // buyer alert here to avoid a duplicate.
    await this.notifyOrderCreated(saved, { notifyBuyer });

    return saved;
  }

  // ─── Pay on Delivery Order ───────────────────────────────

  /**
   * Creates a Pay-on-Delivery (cash-on-delivery) order. Unlike the online
   * flow, no payment is initialised: the order is created and immediately
   * CONFIRMED (payment still PENDING until collected on delivery), and the
   * owner + buyer are notified right away.
   */
  async createPayOnDeliveryOrder(
    buyerId: string,
    items: Parameters<OrdersService['createCartOrder']>[1],
    shippingAddress: any,
    buyerNote?: string,
    receiptEmail?: string,
    deliveryFee: number = 0,
  ): Promise<OrderDocument> {
    const order = await this.createCartOrder(
      buyerId,
      items,
      shippingAddress,
      buyerNote,
      receiptEmail,
      deliveryFee,
      false, // buyer OrderPlaced alert is sent below (COD-specific copy)
    );

    // Stays PENDING, not Confirmed. Nothing has been paid and nobody has
    // checked stock or the address yet — confirming here told the customer
    // their order was locked in before anyone had looked at it.
    order.status = OrderStatus.Pending;
    order.paymentStatus = PaymentStatus.Pending;
    order.paymentInfo = { method: 'pay_on_delivery', status: 'pending' };
    const saved = await order.save();

    // Notifications must never break order creation.
    await this.dispatchPayOnDeliveryNotifications(saved._id.toString()).catch(
      (e) =>
        Logger.error(
          `COD notifications failed for ${saved.orderNumber}: ${e.message}`,
        ),
    );
    return saved;
  }

  /**
   * Sends the buyer their receipt once payment has actually been recorded.
   *
   * For a pay-on-delivery order this is the *only* place the "Order Confirmed
   * / Total Paid" email comes from — it must never go out at order-creation
   * time, when no money has changed hands.
   */
  private async dispatchPaymentReceipt(orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('buyerId', 'firstName lastName email')
      .exec();
    if (!order) return;

    const buyer = order.buyerId as any;
    const receiptTo = order.receiptEmail || buyer?.email;
    if (receiptTo) {
      await this.notificationsService.sendOrderConfirmation(receiptTo, {
        buyerName: buyer?.firstName || 'Customer',
        orderNumber: order.orderNumber,
        items: order.items.map((i) => ({
          itemName: i.itemName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress as any,
      });
    }

    try {
      await this.alertsService.createAlert({
        userId: order.buyerId.toString(),
        type: AlertType.PaymentSuccessful,
        title: 'Payment received ✅',
        message: `We have received payment for order #${order.orderNumber}.`,
        entityId: order._id,
        entityType: 'order',
      });
    } catch {
      /* non-fatal */
    }
  }

  /** Buyer acknowledgement + admin copy + owner WhatsApp + in-app alert for COD orders. */
  private async dispatchPayOnDeliveryNotifications(orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('buyerId', 'firstName lastName email')
      .exec();
    if (!order) return;

    const buyer = order.buyerId as any;
    const receiptTo = order.receiptEmail || buyer?.email;
    const confirmationData = {
      buyerName: buyer?.firstName || 'Customer',
      orderNumber: order.orderNumber,
      items: order.items.map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress as any,
    };

    if (receiptTo) {
      try {
        // Acknowledgement, not a receipt: a pay-on-delivery order has not been
        // paid for, so sending "Order Confirmed / Total Paid" was wrong.
        await this.notificationsService.sendOrderPlacedOnDelivery(
          receiptTo,
          confirmationData,
        );
      } catch (e) {
        Logger.error(`❌ COD buyer email failed: ${e.message}`);
      }
    }

    try {
      await this.notificationsService.sendAdminOrderCopy({
        ...confirmationData,
        payOnDelivery: true,
      });
    } catch (e) {
      Logger.error(`❌ COD admin copy failed: ${e.message}`);
    }

    try {
      await this.notificationsService.sendOwnerOrderWhatsapp({
        orderNumber: order.orderNumber,
        buyerName:
          `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim() ||
          'Customer',
        phoneNumber: (order.shippingAddress as any)?.phoneNumber,
        items: confirmationData.items,
        totalAmount: order.totalAmount,
        paymentLabel: 'Pay on Delivery',
        shippingAddress: order.shippingAddress as any,
        buyerNote: order.buyerNote,
      });
    } catch (e) {
      Logger.error(`❌ COD owner WhatsApp failed: ${e.message}`);
    }

    try {
      await this.alertsService.createAlert({
        userId: order.buyerId.toString(),
        type: AlertType.OrderPlaced,
        title: 'Order placed 🛵',
        message:
          `We have received order #${order.orderNumber}. ` +
          `Our team will reach out to confirm it — payment is due on delivery.`,
        entityId: order._id,
        entityType: 'order',
      });
    } catch {
      /* non-fatal */
    }
  }

  // ─── Confirm Payment ─────────────────────────────────────

  /**
   * Called after Paystack confirms payment (via webhook or verification).
   * Updates the order, decrements listing stock, sends emails.
   *
   * Handles both single-store and multi-store orders:
   * - Single-store: order.sellerId is set → use it
   * - Multi-store: order.sellerId is null → use items[].sellerId
   */
  async confirmPayment(
    orderId: string,
    paymentReference: string,
    paystackReference: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.Success) {
      throw new BadRequestException('Order is already paid');
    }

    // Update payment info
    order.paymentStatus = PaymentStatus.Success;
    order.status = OrderStatus.Confirmed;
    order.paymentInfo = {
      method: 'paystack',
      reference: paymentReference,
      paystackReference,
      paidAt: new Date(),
      status: 'success',
    };

    const updatedOrder = await order.save();

    // Update listing stock per item
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _item of order.items) {
      // Decrement quantity
      // If quantity reaches 0, the listing should be marked as sold
      // (handled in a more robust way with the listings service later)
    }

    // Update store and creator stats per item (handles multi-store)
    const processedStores = new Set<string>();
    const processedCreators = new Set<string>();

    for (const item of order.items) {
      const itemStoreId =
        (item as any).storeId?.toString() || order.storeId?.toString();
      const itemCreatorId =
        (item as any).creatorId?.toString() || order.creatorId?.toString();

      if (itemStoreId && !processedStores.has(itemStoreId)) {
        processedStores.add(itemStoreId);
        await this.storesService
          .updateStats(itemStoreId, 'totalSales', 1)
          .catch(() => {});
      }
      if (itemCreatorId && !processedCreators.has(itemCreatorId)) {
        processedCreators.add(itemCreatorId);
        await this.creatorsService
          .updateStats(itemCreatorId, 'totalSales', 1)
          .catch(() => {});
      }
    }

    // ─── Send emails ──────────────────────────────────────────

    // Populate buyer
    const populatedOrder = await this.orderModel
      .findById(orderId)
      .populate('buyerId', 'firstName lastName email')
      .exec();

    if (populatedOrder) {
      const buyer = populatedOrder.buyerId as any;

      // Determine receipt email: checkout override → user email
      const receiptTo = updatedOrder.receiptEmail || buyer.email;

      Logger.log(
        `Sending order confirmation for ${order.orderNumber} to ${receiptTo}` +
          (updatedOrder.receiptEmail
            ? ` (override from checkout)`
            : ` (user email)`),
      );

      // Email to buyer: "Your order is confirmed"
      const confirmationData = {
        buyerName: buyer.firstName,
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress as any,
      };

      try {
        await this.notificationsService.sendOrderConfirmation(
          receiptTo,
          confirmationData,
        );
        Logger.log(`✅ Order confirmation sent to ${receiptTo}`);
      } catch (emailError) {
        Logger.error(
          `❌ Failed to send order confirmation to ${receiptTo}: ${emailError.message}`,
        );
      }

      // Separate admin copy — paid, so no payOnDelivery flag.
      try {
        await this.notificationsService.sendAdminOrderCopy(confirmationData);
      } catch (adminEmailError) {
        Logger.error(
          `❌ Failed to send admin copy: ${adminEmailError.message}`,
        );
      }

      // WhatsApp order alert to the store owner (paid online)
      try {
        await this.notificationsService.sendOwnerOrderWhatsapp({
          orderNumber: order.orderNumber,
          buyerName: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim(),
          phoneNumber: (order.shippingAddress as any)?.phoneNumber,
          items: confirmationData.items,
          totalAmount: order.totalAmount,
          paymentLabel: `Paid online (${order.paymentInfo?.method || 'paystack'})`,
          shippingAddress: order.shippingAddress as any,
          buyerNote: order.buyerNote,
        });
      } catch (waError) {
        Logger.error(`❌ Failed owner WhatsApp alert: ${waError.message}`);
      }

      // Email to each unique seller: "You made a sale!"
      // Collect unique sellers from item-level sellerId
      const sellerItemsMap = new Map<
        string,
        {
          sellerId: string;
          items: typeof order.items;
          payout: number;
        }
      >();

      for (const item of order.items) {
        const sellerId = (item as any).sellerId?.toString();
        if (!sellerId) continue;

        if (!sellerItemsMap.has(sellerId)) {
          sellerItemsMap.set(sellerId, { sellerId, items: [], payout: 0 });
        }
        const entry = sellerItemsMap.get(sellerId);
        entry.items.push(item);

        // Calculate seller payout for this item
        const commissionRate = (item as any).commissionRate ?? 15;
        if ((item as any).type === 'direct_purchase') {
          // Platform gets everything for direct_purchase
        } else {
          const fee = Math.round(item.totalPrice * (commissionRate / 100));
          entry.payout += item.totalPrice - fee;
        }
      }

      // Fetch all unique sellers and send emails
      for (const [sellerId, entry] of sellerItemsMap) {
        if (entry.payout <= 0) continue; // No payout = no alert needed

        try {
          const sellerUser = await this.orderModel.db
            .collection('users')
            .findOne(
              { _id: new Types.ObjectId(sellerId) },
              { projection: { firstName: 1, lastName: 1, email: 1 } },
            );

          if (sellerUser) {
            await this.notificationsService.sendNewOrderAlert(
              sellerUser.email,
              {
                sellerName: sellerUser.firstName,
                orderNumber: order.orderNumber,
                itemName:
                  entry.items.length === 1
                    ? entry.items[0].itemName
                    : `${entry.items.length} items`,
                quantity: entry.items.reduce((sum, i) => sum + i.quantity, 0),
                sellerPayout: entry.payout,
                buyerName: `${buyer.firstName} ${buyer.lastName}`,
              },
            );
          }
        } catch (err) {
          Logger.error(
            `Failed to send seller alert to ${sellerId}: ${err.message}`,
          );
        }
      }
    }

    // ─── In-app alerts ──────────────────────────────────────────
    const itemsSummary =
      order.items.length === 1
        ? order.items[0].itemName
        : `${order.items.length} items`;

    // Alert buyer: order confirmed
    this.alertsService
      .createAlert({
        userId: order.buyerId.toString(),
        type: AlertType.OrderConfirmed,
        title: 'Order Confirmed! ✅',
        message: `Your order #${order.orderNumber} for ${itemsSummary} has been confirmed. We'll notify you when it's being processed.`,
        entityId: order._id,
        entityType: 'order',
        metadata: { orderNumber: order.orderNumber },
      })
      .catch(() => {});

    // NOTE: sellers are alerted (NewOrderReceived) at order-creation time via
    // notifyOrderCreated(), so we intentionally do NOT re-alert them here to
    // avoid duplicate "new order" notifications.

    return updatedOrder;
  }

  // ─── Find by Payment Reference ───────────────────────────

  /**
   * Look up an order by Paystack payment reference.
   * Used by the Paystack webhook to find which order to confirm.
   */
  async findByPaymentReference(reference: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findOne({ 'paymentInfo.reference': reference })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found for this payment reference');
    }

    return order;
  }

  // ─── Internal Find (no access control) ──────────────────

  /**
   * Get order by ID without access control checks.
   * Used by PaymentsService when processing webhooks — we already
   * know the payment is legitimate because Paystack verified it.
   */
  async findByIdInternal(orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  // ─── Get Single Order ────────────────────────────────────

  /**
   * Get order details. Populates buyer, seller, store, creator info.
   * Access control: only buyer, seller, or admin can view.
   */
  async findById(orderId: string, userId: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(orderId)
      .populate('buyerId', 'firstName lastName email avatar')
      .populate('sellerId', 'firstName lastName email avatar')
      .populate('storeId', 'name slug logo')
      .populate({
        path: 'creatorId',
        select: 'username slug profileImageUrl',
      })
      .populate('items.storeId', 'name slug logo')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Access control: buyer, seller (order-level or item-level), or admin
    const isBuyer = order.buyerId._id?.toString() === userId;
    const isSeller =
      order.sellerId?._id?.toString() === userId ||
      order.items.some((item: any) => item.sellerId?.toString() === userId);

    if (!isBuyer && !isSeller) {
      // Admin check happens at the controller level via RolesGuard
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  // ─── Update Order Status (Admin) ─────────────────────────

  /**
   * Admin moves the order through the pipeline.
   * Validates status transitions — you can't skip steps.
   *
   * Valid transitions:
   *   confirmed → processing
   *   processing → shipped (requires tracking info)
   *   shipped → delivered
   *   delivered → completed
   *   pending/confirmed → cancelled (with reason)
   */
  async updateStatus(
    orderId: string,
    updateDto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const {
      status,
      paymentStatus,
      adminNote,
      cancellationReason,
      carrier,
      trackingNumber,
      estimatedDelivery,
    } = updateDto;

    if (!status && !paymentStatus) {
      throw new BadRequestException(
        'Provide a status, a paymentStatus, or both.',
      );
    }

    // ─── Payment status ──────────────────────────────────────
    // This is how a pay-on-delivery order gets settled: the cash arrives, an
    // admin sets paymentStatus to `success`, and only then does the buyer get
    // a receipt.
    const wasUnpaid = order.paymentStatus !== PaymentStatus.Success;
    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === PaymentStatus.Success) {
        order.paymentInfo = {
          ...order.paymentInfo,
          method: order.paymentInfo?.method || 'pay_on_delivery',
          status: 'success',
          paidAt: new Date(),
        };
      }
    }

    if (!status) {
      if (adminNote) order.adminNote = adminNote;
      const savedOrder = await order.save();
      if (
        wasUnpaid &&
        savedOrder.paymentStatus === PaymentStatus.Success
      ) {
        await this.dispatchPaymentReceipt(savedOrder._id.toString()).catch((e) =>
          Logger.error(
            `Receipt for ${savedOrder.orderNumber} failed: ${e.message}`,
          ),
        );
      }
      return savedOrder;
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
      [OrderStatus.Confirmed]: [OrderStatus.Processing, OrderStatus.Cancelled],
      [OrderStatus.Processing]: [OrderStatus.Shipped, OrderStatus.Cancelled],
      [OrderStatus.Shipped]: [OrderStatus.Delivered],
      [OrderStatus.Delivered]: [OrderStatus.Completed],
      [OrderStatus.Completed]: [], // Terminal state
      [OrderStatus.Cancelled]: [], // Terminal state
      [OrderStatus.Refunded]: [], // Terminal state
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from "${order.status}" to "${status}". ` +
          `Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`,
      );
    }

    // Status-specific validation
    if (status === OrderStatus.Cancelled && !cancellationReason) {
      throw new BadRequestException(
        'Cancellation reason is required when cancelling an order',
      );
    }

    if (status === OrderStatus.Shipped) {
      order.trackingInfo = {
        ...order.trackingInfo,
        carrier: carrier || order.trackingInfo?.carrier,
        trackingNumber: trackingNumber || order.trackingInfo?.trackingNumber,
        estimatedDelivery: estimatedDelivery
          ? new Date(estimatedDelivery)
          : order.trackingInfo?.estimatedDelivery,
        shippedAt: new Date(),
      };
    }

    if (status === OrderStatus.Delivered) {
      order.trackingInfo = {
        ...order.trackingInfo,
        deliveredAt: new Date(),
      };
    }

    // Auto-transition disbursement status when order completes
    if (status === OrderStatus.Completed) {
      if (order.disbursementStatus === 'awaiting_completion') {
        order.disbursementStatus = 'awaiting_disbursement';
      }
    }

    // If cancelled/refunded, disbursement is not applicable
    if (status === OrderStatus.Cancelled || status === OrderStatus.Refunded) {
      order.disbursementStatus = 'not_applicable';
    }

    // Update fields
    order.status = status;
    if (adminNote) order.adminNote = adminNote;
    if (cancellationReason) order.cancellationReason = cancellationReason;

    const savedOrder = await order.save();

    // Notify buyer about status change (fire and forget)
    const populatedOrder = await this.orderModel
      .findById(order._id)
      .populate('buyerId', 'firstName email')
      .exec();

    if (populatedOrder) {
      const buyer = populatedOrder.buyerId as any;
      this.notificationsService.sendOrderStatusUpdate(buyer.email, {
        buyerName: buyer.firstName,
        orderNumber: order.orderNumber,
        status,
        trackingNumber: order.trackingInfo?.trackingNumber,
        carrier: order.trackingInfo?.carrier,
      });
    }

    if (wasUnpaid && savedOrder.paymentStatus === PaymentStatus.Success) {
      await this.dispatchPaymentReceipt(savedOrder._id.toString()).catch((e) =>
        Logger.error(
          `Receipt for ${savedOrder.orderNumber} failed: ${e.message}`,
        ),
      );
    }

    // ─── In-app alert for status change ─────────────────────
    const statusAlertMap: Record<
      string,
      { type: AlertType; title: string; message: string }
    > = {
      [OrderStatus.Processing]: {
        type: AlertType.OrderProcessing,
        title: 'Order Being Processed 📦',
        message: `Your order #${order.orderNumber} is now being processed and prepared for shipping.`,
      },
      [OrderStatus.Shipped]: {
        type: AlertType.OrderShipped,
        title: 'Order Shipped! 🚚',
        message: `Your order #${order.orderNumber} has been shipped${order.trackingInfo?.carrier ? ` via ${order.trackingInfo.carrier}` : ''}.${order.trackingInfo?.trackingNumber ? ` Tracking: ${order.trackingInfo.trackingNumber}` : ''}`,
      },
      [OrderStatus.Delivered]: {
        type: AlertType.OrderDelivered,
        title: 'Order Delivered! 📬',
        message: `Your order #${order.orderNumber} has been delivered. Please confirm receipt to complete the order.`,
      },
      [OrderStatus.Completed]: {
        type: AlertType.OrderCompleted,
        title: 'Order Completed ✅',
        message: `Your order #${order.orderNumber} is now complete. Thank you for shopping on Kraft!`,
      },
      [OrderStatus.Cancelled]: {
        type: AlertType.OrderCancelled,
        title: 'Order Cancelled ❌',
        message: `Your order #${order.orderNumber} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
      },
    };

    const alertConfig = statusAlertMap[status];
    if (alertConfig) {
      this.alertsService
        .createAlert({
          userId: order.buyerId.toString(),
          ...alertConfig,
          entityId: order._id,
          entityType: 'order',
          metadata: { orderNumber: order.orderNumber, status },
        })
        .catch(() => {});
    }

    return savedOrder;
  }

  // ─── Mark Order as Disbursed (Admin) ─────────────────────

  /**
   * Admin marks an order's seller payout as disbursed.
   * Only orders with disbursementStatus 'awaiting_disbursement' can be marked.
   */
  async markDisbursed(orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.disbursementStatus !== 'awaiting_disbursement') {
      throw new BadRequestException(
        `Cannot disburse an order with disbursement status "${order.disbursementStatus}". ` +
          `Only orders with status "awaiting_disbursement" can be disbursed.`,
      );
    }

    order.disbursementStatus = 'disbursed';
    (order as any).disbursedAt = new Date();

    return order.save();
  }

  // ─── My Orders (Buyer) ──────────────────────────────────

  /**
   * Get all orders placed by the authenticated buyer.
   */
  async findBuyerOrders(
    buyerId: string,
    queryDto: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderDocument>> {
    const {
      page,
      perPage,
      sort,
      search,
      status,
      paymentStatus,
      disbursementStatus,
    } = queryDto;

    const filter: Record<string, any> = {
      buyerId: new Types.ObjectId(buyerId),
    };

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (disbursementStatus) filter.disbursementStatus = disbursementStatus;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.itemName': { $regex: search, $options: 'i' } },
        { 'shippingInfo.trackingNumber': { $regex: search, $options: 'i' } },
        { 'paymentInfo.reference': { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj: Record<string, 1 | -1> = {};
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      sortObj[sortField] = sort.startsWith('-') ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }

    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('storeId', 'name slug logo')
        .populate('sellerId', 'firstName lastName')
        .populate('items.storeId', 'name slug logo')
        .sort(sortObj)
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // ─── My Sales (Seller) ──────────────────────────────────

  /**
   * Get all orders for items the authenticated creator sold.
   * Used on the creator dashboard to manage incoming orders.
   */
  async findSellerOrders(
    sellerId: string,
    queryDto: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderDocument>> {
    const {
      page,
      perPage,
      sort,
      search,
      status,
      paymentStatus,
      disbursementStatus,
      storeId,
    } = queryDto;

    const sellerOid = new Types.ObjectId(sellerId);

    const filter: Record<string, any> = {
      // Match orders where seller is at order-level OR in any item
      $or: [{ sellerId: sellerOid }, { 'items.sellerId': sellerOid }],
    };

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (disbursementStatus) filter.disbursementStatus = disbursementStatus;
    if (storeId) {
      const storeOid = new Types.ObjectId(storeId);
      filter.$and = [
        { $or: [{ storeId: storeOid }, { 'items.storeId': storeOid }] },
      ];
      // Move the seller $or into $and to combine properly
      delete filter.$or;
      filter.$and.push({
        $or: [{ sellerId: sellerOid }, { 'items.sellerId': sellerOid }],
      });
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.itemName': { $regex: search, $options: 'i' } },
        { 'shippingInfo.trackingNumber': { $regex: search, $options: 'i' } },
        { 'paymentInfo.reference': { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj: Record<string, 1 | -1> = {};
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      sortObj[sortField] = sort.startsWith('-') ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }

    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('buyerId', 'firstName lastName email')
        .populate('storeId', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // ─── Admin: All Orders ──────────────────────────────────

  /**
   * Get all orders across the platform (admin dashboard).
   */
  async findAll(
    queryDto: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderDocument>> {
    const {
      page,
      perPage,
      sort,
      search,
      status,
      paymentStatus,
      disbursementStatus,
      storeId,
    } = queryDto;

    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (disbursementStatus) filter.disbursementStatus = disbursementStatus;
    if (storeId) filter.storeId = new Types.ObjectId(storeId);

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.itemName': { $regex: search, $options: 'i' } },
        { 'shippingInfo.trackingNumber': { $regex: search, $options: 'i' } },
        { 'paymentInfo.reference': { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj: Record<string, 1 | -1> = {};
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      sortObj[sortField] = sort.startsWith('-') ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }

    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('buyerId', 'firstName lastName email')
        .populate('sellerId', 'firstName lastName email')
        .populate('storeId', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // ─── Stats ───────────────────────────────────────────────

  async countOrders(filter: Record<string, any> = {}): Promise<number> {
    return this.orderModel.countDocuments(filter).exec();
  }

  /**
   * Calculate total revenue for a period.
   */
  async calculateRevenue(filter: Record<string, any> = {}): Promise<{
    totalRevenue: number;
    platformRevenue: number;
    sellerPayouts: number;
  }> {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          ...filter,
          paymentStatus: PaymentStatus.Success,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          platformRevenue: { $sum: '$revenueSplit.platformFee' },
          sellerPayouts: { $sum: '$revenueSplit.sellerPayout' },
        },
      },
    ]);

    return (
      result[0] || { totalRevenue: 0, platformRevenue: 0, sellerPayouts: 0 }
    );
  }
}
