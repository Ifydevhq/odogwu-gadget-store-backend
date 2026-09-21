/**
 * cart/cart.controller.ts - Shopping Cart Routes
 * ================================================
 * All routes require authentication.
 *
 * POST   /cart/add                Add a listing to cart
 * GET    /cart                    Get my cart
 * GET    /cart/count              Get cart item count (for badge)
 * PATCH  /cart/items/:listingId   Update item quantity
 * DELETE /cart/items/:listingId   Remove item from cart
 * DELETE /cart                    Clear entire cart
 * POST   /cart/validate           Validate cart before checkout
 * POST   /cart/checkout           Checkout cart → create orders + pay
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { CartService } from './cart.service';
import {
  AddToCartDto,
  UpdateCartItemDto,
  CheckoutCartDto,
} from './dto/cart.dto';

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ─── Add to Cart ─────────────────────────────────────────────────

  @Post('add')
  @ApiOperation({ summary: 'Add a listing to cart' })
  @ResponseMessage('Item added to cart')
  async addToCart(@Req() req: any, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(
      req.user.sub,
      dto.listingId,
      dto.quantity,
    );
  }

  // ─── Get Cart ────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get my cart with items and totals' })
  @ResponseMessage('Success')
  async getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.sub);
  }

  // ─── Get Cart Item Count ─────────────────────────────────────────

  @Get('count')
  @ApiOperation({ summary: 'Get cart item count (for header badge)' })
  @ResponseMessage('Success')
  async getItemCount(@Req() req: any) {
    return this.cartService.getItemCount(req.user.sub);
  }

  // ─── Update Item Quantity ────────────────────────────────────────

  @Patch('items/:listingId')
  @ApiOperation({ summary: 'Update quantity of a cart item' })
  @ResponseMessage('Cart updated')
  async updateQuantity(
    @Req() req: any,
    @Param('listingId') listingId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateQuantity(
      req.user.sub,
      listingId,
      dto.quantity,
    );
  }

  // ─── Remove Item ─────────────────────────────────────────────────

  @Delete('items/:listingId')
  @ApiOperation({ summary: 'Remove an item from cart' })
  @ResponseMessage('Item removed from cart')
  async removeItem(@Req() req: any, @Param('listingId') listingId: string) {
    return this.cartService.removeItem(req.user.sub, listingId);
  }

  // ─── Clear Cart ──────────────────────────────────────────────────

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  @ResponseMessage('Cart cleared')
  async clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user.sub);
  }

  // ─── Validate Cart ───────────────────────────────────────────────

  @Post('validate')
  @ApiOperation({
    summary: 'Validate cart before checkout',
    description:
      'Checks all items are still available, in stock, and at the correct price. Call this before checkout.',
  })
  @ResponseMessage('Success')
  async validateCart(@Req() req: any) {
    return this.cartService.validateCart(req.user.sub);
  }

  // ─── Checkout ─────────────────────────────────────────────────────

  @Post('checkout')
  @ApiOperation({
    summary: 'Checkout cart',
    description:
      'Validates all cart items, creates one order per store, initializes ' +
      'a single Paystack payment for the grand total, and clears the cart. ' +
      'Returns the Paystack payment URL to redirect the user to.',
  })
  @ResponseMessage('Checkout initiated')
  async checkout(@Req() req: any, @Body() dto: CheckoutCartDto) {
    return this.cartService.checkout(
      req.user.sub,
      dto.email || req.user.email,
      dto.shippingAddress,
      dto.listingIds,
      dto.buyerNote,
      dto.callbackUrl,
      dto.deliveryFee,
      dto.paymentMethod,
      dto.applyWalletCredit,
      dto.walletCreditAmount,
      dto.affiliateCodes,
    );
  }
}