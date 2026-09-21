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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const cart_service_1 = require("./cart.service");
const cart_dto_1 = require("./dto/cart.dto");
let CartController = class CartController {
    constructor(cartService) {
        this.cartService = cartService;
    }
    async addToCart(req, dto) {
        return this.cartService.addToCart(req.user.sub, dto.listingId, dto.quantity);
    }
    async getCart(req) {
        return this.cartService.getCart(req.user.sub);
    }
    async getItemCount(req) {
        return this.cartService.getItemCount(req.user.sub);
    }
    async updateQuantity(req, listingId, dto) {
        return this.cartService.updateQuantity(req.user.sub, listingId, dto.quantity);
    }
    async removeItem(req, listingId) {
        return this.cartService.removeItem(req.user.sub, listingId);
    }
    async clearCart(req) {
        return this.cartService.clearCart(req.user.sub);
    }
    async validateCart(req) {
        return this.cartService.validateCart(req.user.sub);
    }
    async checkout(req, dto) {
        return this.cartService.checkout(req.user.sub, dto.email || req.user.email, dto.shippingAddress, dto.listingIds, dto.buyerNote, dto.callbackUrl, dto.deliveryFee, dto.paymentMethod, dto.applyWalletCredit, dto.walletCreditAmount, dto.affiliateCodes);
    }
};
exports.CartController = CartController;
__decorate([
    (0, common_1.Post)('add'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a listing to cart' }),
    (0, response_message_decorator_1.ResponseMessage)('Item added to cart'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cart_dto_1.AddToCartDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "addToCart", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get my cart with items and totals' }),
    (0, response_message_decorator_1.ResponseMessage)('Success'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getCart", null);
__decorate([
    (0, common_1.Get)('count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cart item count (for header badge)' }),
    (0, response_message_decorator_1.ResponseMessage)('Success'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getItemCount", null);
__decorate([
    (0, common_1.Patch)('items/:listingId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update quantity of a cart item' }),
    (0, response_message_decorator_1.ResponseMessage)('Cart updated'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('listingId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, cart_dto_1.UpdateCartItemDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "updateQuantity", null);
__decorate([
    (0, common_1.Delete)('items/:listingId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove an item from cart' }),
    (0, response_message_decorator_1.ResponseMessage)('Item removed from cart'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('listingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: 'Clear entire cart' }),
    (0, response_message_decorator_1.ResponseMessage)('Cart cleared'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "clearCart", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Validate cart before checkout',
        description: 'Checks all items are still available, in stock, and at the correct price. Call this before checkout.',
    }),
    (0, response_message_decorator_1.ResponseMessage)('Success'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "validateCart", null);
__decorate([
    (0, common_1.Post)('checkout'),
    (0, swagger_1.ApiOperation)({
        summary: 'Checkout cart',
        description: 'Validates all cart items, creates one order per store, initializes ' +
            'a single Paystack payment for the grand total, and clears the cart. ' +
            'Returns the Paystack payment URL to redirect the user to.',
    }),
    (0, response_message_decorator_1.ResponseMessage)('Checkout initiated'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cart_dto_1.CheckoutCartDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "checkout", null);
exports.CartController = CartController = __decorate([
    (0, swagger_1.ApiTags)('Cart'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('cart'),
    __metadata("design:paramtypes", [cart_service_1.CartService])
], CartController);
//# sourceMappingURL=cart.controller.js.map