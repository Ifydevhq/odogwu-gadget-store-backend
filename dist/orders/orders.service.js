"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("./schemas/order.schema");
const stores_service_1 = require("../stores/stores.service");
const creators_service_1 = require("../creators/creators.service");
const contants_1 = require("../config/contants");
const notifications_service_1 = require("../notifications/notifications.service");
const listings_service_1 = require("../listings/listings.service");
const alerts_service_1 = require("../alerts/alerts.service");
const contants_2 = require("../config/contants");
const wallet_service_1 = require("../wallet/wallet.service");
const wallet_transaction_schema_1 = require("../wallet/schemas/wallet-transaction.schema");
const platform_settings_service_1 = require("../platform-settings/platform-settings.service");
let OrdersService = OrdersService_1 = class OrdersService {
    constructor(orderModel, listingsService, storesService, creatorsService, notificationsService, alertsService, walletService, platformSettingsService) {
        this.orderModel = orderModel;
        this.listingsService = listingsService;
        this.storesService = storesService;
        this.creatorsService = creatorsService;
        this.notificationsService = notificationsService;
        this.alertsService = alertsService;
        this.walletService = walletService;
        this.platformSettingsService = platformSettingsService;
        this.logger = new common_1.Logger(OrdersService_1.name);
    }
    async computeCreditPlan(buyerId, payableKobo, capKobo) {
        if (!(payableKobo > 0))
            return { promo: 0, earned: 0, total: 0 };
        const settings = await this.platformSettingsService.getSettings();
        const maxPromoPercent = settings?.creditMaxPercentPerOrder ?? 20;
        let { promoApplied, earnedApplied } = await this.walletService.computeRedeemable(buyerId, payableKobo, maxPromoPercent);
        if (capKobo != null && capKobo >= 0) {
            const cap = Math.floor(capKobo);
            let total = promoApplied + earnedApplied;
            if (total > cap) {
                const overflow = total - cap;
                const cutEarned = Math.min(earnedApplied, overflow);
                earnedApplied -= cutEarned;
                const rem = overflow - cutEarned;
                promoApplied -= Math.min(promoApplied, rem);
            }
        }
        let promo = Math.max(0, Math.floor(promoApplied));
        let earned = Math.max(0, Math.floor(earnedApplied));
        if (promo + earned > payableKobo) {
            const overflow = promo + earned - payableKobo;
            const cutEarned = Math.min(earned, overflow);
            earned -= cutEarned;
            promo -= Math.min(promo, overflow - cutEarned);
        }
        return { promo, earned, total: promo + earned };
    }
    reserveCreditOnOrder(order, promo, earned) {
        const total = Math.max(0, promo) + Math.max(0, earned);
        if (total <= 0)
            return;
        if (total > order.totalAmount)
            return;
        order.walletCreditApplied = total;
        order.walletCreditBreakdown = {
            promo: Math.max(0, promo),
            earned: Math.max(0, earned),
        };
        order.totalAmount = order.totalAmount - total;
    }
    async applyCreditImmediate(order, buyerId, capKobo) {
        const plan = await this.computeCreditPlan(buyerId, order.totalAmount, capKobo);
        if (plan.total <= 0)
            return;
        let debitedPromo = 0;
        let debitedEarned = 0;
        let firstTxnId;
        if (plan.promo > 0) {
            try {
                const txn = await this.walletService.debit({
                    userId: buyerId,
                    amount: plan.promo,
                    bucket: wallet_transaction_schema_1.WalletBucket.Promo,
                    type: wallet_transaction_schema_1.WalletTxnType.PurchaseRedemption,
                    description: `Wallet credit (promo) applied to order ${order.orderNumber}`,
                    orderId: order._id,
                    idempotencyKey: `redeem:${order._id}:promo`,
                });
                debitedPromo = txn.amount;
                firstTxnId = txn._id;
            }
            catch (err) {
                this.logger.warn(`COD promo debit failed for ${order.orderNumber}: ${err?.message}`);
            }
        }
        if (plan.earned > 0) {
            try {
                const txn = await this.walletService.debit({
                    userId: buyerId,
                    amount: plan.earned,
                    bucket: wallet_transaction_schema_1.WalletBucket.Earned,
                    type: wallet_transaction_schema_1.WalletTxnType.PurchaseRedemption,
                    description: `Wallet credit (earned) applied to order ${order.orderNumber}`,
                    orderId: order._id,
                    idempotencyKey: `redeem:${order._id}:earned`,
                });
                debitedEarned = txn.amount;
                if (!firstTxnId)
                    firstTxnId = txn._id;
            }
            catch (err) {
                this.logger.warn(`COD earned debit failed for ${order.orderNumber}: ${err?.message}`);
            }
        }
        const debitedTotal = debitedPromo + debitedEarned;
        if (debitedTotal <= 0)
            return;
        order.walletCreditApplied = debitedTotal;
        order.walletCreditBreakdown = { promo: debitedPromo, earned: debitedEarned };
        if (firstTxnId)
            order.walletRedemptionTxnId = firstTxnId;
        order.totalAmount = order.totalAmount - debitedTotal;
        await order.save();
    }
    async settleReservedCredit(order, buyerId) {
        if (!(order.walletCreditApplied > 0))
            return;
        if (order.walletRedemptionTxnId)
            return;
        const breakdown = order.walletCreditBreakdown || { promo: 0, earned: 0 };
        const balance = await this.walletService.getBalance(buyerId);
        const promo = Math.min(Math.max(0, breakdown.promo || 0), balance.promoBalance);
        const earned = Math.min(Math.max(0, breakdown.earned || 0), balance.earnedBalance);
        let firstTxnId;
        let debited = 0;
        if (promo > 0) {
            try {
                const txn = await this.walletService.debit({
                    userId: buyerId,
                    amount: promo,
                    bucket: wallet_transaction_schema_1.WalletBucket.Promo,
                    type: wallet_transaction_schema_1.WalletTxnType.PurchaseRedemption,
                    description: `Wallet credit (promo) applied to order ${order.orderNumber}`,
                    orderId: order._id,
                    idempotencyKey: `redeem:${order._id}:promo`,
                });
                firstTxnId = txn._id;
                debited += txn.amount;
            }
            catch (err) {
                this.logger.error(`Settle promo debit failed for ${order.orderNumber}: ${err?.message}`);
            }
        }
        if (earned > 0) {
            try {
                const txn = await this.walletService.debit({
                    userId: buyerId,
                    amount: earned,
                    bucket: wallet_transaction_schema_1.WalletBucket.Earned,
                    type: wallet_transaction_schema_1.WalletTxnType.PurchaseRedemption,
                    description: `Wallet credit (earned) applied to order ${order.orderNumber}`,
                    orderId: order._id,
                    idempotencyKey: `redeem:${order._id}:earned`,
                });
                if (!firstTxnId)
                    firstTxnId = txn._id;
                debited += txn.amount;
            }
            catch (err) {
                this.logger.error(`Settle earned debit failed for ${order.orderNumber}: ${err?.message}`);
            }
        }
        if (debited < order.walletCreditApplied) {
            this.logger.error(`Wallet redemption shortfall on ${order.orderNumber}: reserved ` +
                `${order.walletCreditApplied} but only debited ${debited} kobo ` +
                `(balance dropped since reservation; platform absorbs the difference).`);
        }
        if (firstTxnId) {
            order.walletRedemptionTxnId = firstTxnId;
            await order.save();
        }
    }
    async reverseOrderCredit(order, reason) {
        if (!(order?.walletCreditApplied > 0))
            return;
        try {
            await this.walletService.reverseOrderRedemptions(order._id.toString(), reason);
        }
        catch (err) {
            this.logger.error(`Failed to reverse wallet credit for ${order.orderNumber}: ${err?.message}`);
        }
    }
    generateOrderNumber() {
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `CMK-${dateStr}-${suffix}`;
    }
    calculateRevenueSplit(listing, quantity) {
        const unitPrice = listing.discountPrice ||
            listing.adminPricing?.sellingPrice ||
            listing.askingPrice.amount;
        const totalAmount = unitPrice * quantity;
        if (listing.type === contants_1.ListingType.DirectPurchase) {
            return {
                unitPrice,
                totalAmount,
                platformFee: totalAmount,
                sellerPayout: 0,
                commissionRate: 100,
            };
        }
        if (listing.type === contants_1.ListingType.Consignment) {
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
        throw new common_1.BadRequestException('Invalid listing type for ordering');
    }
    async notifyOrderCreated(order, opts = {}) {
        const { notifyBuyer = true } = opts;
        const buyerId = order.buyerId?.toString();
        const sellerIds = new Set();
        const orderSeller = order.sellerId?._id?.toString() ||
            order.sellerId?.toString();
        if (orderSeller)
            sellerIds.add(orderSeller);
        for (const item of order.items || []) {
            const sid = item.sellerId?.toString();
            if (sid)
                sellerIds.add(sid);
        }
        if (buyerId)
            sellerIds.delete(buyerId);
        const itemsSummary = order.items.length === 1
            ? order.items[0].itemName
            : `${order.items.length} items`;
        const orderRoute = `/orders/${order._id.toString()}`;
        for (const sellerId of sellerIds) {
            this.alertsService
                .createAlertAndPush({
                userId: sellerId,
                type: contants_2.AlertType.NewOrderReceived,
                title: 'New Order Received! 🎉',
                message: `You received a new order #${order.orderNumber} for ${itemsSummary}. Check your orders for details.`,
                entityId: order._id.toString(),
                entityType: 'order',
                metadata: { orderNumber: order.orderNumber },
                route: orderRoute,
            })
                .catch(() => { });
        }
        if (notifyBuyer && buyerId) {
            this.alertsService
                .createAlertAndPush({
                userId: buyerId,
                type: contants_2.AlertType.OrderPlaced,
                title: 'Order placed 🛍️',
                message: `We have received your order #${order.orderNumber} for ${itemsSummary}.`,
                entityId: order._id.toString(),
                entityType: 'order',
                metadata: { orderNumber: order.orderNumber },
                route: orderRoute,
            })
                .catch(() => { });
        }
    }
    async create(buyerId, createOrderDto) {
        const { listingId, quantity, shippingAddress, buyerNote, applyWalletCredit, walletCreditAmount, } = createOrderDto;
        const listing = await this.listingsService.findById(listingId);
        if (listing.userId.toString() === buyerId) {
            throw new common_1.BadRequestException('You cannot purchase your own listing');
        }
        if (listing.type === contants_1.ListingType.SelfListing) {
            throw new common_1.BadRequestException('Self-listed items cannot be purchased on the platform. ' +
                'Please contact the seller via WhatsApp.');
        }
        if (listing.status !== contants_1.ListingStatus.Live) {
            throw new common_1.BadRequestException('This listing is not available for purchase');
        }
        if (listing.quantity < quantity) {
            throw new common_1.BadRequestException(`Only ${listing.quantity} item(s) available`);
        }
        const split = this.calculateRevenueSplit(listing, quantity);
        const order = new this.orderModel({
            orderNumber: this.generateOrderNumber(),
            buyerId: new mongoose_2.Types.ObjectId(buyerId),
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
            shippingFee: 0,
            discount: 0,
            totalAmount: split.totalAmount,
            currency: listing.askingPrice.currency,
            revenueSplit: {
                totalAmount: split.totalAmount,
                platformFee: split.platformFee,
                sellerPayout: split.sellerPayout,
                commissionRate: split.commissionRate,
            },
            shippingAddress,
            buyerNote,
            status: contants_1.OrderStatus.Pending,
            paymentStatus: contants_1.PaymentStatus.Pending,
            disbursementStatus: split.sellerPayout > 0 ? 'awaiting_completion' : 'not_applicable',
        });
        let saved = await order.save();
        const wantsCredit = applyWalletCredit === true || (walletCreditAmount ?? 0) > 0;
        if (wantsCredit) {
            try {
                const plan = await this.computeCreditPlan(buyerId, saved.totalAmount, walletCreditAmount);
                if (plan.total > 0) {
                    this.reserveCreditOnOrder(saved, plan.promo, plan.earned);
                    saved = await saved.save();
                }
            }
            catch (err) {
                this.logger.warn(`Wallet credit reservation skipped for ${saved.orderNumber}: ${err?.message}`);
            }
        }
        await this.notifyOrderCreated(saved);
        if (saved.walletCreditApplied > 0 && saved.totalAmount <= 0) {
            try {
                saved = await this.confirmPayment(saved._id.toString(), `WALLET-${saved._id}`, `WALLET-${saved._id}`, 'wallet_credit');
            }
            catch (err) {
                this.logger.error(`Auto-confirm of fully-credited order ${saved.orderNumber} failed: ${err?.message}`);
            }
        }
        return saved;
    }
    async createCartOrder(buyerId, items, shippingAddress, buyerNote, receiptEmail, deliveryFee = 0, notifyBuyer = true, walletCredit) {
        const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
        let totalPlatformFee = 0;
        let totalSellerPayout = 0;
        for (const item of items) {
            if (item.type === 'direct_purchase') {
                totalPlatformFee += item.totalPrice;
            }
            else {
                const fee = Math.round(item.totalPrice * (item.commissionRate / 100));
                totalPlatformFee += fee;
                totalSellerPayout += item.totalPrice - fee;
            }
        }
        const avgCommission = subtotal > 0 ? Math.round((totalPlatformFee / subtotal) * 100) : 0;
        const uniqueSellers = [...new Set(items.map((i) => i.sellerId))];
        const uniqueStores = [...new Set(items.map((i) => i.storeId))];
        const uniqueCreators = [...new Set(items.map((i) => i.creatorId))];
        const order = new this.orderModel({
            orderNumber: this.generateOrderNumber(),
            buyerId: new mongoose_2.Types.ObjectId(buyerId),
            sellerId: uniqueSellers.length === 1
                ? new mongoose_2.Types.ObjectId(uniqueSellers[0])
                : null,
            creatorId: uniqueCreators.length === 1
                ? new mongoose_2.Types.ObjectId(uniqueCreators[0])
                : null,
            storeId: uniqueStores.length === 1 ? new mongoose_2.Types.ObjectId(uniqueStores[0]) : null,
            items: items.map((i) => ({
                listingId: new mongoose_2.Types.ObjectId(i.listingId),
                itemName: i.itemName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                totalPrice: i.totalPrice,
                type: i.type,
                image: i.image,
                storeId: new mongoose_2.Types.ObjectId(i.storeId),
                sellerId: new mongoose_2.Types.ObjectId(i.sellerId),
                creatorId: new mongoose_2.Types.ObjectId(i.creatorId),
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
            status: contants_1.OrderStatus.Pending,
            paymentStatus: contants_1.PaymentStatus.Pending,
            disbursementStatus: totalSellerPayout > 0 ? 'awaiting_completion' : 'not_applicable',
        });
        let saved = await order.save();
        if (walletCredit) {
            try {
                if (walletCredit.mode === 'reserve') {
                    this.reserveCreditOnOrder(saved, walletCredit.promo, walletCredit.earned);
                    saved = await saved.save();
                }
                else {
                    await this.applyCreditImmediate(saved, buyerId, walletCredit.capKobo);
                }
            }
            catch (err) {
                this.logger.warn(`Wallet credit application skipped for ${saved.orderNumber}: ${err?.message}`);
            }
        }
        await this.notifyOrderCreated(saved, { notifyBuyer });
        return saved;
    }
    async createPayOnDeliveryOrder(buyerId, items, shippingAddress, buyerNote, receiptEmail, deliveryFee = 0, walletCredit) {
        const order = await this.createCartOrder(buyerId, items, shippingAddress, buyerNote, receiptEmail, deliveryFee, false, walletCredit?.apply
            ? { mode: 'immediate', capKobo: walletCredit.capKobo }
            : undefined);
        order.status = contants_1.OrderStatus.Pending;
        order.paymentStatus = contants_1.PaymentStatus.Pending;
        order.paymentInfo = { method: 'pay_on_delivery', status: 'pending' };
        const saved = await order.save();
        await this.dispatchPayOnDeliveryNotifications(saved._id.toString()).catch((e) => common_1.Logger.error(`COD notifications failed for ${saved.orderNumber}: ${e.message}`));
        return saved;
    }
    async dispatchPaymentReceipt(orderId) {
        const order = await this.orderModel
            .findById(orderId)
            .populate('buyerId', 'firstName lastName email')
            .exec();
        if (!order)
            return;
        const buyer = order.buyerId;
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
                shippingAddress: order.shippingAddress,
            });
        }
        try {
            await this.alertsService.createAlert({
                userId: order.buyerId.toString(),
                type: contants_2.AlertType.PaymentSuccessful,
                title: 'Payment received ✅',
                message: `We have received payment for order #${order.orderNumber}.`,
                entityId: order._id,
                entityType: 'order',
            });
        }
        catch {
        }
    }
    async dispatchPayOnDeliveryNotifications(orderId) {
        const order = await this.orderModel
            .findById(orderId)
            .populate('buyerId', 'firstName lastName email')
            .exec();
        if (!order)
            return;
        const buyer = order.buyerId;
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
            shippingAddress: order.shippingAddress,
        };
        if (receiptTo) {
            try {
                await this.notificationsService.sendOrderPlacedOnDelivery(receiptTo, confirmationData);
            }
            catch (e) {
                common_1.Logger.error(`❌ COD buyer email failed: ${e.message}`);
            }
        }
        try {
            await this.notificationsService.sendAdminOrderCopy({
                ...confirmationData,
                payOnDelivery: true,
            });
        }
        catch (e) {
            common_1.Logger.error(`❌ COD admin copy failed: ${e.message}`);
        }
        try {
            await this.notificationsService.sendOwnerOrderWhatsapp({
                orderNumber: order.orderNumber,
                buyerName: `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim() ||
                    'Customer',
                phoneNumber: order.shippingAddress?.phoneNumber,
                items: confirmationData.items,
                totalAmount: order.totalAmount,
                paymentLabel: 'Pay on Delivery',
                shippingAddress: order.shippingAddress,
                buyerNote: order.buyerNote,
            });
        }
        catch (e) {
            common_1.Logger.error(`❌ COD owner WhatsApp failed: ${e.message}`);
        }
        try {
            await this.alertsService.createAlert({
                userId: order.buyerId.toString(),
                type: contants_2.AlertType.OrderPlaced,
                title: 'Order placed 🛵',
                message: `We have received order #${order.orderNumber}. ` +
                    `Our team will reach out to confirm it — payment is due on delivery.`,
                entityId: order._id,
                entityType: 'order',
            });
        }
        catch {
        }
    }
    async confirmPayment(orderId, paymentReference, paystackReference, method = 'paystack') {
        const order = await this.orderModel.findById(orderId).exec();
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.paymentStatus === contants_1.PaymentStatus.Success) {
            throw new common_1.BadRequestException('Order is already paid');
        }
        order.paymentStatus = contants_1.PaymentStatus.Success;
        order.status = contants_1.OrderStatus.Confirmed;
        order.paymentInfo = {
            method,
            reference: paymentReference,
            paystackReference,
            paidAt: new Date(),
            status: 'success',
        };
        const updatedOrder = await order.save();
        await this.settleReservedCredit(updatedOrder, updatedOrder.buyerId.toString()).catch((err) => this.logger.error(`settleReservedCredit failed for ${updatedOrder.orderNumber}: ${err?.message}`));
        for (const _item of order.items) {
        }
        const processedStores = new Set();
        const processedCreators = new Set();
        for (const item of order.items) {
            const itemStoreId = item.storeId?.toString() || order.storeId?.toString();
            const itemCreatorId = item.creatorId?.toString() || order.creatorId?.toString();
            if (itemStoreId && !processedStores.has(itemStoreId)) {
                processedStores.add(itemStoreId);
                await this.storesService
                    .updateStats(itemStoreId, 'totalSales', 1)
                    .catch(() => { });
            }
            if (itemCreatorId && !processedCreators.has(itemCreatorId)) {
                processedCreators.add(itemCreatorId);
                await this.creatorsService
                    .updateStats(itemCreatorId, 'totalSales', 1)
                    .catch(() => { });
            }
        }
        const populatedOrder = await this.orderModel
            .findById(orderId)
            .populate('buyerId', 'firstName lastName email')
            .exec();
        if (populatedOrder) {
            const buyer = populatedOrder.buyerId;
            const receiptTo = updatedOrder.receiptEmail || buyer.email;
            common_1.Logger.log(`Sending order confirmation for ${order.orderNumber} to ${receiptTo}` +
                (updatedOrder.receiptEmail
                    ? ` (override from checkout)`
                    : ` (user email)`));
            const confirmationData = {
                buyerName: buyer.firstName,
                orderNumber: order.orderNumber,
                items: order.items.map((item) => ({
                    itemName: item.itemName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
                totalAmount: order.totalAmount,
                shippingAddress: order.shippingAddress,
            };
            try {
                await this.notificationsService.sendOrderConfirmation(receiptTo, confirmationData);
                common_1.Logger.log(`✅ Order confirmation sent to ${receiptTo}`);
            }
            catch (emailError) {
                common_1.Logger.error(`❌ Failed to send order confirmation to ${receiptTo}: ${emailError.message}`);
            }
            try {
                await this.notificationsService.sendAdminOrderCopy(confirmationData);
            }
            catch (adminEmailError) {
                common_1.Logger.error(`❌ Failed to send admin copy: ${adminEmailError.message}`);
            }
            try {
                await this.notificationsService.sendOwnerOrderWhatsapp({
                    orderNumber: order.orderNumber,
                    buyerName: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim(),
                    phoneNumber: order.shippingAddress?.phoneNumber,
                    items: confirmationData.items,
                    totalAmount: order.totalAmount,
                    paymentLabel: `Paid online (${order.paymentInfo?.method || 'paystack'})`,
                    shippingAddress: order.shippingAddress,
                    buyerNote: order.buyerNote,
                });
            }
            catch (waError) {
                common_1.Logger.error(`❌ Failed owner WhatsApp alert: ${waError.message}`);
            }
            const sellerItemsMap = new Map();
            for (const item of order.items) {
                const sellerId = item.sellerId?.toString();
                if (!sellerId)
                    continue;
                if (!sellerItemsMap.has(sellerId)) {
                    sellerItemsMap.set(sellerId, { sellerId, items: [], payout: 0 });
                }
                const entry = sellerItemsMap.get(sellerId);
                entry.items.push(item);
                const commissionRate = item.commissionRate ?? 15;
                if (item.type === 'direct_purchase') {
                }
                else {
                    const fee = Math.round(item.totalPrice * (commissionRate / 100));
                    entry.payout += item.totalPrice - fee;
                }
            }
            for (const [sellerId, entry] of sellerItemsMap) {
                if (entry.payout <= 0)
                    continue;
                try {
                    const sellerUser = await this.orderModel.db
                        .collection('users')
                        .findOne({ _id: new mongoose_2.Types.ObjectId(sellerId) }, { projection: { firstName: 1, lastName: 1, email: 1 } });
                    if (sellerUser) {
                        await this.notificationsService.sendNewOrderAlert(sellerUser.email, {
                            sellerName: sellerUser.firstName,
                            orderNumber: order.orderNumber,
                            itemName: entry.items.length === 1
                                ? entry.items[0].itemName
                                : `${entry.items.length} items`,
                            quantity: entry.items.reduce((sum, i) => sum + i.quantity, 0),
                            sellerPayout: entry.payout,
                            buyerName: `${buyer.firstName} ${buyer.lastName}`,
                        });
                    }
                }
                catch (err) {
                    common_1.Logger.error(`Failed to send seller alert to ${sellerId}: ${err.message}`);
                }
            }
        }
        const itemsSummary = order.items.length === 1
            ? order.items[0].itemName
            : `${order.items.length} items`;
        this.alertsService
            .createAlert({
            userId: order.buyerId.toString(),
            type: contants_2.AlertType.OrderConfirmed,
            title: 'Order Confirmed! ✅',
            message: `Your order #${order.orderNumber} for ${itemsSummary} has been confirmed. We'll notify you when it's being processed.`,
            entityId: order._id,
            entityType: 'order',
            metadata: { orderNumber: order.orderNumber },
        })
            .catch(() => { });
        return updatedOrder;
    }
    async findByPaymentReference(reference) {
        const order = await this.orderModel
            .findOne({ 'paymentInfo.reference': reference })
            .exec();
        if (!order) {
            throw new common_1.NotFoundException('Order not found for this payment reference');
        }
        return order;
    }
    async findByIdInternal(orderId) {
        const order = await this.orderModel.findById(orderId).exec();
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async findById(orderId, userId) {
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
            throw new common_1.NotFoundException('Order not found');
        }
        const isBuyer = order.buyerId._id?.toString() === userId;
        const isSeller = order.sellerId?._id?.toString() === userId ||
            order.items.some((item) => item.sellerId?.toString() === userId);
        if (!isBuyer && !isSeller) {
            throw new common_1.ForbiddenException('You do not have access to this order');
        }
        return order;
    }
    async updateStatus(orderId, updateDto) {
        const order = await this.orderModel.findById(orderId).exec();
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const { status, paymentStatus, adminNote, cancellationReason, carrier, trackingNumber, estimatedDelivery, } = updateDto;
        if (!status && !paymentStatus) {
            throw new common_1.BadRequestException('Provide a status, a paymentStatus, or both.');
        }
        const wasUnpaid = order.paymentStatus !== contants_1.PaymentStatus.Success;
        if (paymentStatus && paymentStatus !== order.paymentStatus) {
            order.paymentStatus = paymentStatus;
            if (paymentStatus === contants_1.PaymentStatus.Success) {
                order.paymentInfo = {
                    ...order.paymentInfo,
                    method: order.paymentInfo?.method || 'pay_on_delivery',
                    status: 'success',
                    paidAt: new Date(),
                };
            }
        }
        if (!status) {
            if (adminNote)
                order.adminNote = adminNote;
            const savedOrder = await order.save();
            if (wasUnpaid &&
                savedOrder.paymentStatus === contants_1.PaymentStatus.Success) {
                await this.dispatchPaymentReceipt(savedOrder._id.toString()).catch((e) => common_1.Logger.error(`Receipt for ${savedOrder.orderNumber} failed: ${e.message}`));
            }
            return savedOrder;
        }
        const validTransitions = {
            [contants_1.OrderStatus.Pending]: [contants_1.OrderStatus.Confirmed, contants_1.OrderStatus.Cancelled],
            [contants_1.OrderStatus.Confirmed]: [contants_1.OrderStatus.Processing, contants_1.OrderStatus.Cancelled],
            [contants_1.OrderStatus.Processing]: [contants_1.OrderStatus.Shipped, contants_1.OrderStatus.Cancelled],
            [contants_1.OrderStatus.Shipped]: [contants_1.OrderStatus.Delivered],
            [contants_1.OrderStatus.Delivered]: [contants_1.OrderStatus.Completed],
            [contants_1.OrderStatus.Completed]: [],
            [contants_1.OrderStatus.Cancelled]: [],
            [contants_1.OrderStatus.Refunded]: [],
        };
        const allowed = validTransitions[order.status] || [];
        if (!allowed.includes(status)) {
            throw new common_1.BadRequestException(`Cannot transition from "${order.status}" to "${status}". ` +
                `Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`);
        }
        if (status === contants_1.OrderStatus.Cancelled && !cancellationReason) {
            throw new common_1.BadRequestException('Cancellation reason is required when cancelling an order');
        }
        if (status === contants_1.OrderStatus.Shipped) {
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
        if (status === contants_1.OrderStatus.Delivered) {
            order.trackingInfo = {
                ...order.trackingInfo,
                deliveredAt: new Date(),
            };
        }
        if (status === contants_1.OrderStatus.Completed) {
            if (order.paymentStatus !== contants_1.PaymentStatus.Success) {
                order.paymentStatus = contants_1.PaymentStatus.Success;
                order.paymentInfo = {
                    ...order.paymentInfo,
                    method: order.paymentInfo?.method || 'pay_on_delivery',
                    status: 'success',
                    paidAt: order.paymentInfo?.paidAt || new Date(),
                };
            }
            if (order.disbursementStatus === 'awaiting_completion') {
                order.disbursementStatus = 'awaiting_disbursement';
            }
        }
        if (status === contants_1.OrderStatus.Cancelled || status === contants_1.OrderStatus.Refunded) {
            order.disbursementStatus = 'not_applicable';
        }
        order.status = status;
        if (adminNote)
            order.adminNote = adminNote;
        if (cancellationReason)
            order.cancellationReason = cancellationReason;
        const savedOrder = await order.save();
        if (status === contants_1.OrderStatus.Cancelled ||
            status === contants_1.OrderStatus.Refunded) {
            await this.reverseOrderCredit(savedOrder, status === contants_1.OrderStatus.Refunded
                ? `Order ${savedOrder.orderNumber} refunded`
                : `Order ${savedOrder.orderNumber} cancelled`);
        }
        const populatedOrder = await this.orderModel
            .findById(order._id)
            .populate('buyerId', 'firstName email')
            .exec();
        if (populatedOrder) {
            const buyer = populatedOrder.buyerId;
            this.notificationsService.sendOrderStatusUpdate(buyer.email, {
                buyerName: buyer.firstName,
                orderNumber: order.orderNumber,
                status,
                trackingNumber: order.trackingInfo?.trackingNumber,
                carrier: order.trackingInfo?.carrier,
            });
        }
        if (wasUnpaid && savedOrder.paymentStatus === contants_1.PaymentStatus.Success) {
            await this.dispatchPaymentReceipt(savedOrder._id.toString()).catch((e) => common_1.Logger.error(`Receipt for ${savedOrder.orderNumber} failed: ${e.message}`));
        }
        const statusAlertMap = {
            [contants_1.OrderStatus.Processing]: {
                type: contants_2.AlertType.OrderProcessing,
                title: 'Order Being Processed 📦',
                message: `Your order #${order.orderNumber} is now being processed and prepared for shipping.`,
            },
            [contants_1.OrderStatus.Shipped]: {
                type: contants_2.AlertType.OrderShipped,
                title: 'Order Shipped! 🚚',
                message: `Your order #${order.orderNumber} has been shipped${order.trackingInfo?.carrier ? ` via ${order.trackingInfo.carrier}` : ''}.${order.trackingInfo?.trackingNumber ? ` Tracking: ${order.trackingInfo.trackingNumber}` : ''}`,
            },
            [contants_1.OrderStatus.Delivered]: {
                type: contants_2.AlertType.OrderDelivered,
                title: 'Order Delivered! 📬',
                message: `Your order #${order.orderNumber} has been delivered. Please confirm receipt to complete the order.`,
            },
            [contants_1.OrderStatus.Completed]: {
                type: contants_2.AlertType.OrderCompleted,
                title: 'Order Completed ✅',
                message: `Your order #${order.orderNumber} is now complete. Thank you for shopping on Kraft!`,
            },
            [contants_1.OrderStatus.Cancelled]: {
                type: contants_2.AlertType.OrderCancelled,
                title: 'Order Cancelled ❌',
                message: `Your order #${order.orderNumber} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
            },
        };
        const alertConfig = statusAlertMap[status];
        if (alertConfig) {
            this.alertsService
                .createAlertAndPush({
                userId: order.buyerId.toString(),
                ...alertConfig,
                entityId: order._id,
                entityType: 'order',
                metadata: { orderNumber: order.orderNumber, status },
                route: `/orders/${order._id.toString()}`,
            })
                .catch(() => { });
        }
        return savedOrder;
    }
    async markDisbursed(orderId) {
        const order = await this.orderModel.findById(orderId).exec();
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.disbursementStatus !== 'awaiting_disbursement') {
            throw new common_1.BadRequestException(`Cannot disburse an order with disbursement status "${order.disbursementStatus}". ` +
                `Only orders with status "awaiting_disbursement" can be disbursed.`);
        }
        order.disbursementStatus = 'disbursed';
        order.disbursedAt = new Date();
        return order.save();
    }
    async findBuyerOrders(buyerId, queryDto) {
        const { page, perPage, sort, search, status, paymentStatus, disbursementStatus, } = queryDto;
        const filter = {
            buyerId: new mongoose_2.Types.ObjectId(buyerId),
        };
        if (status)
            filter.status = status;
        if (paymentStatus)
            filter.paymentStatus = paymentStatus;
        if (disbursementStatus)
            filter.disbursementStatus = disbursementStatus;
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'items.itemName': { $regex: search, $options: 'i' } },
                { 'shippingInfo.trackingNumber': { $regex: search, $options: 'i' } },
                { 'paymentInfo.reference': { $regex: search, $options: 'i' } },
            ];
        }
        const sortObj = {};
        if (sort) {
            const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
            sortObj[sortField] = sort.startsWith('-') ? -1 : 1;
        }
        else {
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
    async findSellerOrders(sellerId, queryDto) {
        const { page, perPage, sort, search, status, paymentStatus, disbursementStatus, storeId, } = queryDto;
        const sellerOid = new mongoose_2.Types.ObjectId(sellerId);
        const filter = {
            $or: [{ sellerId: sellerOid }, { 'items.sellerId': sellerOid }],
        };
        if (status)
            filter.status = status;
        if (paymentStatus)
            filter.paymentStatus = paymentStatus;
        if (disbursementStatus)
            filter.disbursementStatus = disbursementStatus;
        if (storeId) {
            const storeOid = new mongoose_2.Types.ObjectId(storeId);
            filter.$and = [
                { $or: [{ storeId: storeOid }, { 'items.storeId': storeOid }] },
            ];
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
        const sortObj = {};
        if (sort) {
            const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
            sortObj[sortField] = sort.startsWith('-') ? -1 : 1;
        }
        else {
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
    async findAll(queryDto) {
        const { page, perPage, sort, search, status, paymentStatus, disbursementStatus, storeId, } = queryDto;
        const filter = {};
        if (status)
            filter.status = status;
        if (paymentStatus)
            filter.paymentStatus = paymentStatus;
        if (disbursementStatus)
            filter.disbursementStatus = disbursementStatus;
        if (storeId)
            filter.storeId = new mongoose_2.Types.ObjectId(storeId);
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'items.itemName': { $regex: search, $options: 'i' } },
                { 'shippingInfo.trackingNumber': { $regex: search, $options: 'i' } },
                { 'paymentInfo.reference': { $regex: search, $options: 'i' } },
            ];
        }
        const sortObj = {};
        if (sort) {
            const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
            sortObj[sortField] = sort.startsWith('-') ? -1 : 1;
        }
        else {
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
    async countOrders(filter = {}) {
        return this.orderModel.countDocuments(filter).exec();
    }
    async calculateRevenue(filter = {}) {
        const result = await this.orderModel.aggregate([
            {
                $match: {
                    ...filter,
                    paymentStatus: contants_1.PaymentStatus.Success,
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
        return (result[0] || { totalRevenue: 0, platformRevenue: 0, sellerPayouts: 0 });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        listings_service_1.ListingsService,
        stores_service_1.StoresService,
        creators_service_1.CreatorsService,
        notifications_service_1.NotificationsService,
        alerts_service_1.AlertsService,
        wallet_service_1.WalletService,
        platform_settings_service_1.PlatformSettingsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map