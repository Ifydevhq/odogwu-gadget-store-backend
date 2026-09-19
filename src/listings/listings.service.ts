/**
 * listings/listings.service.ts - Listing Business Logic
 * ========================================================
 * The most important service in Comaket. Handles:
 * - Creating listings (sellers posting items)
 * - Admin reviewing (approve/reject with pricing)
 * - Marketplace queries (browsing, filtering, searching)
 * - Ownership verification
 * - Stats updates on stores and creators
 *
 * LISTING LIFECYCLE:
 *
 *   Seller creates listing → status: PENDING_APPROVAL
 *     ↓
 *   Admin reviews:
 *     → Approve: status becomes LIVE (visible on marketplace)
 *       - For consignment: admin sets sellingPrice + commissionRate
 *       - For direct purchase: admin sets purchasePrice + sellingPrice
 *       - For self-listing: just approve (no pricing needed)
 *     → Reject: status becomes REJECTED (seller can edit and resubmit)
 *     ↓
 *   Live listing can be:
 *     → Sold (when someone buys it, handled by OrdersModule later)
 *     → Suspended (admin takes it down)
 *     → Expired (TTL index auto-removes after expiry date)
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Listing, ListingDocument } from './schemas/listing.schema';
import { StoresService } from '../stores/stores.service';
import { CreatorsService } from '../creators/creators.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import {
  CreateListingDto,
  UpdateListingDto,
  AdminReviewListingDto,
  QueryListingsDto,
} from './dto/listing.dto';
import { ListingType, ListingStatus, UserRole } from '@config/contants';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { AlertsService } from '../alerts/alerts.service';
import { AlertType } from '@config/contants';

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
    private storesService: StoresService,
    private creatorsService: CreatorsService,
    private notificationsService: NotificationsService,
    private platformSettingsService: PlatformSettingsService,
    private alertsService: AlertsService,
  ) {}

  // ─── Fee / Commission Helpers ─────────────────────────────
  // These now read from the DB-backed PlatformSettings (admin-managed)
  // instead of the static .env config.

  /**
   * Returns true if self-listing fees are waived.
   */
  private async isFreeListing(): Promise<boolean> {
    return this.platformSettingsService.isFreeListing();
  }

  /**
   * Returns true if consignment commission is disabled.
   */
  private async isNoCommission(): Promise<boolean> {
    return this.platformSettingsService.isNoCommission();
  }

  /**
   * Calculate the self-listing fee in kobo.
   * Returns 0 if freeListing is enabled.
   * Caps at listingFeeCapKobo if set.
   */
  private async calculateListingFee(askingPriceKobo: number): Promise<number> {
    const freeListing = await this.isFreeListing();
    if (freeListing) return 0;

    const settings = await this.platformSettingsService.getSettings();
    const percent = settings.selfListingFeePercent;
    const cap = settings.listingFeeCapKobo;
    const fee = Math.round((askingPriceKobo * percent) / 100);

    return cap > 0 ? Math.min(fee, cap) : fee;
  }

  /**
   * Get the consignment commission rate.
   * Returns 0 if noCommission is enabled.
   */
  private async getConsignmentCommissionRate(): Promise<number> {
    const noCommission = await this.isNoCommission();
    if (noCommission) return 0;
    return this.platformSettingsService.getConsignmentCommissionPercent();
  }

  // ─── Helpers ─────────────────────────────────────────────

  /**
   * Verify that a listing belongs to the given user.
   */
  private async verifyOwnership(
    listingId: string,
    userId: string,
  ): Promise<ListingDocument> {
    const listing = await this.listingModel.findById(listingId).exec();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId.toString() !== userId) {
      throw new ForbiddenException('You do not own this listing');
    }

    return listing;
  }

  // ─── Create Listing ──────────────────────────────────────

  /**
   * POST /listings
   *
   * Flow:
   * 1. Verify the store exists and belongs to this user
   * 2. Get the creator profile (for creatorId + stats)
   * 3. Validate based on listing type
   * 4. Create the listing with status PENDING_APPROVAL
   * 5. Update store + creator totalListings stats
   *
   * All new listings start as PENDING_APPROVAL regardless of type.
   * An admin must review and approve before it goes live.
   */
  async create(
    userId: string,
    createListingDto: CreateListingDto,
    creatorRole?: string,
  ): Promise<ListingDocument> {
    const { storeId, type, whatsappNumber, formerPrice } = createListingDto;

    // The store owner (super-admin) and admins skip the review queue — their
    // listings go straight live. Everyone else starts in review.
    const skipReview =
      creatorRole === UserRole.SuperAdmin || creatorRole === UserRole.Admin;

    // Optional former price: struck through on the marketplace, with the
    // discount percent auto-calculated from the asking (selling) price.
    const sellingAmount = createListingDto.askingPrice?.amount ?? 0;
    let formerPriceKobo: number | undefined;
    let discountPercent: number | undefined;
    if (formerPrice && sellingAmount > 0 && formerPrice > sellingAmount) {
      formerPriceKobo = formerPrice;
      discountPercent = Math.round(
        ((formerPrice - sellingAmount) / formerPrice) * 100,
      );
    }

    let store: any = null;

    // If storeId provided, verify ownership
    if (storeId) {
      store = await this.storesService.findById(storeId);
      const storeOwnerId =
        store.userId?._id?.toString() || store.userId?.toString();
      if (storeOwnerId !== userId) {
        throw new ForbiddenException('You do not own this store');
      }
    }

    // Get creator profile
    const creator = await this.creatorsService.findByUserId(userId);

    // Type-specific validation
    if (type === ListingType.SelfListing && !whatsappNumber) {
      throw new BadRequestException(
        'WhatsApp number is required for self-listed items. ' +
          'Buyers will use this to contact you.',
      );
    }

    // Validate media
    if (!createListingDto.media || createListingDto.media.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (createListingDto.media.length > 10) {
      throw new BadRequestException('Maximum 10 media items allowed');
    }

    // Pre-calculate fee for self-listing (async — reads from DB settings)
    let selfListingFeeData = {};
    if (type === ListingType.SelfListing) {
      const freeListing = await this.isFreeListing();
      const fee = await this.calculateListingFee(
        createListingDto.askingPrice.amount,
      );
      selfListingFeeData = {
        listingFee: fee,
        feePaidAmount: 0,
        listingFeeStatus: freeListing ? 'waived' : 'pending',
        isExpectingFee: !freeListing && fee > 0,
      };
    }

    // Create the listing
    const listing = new this.listingModel({
      ...createListingDto,
      storeId: storeId ? new Types.ObjectId(storeId) : null,
      creatorId: creator._id,
      userId: new Types.ObjectId(userId),
      // Fall back to store/creator WhatsApp if not provided
      whatsappNumber:
        whatsappNumber || store?.whatsappNumber || creator.whatsappNumber,
      ...selfListingFeeData,
      // Overrides — must come last so they win over the spreads above.
      status: skipReview ? ListingStatus.Live : ListingStatus.InReview,
      formerPrice: formerPriceKobo,
      discountPercent: discountPercent,
      // Owner/admin listings bypass the listing fee along with the review.
      ...(skipReview
        ? { listingFeeStatus: 'waived', isExpectingFee: false }
        : {}),
    });

    const savedListing = await listing.save();

    // Update stats
    if (storeId) {
      await this.storesService.updateStats(storeId, 'totalListings', 1);
    }
    await this.creatorsService.updateStats(
      creator._id.toString(),
      'totalListings',
      1,
    );

    return savedListing;
  }

  // ─── Get Single Listing ──────────────────────────────────

  /**
   * Get a listing by ID with full population.
   * Returns store, creator, and user info.
   */
  async findById(listingId: string): Promise<ListingDocument> {
    const listing = await this.listingModel
      .findById(listingId)
      .populate({
        path: 'storeId',
        select:
          'name slug logo description phoneNumber whatsappNumber address category tags status isVerified isSuperVerified',
      })
      .populate({
        path: 'creatorId',
        select:
          'username slug profileImageUrl bio isVerified phoneNumber whatsappNumber website location industries socialLinks plan rating totalReviews totalFollowers',
      })
      .populate('userId', 'firstName lastName avatar email')
      .exec();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Increment view count (fire and forget — don't await)
    this.listingModel
      .findByIdAndUpdate(listingId, { $inc: { views: 1 } })
      .exec();

    return listing;
  }

  // ─── Update Listing ──────────────────────────────────────

  /**
   * Update a listing. Owner can update in most statuses.
   *
   * FEE RECALCULATION LOGIC (self_listing only):
   *
   *   LISTING IS IN_REVIEW / DRAFT (never been live):
   *     → Fee is simply recalculated based on the new price.
   *       No prior payments to account for.
   *
   *   LISTING IS LIVE:
   *     → Status reverts to in_review, wasLive = true.
   *     → Fee is recalculated based on new price.
   *     → If price INCREASED: pending fee = newFee - feePaidAmount
   *       (only pay the difference)
   *     → If price DECREASED: feePaidAmount already covers it,
   *       listingFeeStatus stays 'paid' (no extra fee).
   *
   *   Admin sees wasLive = true and knows this is a re-review,
   *   not a brand new listing.
   */
  async update(
    listingId: string,
    userId: string,
    updateListingDto: UpdateListingDto,
    editorRole?: string,
  ): Promise<ListingDocument> {
    const listing = await this.verifyOwnership(listingId, userId);

    // Owner (super-admin) / admin edits stay live and never bounce to review.
    const skipReview =
      editorRole === UserRole.SuperAdmin || editorRole === UserRole.Admin;

    const editableStatuses = [
      ListingStatus.Draft,
      ListingStatus.InReview,
      ListingStatus.Rejected,
      ListingStatus.AwaitingFee,
      ListingStatus.PriceOffered,
      ListingStatus.CounterOffer,
      ListingStatus.Live, // ← Now editable
    ];

    if (!editableStatuses.includes(listing.status)) {
      throw new BadRequestException(
        `Cannot edit a listing with status "${listing.status}".`,
      );
    }

    const isCurrentlyLive = listing.status === ListingStatus.Live;
    const priceChanged =
      updateListingDto.askingPrice?.amount !== undefined &&
      updateListingDto.askingPrice.amount !== listing.askingPrice?.amount;

    // ─── Live listing being edited → back to review ─────────
    // (Owner/admin edits skip review and stay live.)
    if (isCurrentlyLive && !skipReview) {
      listing.status = ListingStatus.InReview;
      listing.wasLive = true;
      listing.reviewInfo = null; // Clear old review info
    }

    // If rejected and being resubmitted, reset to in_review
    if (listing.status === ListingStatus.Rejected) {
      listing.status = ListingStatus.InReview;
      listing.reviewInfo = null;
    }

    // Apply the update
    Object.assign(listing, updateListingDto);

    // ─── Former price / auto discount ───────────────────────
    // Recompute the struck-through former price and discount percent from the
    // (possibly updated) asking/selling price. Clear them when the former price
    // is removed or no longer higher than the selling price.
    const sellingAmount = listing.askingPrice?.amount ?? 0;
    const nextFormer =
      updateListingDto.formerPrice !== undefined
        ? updateListingDto.formerPrice
        : listing.formerPrice;
    if (nextFormer && sellingAmount > 0 && nextFormer > sellingAmount) {
      listing.formerPrice = nextFormer;
      listing.discountPercent = Math.round(
        ((nextFormer - sellingAmount) / nextFormer) * 100,
      );
    } else {
      listing.set('formerPrice', undefined);
      listing.set('discountPercent', undefined);
    }

    // ─── Fee recalculation (self_listing only) ──────────────
    if (listing.type === ListingType.SelfListing && priceChanged) {
      const freeListing = await this.isFreeListing();
      const newFee = await this.calculateListingFee(listing.askingPrice.amount);
      listing.listingFee = newFee;
      listing.isExpectingFee = !freeListing && newFee > 0;

      if (!listing.isExpectingFee) {
        listing.listingFeeStatus = 'waived';
      } else if (listing.feePaidAmount >= newFee) {
        // Already paid enough (price decreased or stayed same)
        listing.listingFeeStatus = 'paid';
      } else {
        // Price increased — they owe the difference
        listing.listingFeeStatus = 'pending';
      }
    }

    return listing.save();
  }

  // ─── Delete Listing ──────────────────────────────────────

  /**
   * Soft delete a listing. Sets isDeleted = true.
   * Only owner can delete, and only if not already sold.
   */
  async remove(
    listingId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const listing = await this.verifyOwnership(listingId, userId);

    if (listing.status === ListingStatus.Sold) {
      throw new BadRequestException('Cannot delete a sold listing');
    }

    listing.isDeleted = true;
    listing.deletedAt = new Date();
    listing.status = ListingStatus.Delisted;
    await listing.save();

    // Decrement stats
    if (listing.storeId) {
      await this.storesService.updateStats(
        listing.storeId.toString(),
        'totalListings',
        -1,
      );
    }
    await this.creatorsService.updateStats(
      listing.creatorId.toString(),
      'totalListings',
      -1,
    );

    return { message: 'Listing deleted successfully' };
  }

  // ─── Admin Review ────────────────────────────────────────

  /**
   * Admin reviews a listing — full lifecycle management.
   *
   * ACTIONS:
   *   approve        → Move to next status based on type
   *   reject         → Rejected (requires reason)
   *   suspend        → Suspend a live listing
   *   reinstate      → Re-live a suspended listing
   *   delist         → Remove from marketplace (seller-requested or admin)
   *   make_offer     → Direct purchase: platform makes a bid
   *   accept_counter → Direct purchase: accept seller's counter-offer
   *   reject_counter → Direct purchase: reject seller's counter-offer
   *   mark_awaiting_fee     → Self-listing: approved, waiting for fee payment
   *   mark_awaiting_product → Consignment/Direct: waiting for physical product
   *   mark_live      → Manually push to live (after fee paid or product received)
   *   mark_received  → Direct purchase: product received by platform → sold_to_platform
   */
  async adminReview(
    listingId: string,
    adminId: string,
    reviewDto: AdminReviewListingDto,
  ): Promise<ListingDocument> {
    const listing = await this.listingModel.findById(listingId).exec();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const {
      action,
      rejectionReason,
      adminNotes,
      sellingPrice,
      purchasePrice,
      commissionRate,
      platformBid,
    } = reviewDto;

    switch (action) {
      // ─── APPROVE ─────────────────────────────────────────
      case 'approve': {
        if (
          listing.status !== ListingStatus.InReview &&
          listing.status !== ListingStatus.Draft
        ) {
          throw new BadRequestException(
            `Cannot approve a listing with status "${listing.status}"`,
          );
        }

        // Type-specific flow after approval
        if (listing.type === ListingType.SelfListing) {
          // Recalculate fee based on current DB settings
          const freeListing = await this.isFreeListing();
          const computedFee = await this.calculateListingFee(
            listing.askingPrice.amount,
          );
          listing.listingFee = computedFee;
          listing.isExpectingFee = !freeListing && computedFee > 0;

          if (!listing.isExpectingFee) {
            // freeListing enabled or fee is 0 → go straight to live
            listing.listingFeeStatus = 'waived';
            listing.status = ListingStatus.Live;
          } else if (listing.wasLive) {
            // Was previously live? Check if fee is already covered
            if (
              listing.listingFeeStatus === 'paid' ||
              listing.listingFeeStatus === 'waived' ||
              listing.feePaidAmount >= listing.listingFee
            ) {
              // Fee already covered → go straight to live
              listing.listingFeeStatus = 'paid';
              listing.status = ListingStatus.Live;
              listing.wasLive = false;
            } else {
              // Price was increased → owes the difference
              listing.status = ListingStatus.AwaitingFee;
            }
          } else {
            // First time approval with fee expected → awaiting fee payment
            listing.listingFeeStatus = 'pending';
            listing.status = ListingStatus.AwaitingFee;
          }
        } else if (listing.type === ListingType.Consignment) {
          // Consignment → need pricing, then awaiting_product
          if (!sellingPrice) {
            throw new BadRequestException(
              'Selling price is required for consignment listings',
            );
          }
          listing.adminPricing = {
            sellingPrice,
            commissionRate:
              commissionRate ?? (await this.getConsignmentCommissionRate()),
          };
          listing.status = ListingStatus.AwaitingProduct;
        } else if (listing.type === ListingType.DirectPurchase) {
          // Direct purchase → platform makes an offer
          if (platformBid) {
            listing.platformBid = platformBid;
            listing.status = ListingStatus.PriceOffered;
          } else if (purchasePrice && sellingPrice) {
            // Or approve directly with full pricing
            listing.adminPricing = {
              purchasePrice,
              sellingPrice,
              commissionRate: 0,
            };
            listing.status = ListingStatus.AwaitingProduct;
          } else {
            throw new BadRequestException(
              'Direct purchase requires either a platformBid (offer) or both purchasePrice and sellingPrice',
            );
          }
        }
        break;
      }

      // ─── REJECT ──────────────────────────────────────────
      case 'reject': {
        if (!rejectionReason) {
          throw new BadRequestException(
            'Rejection reason is required when rejecting a listing',
          );
        }
        listing.status = ListingStatus.Rejected;
        break;
      }

      // ─── SUSPEND ─────────────────────────────────────────
      case 'suspend': {
        if (listing.status !== ListingStatus.Live) {
          throw new BadRequestException('Can only suspend live listings');
        }
        listing.status = ListingStatus.Suspended;
        break;
      }

      // ─── REINSTATE ───────────────────────────────────────
      case 'reinstate': {
        if (listing.status !== ListingStatus.Suspended) {
          throw new BadRequestException(
            'Can only reinstate suspended listings',
          );
        }
        listing.status = ListingStatus.Live;
        break;
      }

      // ─── DELIST ──────────────────────────────────────────
      case 'delist': {
        if (listing.status !== ListingStatus.Live) {
          throw new BadRequestException('Can only delist live listings');
        }
        listing.status = ListingStatus.Delisted;
        break;
      }

      // ─── MAKE OFFER (direct purchase) ────────────────────
      case 'make_offer': {
        if (!platformBid) {
          throw new BadRequestException(
            'platformBid is required for make_offer',
          );
        }
        if (listing.type !== ListingType.DirectPurchase) {
          throw new BadRequestException(
            'make_offer only applies to direct_purchase listings',
          );
        }
        listing.platformBid = platformBid;
        listing.counterOffer = null; // Reset any previous counter
        listing.status = ListingStatus.PriceOffered;
        break;
      }

      // ─── ACCEPT COUNTER (direct purchase) ────────────────
      case 'accept_counter': {
        if (listing.status !== ListingStatus.CounterOffer) {
          throw new BadRequestException(
            'Listing is not in counter_offer status',
          );
        }
        // Accept seller's counter as the purchase price
        const agreedPrice = listing.counterOffer;
        if (!sellingPrice) {
          throw new BadRequestException(
            'sellingPrice is required when accepting counter-offer (the price Comaket will sell at)',
          );
        }
        listing.adminPricing = {
          purchasePrice: agreedPrice,
          sellingPrice,
          commissionRate: 0,
        };
        listing.status = ListingStatus.AwaitingProduct;
        break;
      }

      // ─── REJECT COUNTER (direct purchase) ────────────────
      case 'reject_counter': {
        if (listing.status !== ListingStatus.CounterOffer) {
          throw new BadRequestException(
            'Listing is not in counter_offer status',
          );
        }
        listing.status = ListingStatus.Rejected;
        break;
      }

      // ─── MARK AWAITING FEE (self-listing) ────────────────
      case 'mark_awaiting_fee': {
        if (listing.type !== ListingType.SelfListing) {
          throw new BadRequestException(
            'mark_awaiting_fee only applies to self_listing',
          );
        }
        listing.listingFeeStatus = 'pending';
        listing.status = ListingStatus.AwaitingFee;
        break;
      }

      // ─── MARK AWAITING PRODUCT ───────────────────────────
      case 'mark_awaiting_product': {
        listing.status = ListingStatus.AwaitingProduct;
        break;
      }

      // ─── MARK LIVE (manual push to marketplace) ──────────
      case 'mark_live': {
        const liveableStatuses = [
          ListingStatus.Approved,
          ListingStatus.AwaitingFee,
          ListingStatus.AwaitingProduct,
          ListingStatus.Delisted,
        ];
        if (!liveableStatuses.includes(listing.status)) {
          throw new BadRequestException(
            `Cannot mark live from status "${listing.status}"`,
          );
        }
        // For self-listing, check fee is paid
        if (
          listing.type === ListingType.SelfListing &&
          listing.listingFeeStatus !== 'paid' &&
          listing.listingFeeStatus !== 'waived'
        ) {
          throw new BadRequestException(
            'Listing fee must be paid or waived before going live',
          );
        }
        listing.status = ListingStatus.Live;
        break;
      }

      // ─── MARK RECEIVED (direct purchase: product received by platform) ──
      case 'mark_received': {
        if (listing.type !== ListingType.DirectPurchase) {
          throw new BadRequestException(
            'mark_received only applies to direct_purchase listings',
          );
        }
        if (listing.status !== ListingStatus.AwaitingProduct) {
          throw new BadRequestException(
            `Cannot mark received from status "${listing.status}". Must be awaiting_product.`,
          );
        }
        listing.status = ListingStatus.SoldToPlatform;
        break;
      }

      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }

    // Set review info
    listing.reviewInfo = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason: rejectionReason || undefined,
      adminNotes: adminNotes || undefined,
    };

    const savedListing = await listing.save();

    // Notify seller about the review result (fire and forget)
    const sellerUser = await this.listingModel
      .findById(listing._id)
      .populate('userId', 'firstName email')
      .exec();

    if (sellerUser) {
      const seller = sellerUser.userId as any;
      if (action === 'approve') {
        this.notificationsService.sendListingApproved(
          seller.email,
          seller.firstName,
          listing.itemName,
        );
      } else if (action === 'reject' && rejectionReason) {
        this.notificationsService.sendListingRejected(
          seller.email,
          seller.firstName,
          listing.itemName,
          rejectionReason,
        );
      }

      // In-app alerts
      const sellerId = listing.userId?.toString();
      if (sellerId) {
        if (action === 'approve') {
          this.alertsService.createAlert({
            userId: sellerId,
            type: AlertType.ListingApproved,
            title: 'Listing Approved! ✅',
            message: `Your listing "${listing.itemName}" has been approved.${savedListing.status === ListingStatus.Live ? ' It\'s now live on the marketplace!' : ''}`,
            entityId: listing._id,
            entityType: 'listing',
          }).catch(() => {});
        } else if (action === 'reject') {
          this.alertsService.createAlert({
            userId: sellerId,
            type: AlertType.ListingRejected,
            title: 'Listing Not Approved',
            message: `Your listing "${listing.itemName}" was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
            entityId: listing._id,
            entityType: 'listing',
          }).catch(() => {});
        }
      }
    }

    return savedListing;
  }

  // ─── My Listings ─────────────────────────────────────────

  /**
   * Get all listings by the authenticated user (across all stores).
   * Used on the creator dashboard.
   *
   * Supports all QueryListingsDto filters:
   *   search, status, type, condition, category,
   *   storeId, minPrice, maxPrice, sort, buyableOnly
   */
  async findMyListings(
    userId: string,
    queryDto: QueryListingsDto,
  ): Promise<PaginatedResponse<ListingDocument>> {
    const {
      page,
      perPage,
      sort,
      search,
      status,
      type,
      condition,
      category,
      subCategory,
      storeId,
      minPrice,
      maxPrice,
      buyableOnly,
    } = queryDto;

    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
      isDeleted: { $ne: true },
    };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (condition) filter.condition = condition;
    if (category) {
      filter.category = {
        $regex: new RegExp(category.replace(/[-_]/g, '.*'), 'i'),
      };
    }
    if (subCategory) {
      filter.subCategory = {
        $regex: new RegExp(subCategory.replace(/[-_]/g, '.*'), 'i'),
      };
    }
    if (storeId) filter.storeId = new Types.ObjectId(storeId);

    // buyableOnly: consignment + direct_purchase + admin only
    if (buyableOnly) {
      filter.type = {
        $in: [ListingType.Consignment, ListingType.DirectPurchase, ListingType.Admin],
      };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['askingPrice.amount'] = {};
      if (minPrice !== undefined) {
        filter['askingPrice.amount'].$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        filter['askingPrice.amount'].$lte = maxPrice;
      }
    }

    // Text search
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort
    const sortObj: Record<string, 1 | -1> = {};
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      sortObj[sortField] = sortOrder;
    } else {
      sortObj.createdAt = -1;
    }

    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      this.listingModel
        .find(filter)
        .populate(
          'storeId',
          'name slug logo phoneNumber whatsappNumber location isVerified isSuperVerified',
        )
        .populate(
          'creatorId',
          'username slug profileImageUrl isVerified phoneNumber whatsappNumber website location totalFollowers',
        )
        .sort(sortObj)
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.listingModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // ─── Marketplace Feed ────────────────────────────────────

  /**
   * GET /listings — The main marketplace feed.
   * Only shows LIVE listings that aren't deleted.
   *
   * Supports:
   * - Filter by type, category, condition, price range
   * - Filter by store or creator
   * - buyableOnly: only show items that can be bought on platform
   * - Text search on itemName, description, tags
   * - Pagination and sorting
   */
  async findAll(
    queryDto: QueryListingsDto,
  ): Promise<PaginatedResponse<ListingDocument>> {
    const {
      page,
      perPage,
      sort,
      search,
      type,
      status,
      condition,
      category,
      subCategory,
      storeId,
      creatorId,
      minPrice,
      maxPrice,
      buyableOnly,
    } = queryDto;

    const filter: Record<string, any> = {
      isDeleted: { $ne: true },
    };

    // Default: only live listings on the marketplace
    filter.status = status || ListingStatus.Live;

    // Exclude listings from hidden stores
    const hiddenStores = await this.listingModel.db
      .collection('stores')
      .find({ isVisible: false })
      .project({ _id: 1 })
      .toArray();
    if (hiddenStores.length > 0) {
      const hiddenStoreIds = hiddenStores.map((s) => s._id);
      filter.storeId = { $nin: hiddenStoreIds };
    }

    // Filters
    if (type) filter.type = type;
    if (condition) filter.condition = condition;
    if (category) {
      filter.category = {
        $regex: new RegExp(category.replace(/[-_]/g, '.*'), 'i'),
      };
    }
    if (subCategory) {
      filter.subCategory = {
        $regex: new RegExp(subCategory.replace(/[-_]/g, '.*'), 'i'),
      };
    }
    if (storeId) filter.storeId = new Types.ObjectId(storeId);
    if (creatorId) filter.creatorId = new Types.ObjectId(creatorId);

    // buyableOnly: consignment + direct_purchase + admin only
    if (buyableOnly) {
      filter.type = {
        $in: [ListingType.Consignment, ListingType.DirectPurchase, ListingType.Admin],
      };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['askingPrice.amount'] = {};
      if (minPrice !== undefined) {
        filter['askingPrice.amount'].$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        filter['askingPrice.amount'].$lte = maxPrice;
      }
    }

    // Text search
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Parse sort
    const sortObj: Record<string, 1 | -1> = {};
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      sortObj[sortField] = sortOrder;
    } else {
      sortObj.createdAt = -1;
    }

    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      this.listingModel
        .find(filter)
        .populate(
          'storeId',
          'name slug logo phoneNumber whatsappNumber location categories isVerified isSuperVerified',
        )
        .populate({
          path: 'creatorId',
          select:
            'username slug profileImageUrl isVerified phoneNumber whatsappNumber website location totalFollowers',
        })
        .populate('userId', 'firstName lastName avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.listingModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // ─── Listings by Store ───────────────────────────────────

  /**
   * Get all live listings in a specific store.
   * Used on the public store page.
   */
  async findByStore(
    storeId: string,
    queryDto: QueryListingsDto,
  ): Promise<PaginatedResponse<ListingDocument>> {
    return this.findAll({ ...queryDto, storeId });
  }

  // ─── Listings by Creator ─────────────────────────────────

  /**
   * Get all live listings by a creator (across ALL their stores).
   * Used on the public creator profile page — this is the "aggregation"
   * feature where the creator page shows products from all their stores.
   */
  async findByCreator(
    creatorId: string,
    queryDto: QueryListingsDto,
  ): Promise<PaginatedResponse<ListingDocument>> {
    return this.findAll({ ...queryDto, creatorId });
  }

  // ─── Admin: Get All Listings ─────────────────────────────

  /**
   * Admin endpoint — get all listings with optional filtering.
   * Unlike the public findAll, this does NOT default to "live" status.
   */
  async findAllAdmin(
    queryDto: QueryListingsDto,
  ): Promise<PaginatedResponse<ListingDocument>> {
    const {
      page,
      perPage,
      sort,
      search,
      type,
      status,
      condition,
      category,
      subCategory,
      storeId,
      creatorId,
      minPrice,
      maxPrice,
    } = queryDto;

    const filter: Record<string, any> = {
      isDeleted: { $ne: true },
    };

    // Only apply status filter if provided (don't default to live)
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (condition) filter.condition = condition;
    if (category) {
      filter['category.slug'] = { $regex: new RegExp(category, 'i') };
    }
    if (subCategory) {
      filter.subCategory = { $regex: new RegExp(subCategory, 'i') };
    }
    if (storeId) filter.storeId = storeId;
    if (creatorId) filter.creatorId = creatorId;
    if (minPrice || maxPrice) {
      filter['askingPrice.amount'] = {};
      if (minPrice) filter['askingPrice.amount'].$gte = minPrice;
      if (maxPrice) filter['askingPrice.amount'].$lte = maxPrice;
    }
    if (search) {
      filter.$or = [
        { itemName: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
        { 'tags': { $regex: new RegExp(search, 'i') } },
      ];
    }

    const skip = ((page || 1) - 1) * (perPage || 20);
    const sortObj: Record<string, 1 | -1> = {};
    if (sort) {
      const [field, dir] = sort.split(':');
      sortObj[field] = dir === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1;
    }

    const [items, total] = await Promise.all([
      this.listingModel
        .find(filter)
        .populate(
          'storeId',
          'name slug logo phoneNumber whatsappNumber location isVerified isSuperVerified',
        )
        .populate(
          'creatorId',
          'username slug profileImageUrl isVerified phoneNumber whatsappNumber website location totalFollowers',
        )
        .sort(sortObj)
        .skip(skip)
        .limit(perPage || 20)
        .exec(),
      this.listingModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page: page || 1,
      perPage: perPage || 20,
      totalPages: Math.ceil(total / (perPage || 20)),
    };
  }

  // ─── Admin: Get Pending Listings ─────────────────────────

  /**
   * Admin endpoint — get all listings pending review.
   */
  async findPending(
    queryDto: QueryListingsDto,
  ): Promise<PaginatedResponse<ListingDocument>> {
    return this.findAll({
      ...queryDto,
      status: ListingStatus.InReview,
    });
  }

  // ─── Seller: Counter Offer (direct purchase) ──────────

  /**
   * Seller submits a counter-offer for a direct purchase listing
   * where the platform has made a bid (price_offered status).
   */
  async sellerCounterOffer(
    listingId: string,
    userId: string,
    counterOffer: number,
  ): Promise<ListingDocument> {
    const listing = await this.verifyOwnership(listingId, userId);

    if (listing.type !== ListingType.DirectPurchase) {
      throw new BadRequestException(
        'Counter-offer only applies to direct purchase listings',
      );
    }

    if (listing.status !== ListingStatus.PriceOffered) {
      throw new BadRequestException(
        `Cannot counter-offer on a listing with status "${listing.status}". ` +
          `Listing must be in "price_offered" status.`,
      );
    }

    listing.counterOffer = counterOffer;
    listing.status = ListingStatus.CounterOffer;
    return listing.save();
  }

  // ─── Seller: Accept Platform Offer (direct purchase) ────

  /**
   * Seller accepts the platform's bid for a direct purchase listing.
   */
  async sellerAcceptOffer(
    listingId: string,
    userId: string,
  ): Promise<ListingDocument> {
    const listing = await this.verifyOwnership(listingId, userId);

    if (listing.type !== ListingType.DirectPurchase) {
      throw new BadRequestException(
        'Accept offer only applies to direct purchase listings',
      );
    }

    if (listing.status !== ListingStatus.PriceOffered) {
      throw new BadRequestException(
        `Cannot accept offer on a listing with status "${listing.status}"`,
      );
    }

    // Move to awaiting_product — platform needs to receive the item
    listing.status = ListingStatus.AwaitingProduct;
    return listing.save();
  }

  // ─── Seller: Reject Platform Offer (direct purchase) ────

  /**
   * Seller rejects the platform's bid outright.
   */
  async sellerRejectOffer(
    listingId: string,
    userId: string,
  ): Promise<ListingDocument> {
    const listing = await this.verifyOwnership(listingId, userId);

    if (listing.status !== ListingStatus.PriceOffered) {
      throw new BadRequestException(
        `Cannot reject offer on a listing with status "${listing.status}"`,
      );
    }

    listing.status = ListingStatus.Rejected;
    listing.reviewInfo = {
      rejectionReason: 'Seller rejected the platform offer.',
      reviewedAt: new Date(),
    };
    return listing.save();
  }

  // ─── Confirm Fee Payment (self-listing) ────────────────

  /**
   * Mark listing fee as paid for a self-listing item.
   * In production this would be triggered by Paystack webhook.
   * For now, admin or system can call this.
   */
  async confirmFeePaid(
    listingId: string,
    adminId?: string,
  ): Promise<ListingDocument> {
    const listing = await this.listingModel.findById(listingId).exec();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.type !== ListingType.SelfListing) {
      throw new BadRequestException(
        'Fee confirmation only applies to self-listings',
      );
    }

    if (listing.status !== ListingStatus.AwaitingFee) {
      throw new BadRequestException(
        `Cannot confirm fee for listing with status "${listing.status}"`,
      );
    }

    listing.listingFeeStatus = 'paid';
    listing.status = ListingStatus.Live;

    if (adminId) {
      listing.reviewInfo = {
        ...(listing.reviewInfo || {}),
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes: 'Listing fee confirmed. Item is now live.',
      };
    }

    return listing.save();
  }

  // ─── Seller: Delist own listing ────────────────────────

  /**
   * Seller voluntarily removes their listing from the marketplace.
   */
  async sellerDelist(
    listingId: string,
    userId: string,
  ): Promise<ListingDocument> {
    const listing = await this.verifyOwnership(listingId, userId);

    if (listing.status !== ListingStatus.Live) {
      throw new BadRequestException('Can only delist live listings');
    }

    listing.status = ListingStatus.Delisted;
    return listing.save();
  }

  // ─── Stats ───────────────────────────────────────────────

  async countListings(filter: Record<string, any> = {}): Promise<number> {
    return this.listingModel.countDocuments(filter).exec();
  }
}