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
var CartService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cart_schema_1 = require("./schema/cart.schema");
const checkout_session_schema_1 = require("./schema/checkout-session.schema");
const listing_schema_1 = require("../listings/schemas/listing.schema");
const orders_service_1 = require("../orders/orders.service");
const payments_service_1 = require("../payments/payments.service");
let CartService = CartService_1 = class CartService {
    constructor(cartModel, checkoutSessionModel, listingModel, ordersService, paymentsService) {
        this.cartModel = cartModel;
        this.checkoutSessionModel = checkoutSessionModel;
        this.listingModel = listingModel;
        this.ordersService = ordersService;
        this.paymentsService = paymentsService;
        this.logger = new common_1.Logger(CartService_1.name);
    }
    async addToCart(userId, listingId, quantity = 1) {
        const listing = await this.listingModel.findById(listingId).lean();
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        const buyableTypes = ['consignment', 'direct_purchase', 'admin'];
        if (!buyableTypes.includes(listing.type)) {
            throw new common_1.BadRequestException('This listing is not available for direct purchase. Contact the seller via WhatsApp.');
        }
        if (listing.status !== 'live') {
            throw new common_1.BadRequestException('This listing is no longer available');
        }
        if (quantity > listing.quantity) {
            throw new common_1.BadRequestException(`Only ${listing.quantity} available in stock`);
        }
        const unitPrice = listing.discountPrice ||
            listing.adminPricing?.sellingPrice ||
            listing.askingPrice?.amount;
        const image = listing.media?.[0]?.url || null;
        let cart = await this.cartModel.findOne({
            userId: new mongoose_2.Types.ObjectId(userId),
        });
        if (!cart) {
            cart = await this.cartModel.create({
                userId: new mongoose_2.Types.ObjectId(userId),
                items: [],
            });
        }
        const existingIndex = cart.items.findIndex((item) => item.listingId.toString() === listingId);
        if (existingIndex > -1) {
            const newQty = cart.items[existingIndex].quantity + quantity;
            if (newQty > listing.quantity) {
                throw new common_1.BadRequestException(`Cannot add more. Only ${listing.quantity} available (${cart.items[existingIndex].quantity} already in cart)`);
            }
            cart.items[existingIndex].quantity = newQty;
        }
        else {
            cart.items.push({
                listingId: new mongoose_2.Types.ObjectId(listingId),
                storeId: listing.storeId,
                quantity,
                itemName: listing.itemName,
                unitPrice,
                currency: listing.askingPrice?.currency || 'NGN',
                image,
                type: listing.type,
                sellerId: listing.userId,
            });
        }
        await cart.save();
        return this.formatCart(cart);
    }
    async getCart(userId) {
        const cart = await this.cartModel
            .findOne({ userId: new mongoose_2.Types.ObjectId(userId) })
            .populate({
            path: 'items.listingId',
            select: 'itemName status type condition quantity media askingPrice adminPricing storeId creatorId userId',
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
    async updateQuantity(userId, listingId, quantity) {
        const cart = await this.cartModel.findOne({
            userId: new mongoose_2.Types.ObjectId(userId),
        });
        if (!cart) {
            throw new common_1.NotFoundException('Cart is empty');
        }
        const itemIndex = cart.items.findIndex((item) => item.listingId.toString() === listingId);
        if (itemIndex === -1) {
            throw new common_1.NotFoundException('Item not found in cart');
        }
        const listing = await this.listingModel.findById(listingId).lean();
        if (listing && quantity > listing.quantity) {
            throw new common_1.BadRequestException(`Only ${listing.quantity} available in stock`);
        }
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        return this.formatCart(cart);
    }
    async removeItem(userId, listingId) {
        const cart = await this.cartModel.findOne({
            userId: new mongoose_2.Types.ObjectId(userId),
        });
        if (!cart) {
            throw new common_1.NotFoundException('Cart is empty');
        }
        const initialLength = cart.items.length;
        cart.items = cart.items.filter((item) => item.listingId.toString() !== listingId);
        if (cart.items.length === initialLength) {
            throw new common_1.NotFoundException('Item not found in cart');
        }
        await cart.save();
        return this.formatCart(cart);
    }
    async clearCart(userId) {
        await this.cartModel.findOneAndUpdate({ userId: new mongoose_2.Types.ObjectId(userId) }, { $set: { items: [] } });
        return { message: 'Cart cleared', items: [], itemCount: 0, subtotal: 0 };
    }
    async validateCart(userId) {
        const cart = await this.cartModel.findOne({
            userId: new mongoose_2.Types.ObjectId(userId),
        });
        if (!cart || cart.items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        const listingIds = cart.items.map((item) => item.listingId);
        const listings = await this.listingModel
            .find({ _id: { $in: listingIds } })
            .lean();
        const listingMap = new Map(listings.map((l) => [l._id.toString(), l]));
        const validItems = [];
        const issues = [];
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
            const isBuyable = buyableTypes.includes(listing.type) && listing.status === 'live';
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
            const currentPrice = listing.discountPrice ||
                listing.adminPricing?.sellingPrice ||
                listing.askingPrice?.amount;
            if (currentPrice !== item.unitPrice) {
                priceChanged = true;
                item.unitPrice = currentPrice;
            }
            validItems.push(item);
        }
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
    async checkout(userId, email, shippingAddress, listingIds, buyerNote, callbackUrl, deliveryFee = 0, paymentMethod = 'paystack') {
        const cart = await this.cartModel
            .findOne({ userId: new mongoose_2.Types.ObjectId(userId) })
            .exec();
        if (!cart || !cart.items.length) {
            throw new common_1.BadRequestException('Your cart is empty');
        }
        const selectedItems = listingIds?.length
            ? cart.items.filter((item) => listingIds.includes(item.listingId.toString()))
            : cart.items;
        if (selectedItems.length === 0) {
            throw new common_1.BadRequestException('None of the selected items are in your cart');
        }
        const listingIdsToFetch = selectedItems.map((item) => item.listingId);
        const listings = await this.listingModel
            .find({ _id: { $in: listingIdsToFetch } })
            .lean();
        const listingMap = new Map(listings.map((l) => [l._id.toString(), l]));
        const validItems = [];
        const skippedItems = [];
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
            if (listing.userId?.toString() === userId) {
                skippedItems.push({
                    listingId: item.listingId,
                    itemName: item.itemName,
                    reason: 'You cannot purchase your own listing',
                });
                continue;
            }
            const currentPrice = listing.discountPrice ||
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
        if (validItems.length === 0) {
            throw new common_1.BadRequestException({
                message: 'None of the items in your cart are available for purchase.',
                skippedItems,
            });
        }
        const itemsTotal = validItems.reduce((sum, i) => sum + i.totalPrice, 0);
        const grandTotal = itemsTotal + deliveryFee;
        if (paymentMethod === 'pay_on_delivery') {
            const order = await this.ordersService.createPayOnDeliveryOrder(userId, validItems, shippingAddress, buyerNote, email, deliveryFee);
            await this.removeCheckedOutItems(userId, validItems.map((i) => i.listingId));
            this.logger.log(`Pay-on-delivery order created: ${order.orderNumber} ` +
                `(${validItems.length} items, total ${grandTotal})`);
            return {
                paymentMethod: 'pay_on_delivery',
                codOrder: true,
                order: {
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    totalAmount: order.totalAmount,
                    itemCount: order.items.length,
                },
                grandTotal,
                itemCount: validItems.length,
                skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
            };
        }
        const itemsSummary = validItems.map((i) => ({
            itemName: i.itemName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
        }));
        const payment = paymentMethod === 'opay'
            ? await this.paymentsService.initializeOPayCheckoutSessionPayment(grandTotal, email, itemsSummary, shippingAddress, callbackUrl)
            : await this.paymentsService.initializeCheckoutSessionPayment(grandTotal, email, itemsSummary, shippingAddress, callbackUrl);
        const session = await this.checkoutSessionModel.create({
            buyerId: new mongoose_2.Types.ObjectId(userId),
            email,
            items: validItems,
            shippingAddress,
            buyerNote,
            grandTotal,
            deliveryFee,
            currency: 'NGN',
            paymentMethod,
            paymentReference: payment.reference,
            status: 'pending',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });
        this.logger.log(`Checkout session created: ${session._id}, ` +
            `user ${userId}, ${validItems.length} items, ${skippedItems.length} skipped, ` +
            `total ${grandTotal}, ref ${payment.reference}`);
        return {
            sessionId: session._id,
            paymentMethod,
            payment: {
                authorizationUrl: payment.authorizationUrl,
                accessCode: payment.accessCode,
                reference: payment.reference,
                grandTotal,
            },
            itemCount: validItems.length,
            skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
        };
    }
    async fulfillCheckoutSession(sessionId, paymentReference, paystackReference) {
        const session = await this.checkoutSessionModel.findById(sessionId).exec();
        if (!session) {
            this.logger.error(`Checkout session not found: ${sessionId}`);
            throw new common_1.NotFoundException('Checkout session not found or expired');
        }
        if (session.status === 'completed') {
            this.logger.warn(`Checkout session already fulfilled: ${sessionId}`);
            return { alreadyFulfilled: true, orderIds: session.orderIds };
        }
        if (session.status !== 'pending') {
            this.logger.warn(`Checkout session in unexpected state: ${session.status}`);
            throw new common_1.BadRequestException(`Checkout session is ${session.status}`);
        }
        const order = await this.ordersService.createCartOrder(session.buyerId.toString(), session.items, session.shippingAddress, session.buyerNote, session.email, session.deliveryFee || 0);
        await this.ordersService.confirmPayment(order._id.toString(), paymentReference, paystackReference);
        const paidListingIds = session.items.map((i) => i.listingId);
        await this.removeCheckedOutItems(session.buyerId.toString(), paidListingIds);
        session.status = 'completed';
        session.orderIds = [order._id.toString()];
        session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await session.save();
        this.logger.log(`Checkout session fulfilled: ${sessionId}, ` +
            `1 order created (${session.items.length} items), ` +
            `${paidListingIds.length} items removed from cart`);
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
    async failCheckoutSession(paymentReference) {
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
    async findSessionByReference(paymentReference) {
        return this.checkoutSessionModel.findOne({ paymentReference }).exec();
    }
    async getItemCount(userId) {
        const cart = await this.cartModel
            .findOne({ userId: new mongoose_2.Types.ObjectId(userId) })
            .select('items')
            .lean();
        const count = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        return { count };
    }
    async clearCartInternal(userId) {
        await this.cartModel.findOneAndUpdate({ userId: new mongoose_2.Types.ObjectId(userId) }, { $set: { items: [] } });
    }
    async removeCheckedOutItems(userId, listingIds) {
        const listingOids = listingIds.map((id) => new mongoose_2.Types.ObjectId(id));
        await this.cartModel.findOneAndUpdate({ userId: new mongoose_2.Types.ObjectId(userId) }, { $pull: { items: { listingId: { $in: listingOids } } } });
    }
    formatCart(cart) {
        const items = (cart.items || []).map((item) => {
            const listing = item.listingId && item.listingId._id ? item.listingId : null;
            const buyableTypes = ['consignment', 'direct_purchase', 'admin'];
            const isAvailable = listing
                ? buyableTypes.includes(listing.type) && listing.status === 'live'
                : false;
            const livePrice = listing?.discountPrice ||
                listing?.adminPricing?.sellingPrice ||
                listing?.askingPrice?.amount;
            const priceChanged = livePrice && livePrice !== item.unitPrice;
            return {
                listingId: listing?._id || item.listingId,
                storeId: item.storeId?._id || item.storeId,
                quantity: item.quantity,
                currency: item.currency,
                snapshot: {
                    itemName: item.itemName,
                    unitPrice: item.unitPrice,
                    image: item.image,
                    type: item.type,
                },
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
                    }
                    : null,
                store: item.storeId?.name
                    ? {
                        _id: item.storeId._id,
                        name: item.storeId.name,
                        slug: item.storeId.slug,
                        logo: item.storeId.logo,
                    }
                    : undefined,
                isAvailable,
                isDeleted: !listing,
                priceChanged: priceChanged || false,
                itemName: listing?.itemName || item.itemName,
                unitPrice: livePrice || item.unitPrice,
                totalPrice: (livePrice || item.unitPrice) * item.quantity,
            };
        });
        const validItems = items.filter((i) => i.isAvailable);
        const subtotal = validItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        return {
            items,
            itemCount,
            subtotal,
            currency: 'NGN',
            hasIssues: validItems.length < items.length,
        };
    }
};
exports.CartService = CartService;
exports.CartService = CartService = CartService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(cart_schema_1.Cart.name)),
    __param(1, (0, mongoose_1.InjectModel)(checkout_session_schema_1.CheckoutSession.name)),
    __param(2, (0, mongoose_1.InjectModel)(listing_schema_1.Listing.name)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => payments_service_1.PaymentsService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        orders_service_1.OrdersService,
        payments_service_1.PaymentsService])
], CartService);
//# sourceMappingURL=cart.service.js.map