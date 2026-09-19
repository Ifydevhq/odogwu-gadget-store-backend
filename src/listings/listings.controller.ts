/**
 * listings/listings.controller.ts - Listing Endpoints
 * ======================================================
 * The biggest controller — handles seller operations, admin review,
 * and public marketplace browsing.
 *
 * PROTECTED (seller):
 *   POST   /listings              → Create a new listing
 *   GET    /listings/mine         → My listings (all stores)
 *   PATCH  /listings/:id          → Edit my listing
 *   DELETE /listings/:id          → Delete my listing
 *
 * PROTECTED (admin):
 *   GET    /listings/admin/pending → Listings awaiting review
 *   PATCH  /listings/admin/:id/review → Approve/reject a listing
 *
 * PUBLIC:
 *   GET    /listings              → Marketplace feed
 *   GET    /listings/:id          → Single listing details
 *   GET    /listings/store/:storeId      → Listings in a store
 *   GET    /listings/creator/:creatorId  → All listings by a creator
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

import { ListingsService } from './listings.service';
import {
  CreateListingDto,
  UpdateListingDto,
  AdminReviewListingDto,
  QueryListingsDto,
} from './dto/listing.dto';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { GetUser, JwtPayload } from '@common/decorators/get-user.decorator';
import { UserRole } from '@config/contants';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // ═══════════════════════════════════════════════════════════
  // PROTECTED: SELLER ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  // ─── POST /api/v1/listings ──────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Listing created and submitted for review')
  @ApiOperation({
    summary: 'Create a new listing',
    description:
      'Creates a product listing under a specific store. ' +
      'Choose the selling type: self_listing, consignment, or direct_purchase. ' +
      'All listings start as pending_approval and require admin review.',
  })
  @ApiResponse({ status: 201, description: 'Listing created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Not the store owner' })
  async create(
    @GetUser() user: JwtPayload,
    @Body() createListingDto: CreateListingDto,
  ) {
    return this.listingsService.create(user.sub, createListingDto, user.role);
  }

  // ─── GET /api/v1/listings/mine ──────────────────────────

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get my listings',
    description:
      'Returns all listings by the authenticated user across all their stores. ' +
      'Can filter by status, type, and store.',
  })
  @ApiResponse({
    status: 200,
    description: "Paginated list of user's listings",
  })
  async findMyListings(
    @GetUser() user: JwtPayload,
    @Query() queryDto: QueryListingsDto,
  ) {
    return this.listingsService.findMyListings(user.sub, queryDto);
  }

  // ─── PATCH /api/v1/listings/:id ─────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Listing updated successfully')
  @ApiOperation({
    summary: 'Update my listing',
    description:
      'Edit a listing. Only works for draft, pending, or rejected listings. ' +
      'If the listing was rejected, editing resubmits it for review.',
  })
  @ApiParam({ name: 'id', description: 'Listing MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Listing updated' })
  @ApiResponse({ status: 400, description: 'Cannot edit live/sold listings' })
  @ApiResponse({ status: 403, description: 'Not the listing owner' })
  async update(
    @Param('id') listingId: string,
    @GetUser() user: JwtPayload,
    @Body() updateListingDto: UpdateListingDto,
  ) {
    return this.listingsService.update(
      listingId,
      user.sub,
      updateListingDto,
      user.role,
    );
  }

  // ─── DELETE /api/v1/listings/:id ────────────────────────

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Listing deleted successfully')
  @ApiOperation({
    summary: 'Delete my listing',
    description: 'Soft deletes a listing. Cannot delete sold listings.',
  })
  @ApiParam({ name: 'id', description: 'Listing MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Listing deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete sold listings' })
  async remove(@Param('id') listingId: string, @GetUser() user: JwtPayload) {
    return this.listingsService.remove(listingId, user.sub);
  }

  // ─── POST /api/v1/listings/:id/counter-offer ────────────

  @Post(':id/counter-offer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Counter-offer submitted')
  @ApiOperation({
    summary: 'Submit counter-offer (direct purchase)',
    description:
      'When the platform has made a price offer on your direct-purchase listing, ' +
      'you can submit a counter-offer.',
  })
  @ApiParam({ name: 'id', description: 'Listing MongoDB ID' })
  async counterOffer(
    @Param('id') listingId: string,
    @GetUser() user: JwtPayload,
    @Body('counterOffer') counterOffer: number,
  ) {
    return this.listingsService.sellerCounterOffer(
      listingId,
      user.sub,
      counterOffer,
    );
  }

  // ─── POST /api/v1/listings/:id/accept-offer ─────────────

  @Post(':id/accept-offer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Offer accepted')
  @ApiOperation({
    summary: 'Accept platform offer (direct purchase)',
    description: "Accept the platform's bid for your direct-purchase listing.",
  })
  @ApiParam({ name: 'id', description: 'Listing MongoDB ID' })
  async acceptOffer(
    @Param('id') listingId: string,
    @GetUser() user: JwtPayload,
  ) {
    return this.listingsService.sellerAcceptOffer(listingId, user.sub);
  }

  // ─── POST /api/v1/listings/:id/reject-offer ─────────────

  @Post(':id/reject-offer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Offer rejected')
  @ApiOperation({
    summary: 'Reject platform offer (direct purchase)',
    description: "Reject the platform's bid outright.",
  })
  @ApiParam({ name: 'id', description: 'Listing MongoDB ID' })
  async rejectOffer(
    @Param('id') listingId: string,
    @GetUser() user: JwtPayload,
  ) {
    return this.listingsService.sellerRejectOffer(listingId, user.sub);
  }

  // ─── POST /api/v1/listings/:id/delist ────────────────────

  @Post(':id/delist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Listing delisted')
  @ApiOperation({
    summary: 'Delist my listing',
    description: 'Voluntarily remove your live listing from the marketplace.',
  })
  @ApiParam({ name: 'id', description: 'Listing MongoDB ID' })
  async sellerDelist(
    @Param('id') listingId: string,
    @GetUser() user: JwtPayload,
  ) {
    return this.listingsService.sellerDelist(listingId, user.sub);
  }

  // ═══════════════════════════════════════════════════════════
  // PROTECTED: ADMIN ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  // ─── GET /api/v1/listings/admin/all ──────────────────────

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[Admin] List all listings',
    description:
      'Returns all listings regardless of status. Supports filtering ' +
      'by status, type, condition, category, and text search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of all listings',
  })
  async findAllAdmin(@Query() queryDto: QueryListingsDto) {
    return this.listingsService.findAllAdmin(queryDto);
  }

  // ─── GET /api/v1/listings/admin/pending ──────────────────

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[Admin] Get pending listings',
    description: 'Returns all listings waiting for admin review',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of pending listings',
  })
  async findPending(@Query() queryDto: QueryListingsDto) {
    return this.listingsService.findPending(queryDto);
  }

  // ─── PATCH /api/v1/listings/admin/:id/review ─────────────

  @Patch('admin/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Listing review action completed')
  @ApiOperation({
    summary: '[Admin] Review a listing',
    description:
      'Full lifecycle management. Actions: approve, reject, suspend, reinstate, delist, ' +
      'make_offer (direct purchase bid), accept_counter, reject_counter, ' +
      'mark_awaiting_fee, mark_awaiting_product, mark_live.',
  })
  @ApiParam({ name: 'id', description: 'Listing MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Review action completed' })
  @ApiResponse({
    status: 400,
    description: 'Invalid action or missing required fields',
  })
  async adminReview(
    @Param('id') listingId: string,
    @GetUser() user: JwtPayload,
    @Body() reviewDto: AdminReviewListingDto,
  ) {
    return this.listingsService.adminReview(listingId, user.sub, reviewDto);
  }

  // ─── POST /api/v1/listings/admin/:id/confirm-fee ─────────

  @Post('admin/:id/confirm-fee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Listing fee confirmed — item is now live')
  @ApiOperation({
    summary: '[Admin] Confirm listing fee payment',
    description:
      'Marks the listing fee as paid for a self-listing item. ' +
      'Moves the listing from awaiting_fee to live.',
  })
  @ApiParam({ name: 'id', description: 'Listing MongoDB ID' })
  async confirmFee(
    @Param('id') listingId: string,
    @GetUser() user: JwtPayload,
  ) {
    return this.listingsService.confirmFeePaid(listingId, user.sub);
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  // ─── GET /api/v1/listings ───────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'Browse marketplace listings',
    description:
      'The main marketplace feed. Only shows live listings. ' +
      'Supports filtering by type, category, condition, price range, ' +
      'and a buyableOnly flag for items that can be purchased on platform.',
  })
  @ApiResponse({ status: 200, description: 'Paginated marketplace feed' })
  async findAll(@Query() queryDto: QueryListingsDto) {
    return this.listingsService.findAll(queryDto);
  }

  // ─── GET /api/v1/listings/store/:storeId ────────────────

  @Get('store/:storeId')
  @ApiOperation({
    summary: 'Get listings by store',
    description: 'Returns all live listings in a specific store',
  })
  @ApiParam({ name: 'storeId', description: 'Store MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Paginated store listings' })
  async findByStore(
    @Param('storeId') storeId: string,
    @Query() queryDto: QueryListingsDto,
  ) {
    return this.listingsService.findByStore(storeId, queryDto);
  }

  // ─── GET /api/v1/listings/creator/:creatorId ────────────

  @Get('creator/:creatorId')
  @ApiOperation({
    summary: 'Get listings by creator',
    description:
      'Returns all live listings by a creator across ALL their stores. ' +
      "This is the aggregated view shown on the creator's profile page.",
  })
  @ApiParam({ name: 'creatorId', description: 'Creator MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Paginated creator listings' })
  async findByCreator(
    @Param('creatorId') creatorId: string,
    @Query() queryDto: QueryListingsDto,
  ) {
    return this.listingsService.findByCreator(creatorId, queryDto);
  }

  // ─── GET /api/v1/listings/:id ───────────────────────────
  // MUST come last (dynamic param would match "mine", "admin", etc.)

  @Get(':id')
  @ApiOperation({
    summary: 'Get listing details',
    description:
      'Returns full listing details including store and creator info. ' +
      'Also increments the view counter.',
  })
  @ApiParam({ name: 'id', description: 'Listing MongoDB ID' })
  @ApiResponse({
    status: 200,
    description: 'Listing details with isBuyable computed field',
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async findOne(@Param('id') listingId: string) {
    return this.listingsService.findById(listingId);
  }
}