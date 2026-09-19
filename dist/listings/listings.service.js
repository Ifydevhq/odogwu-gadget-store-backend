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
exports.ListingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const listing_schema_1 = require("./schemas/listing.schema");
const stores_service_1 = require("../stores/stores.service");
const creators_service_1 = require("../creators/creators.service");
const platform_settings_service_1 = require("../platform-settings/platform-settings.service");
const contants_1 = require("../config/contants");
const notifications_service_1 = require("../notifications/notifications.service");
const alerts_service_1 = require("../alerts/alerts.service");
const contants_2 = require("../config/contants");
let ListingsService = class ListingsService {
    constructor(listingModel, storesService, creatorsService, notificationsService, platformSettingsService, alertsService) {
        this.listingModel = listingModel;
        this.storesService = storesService;
        this.creatorsService = creatorsService;
        this.notificationsService = notificationsService;
        this.platformSettingsService = platformSettingsService;
        this.alertsService = alertsService;
    }
    async isFreeListing() {
        return this.platformSettingsService.isFreeListing();
    }
    async isNoCommission() {
        return this.platformSettingsService.isNoCommission();
    }
    async calculateListingFee(askingPriceKobo) {
        const freeListing = await this.isFreeListing();
        if (freeListing)
            return 0;
        const settings = await this.platformSettingsService.getSettings();
        const percent = settings.selfListingFeePercent;
        const cap = settings.listingFeeCapKobo;
        const fee = Math.round((askingPriceKobo * percent) / 100);
        return cap > 0 ? Math.min(fee, cap) : fee;
    }
    async getConsignmentCommissionRate() {
        const noCommission = await this.isNoCommission();
        if (noCommission)
            return 0;
        return this.platformSettingsService.getConsignmentCommissionPercent();
    }
    async verifyOwnership(listingId, userId) {
        const listing = await this.listingModel.findById(listingId).exec();
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (listing.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You do not own this listing');
        }
        return listing;
    }
    async create(userId, createListingDto, creatorRole) {
        const { storeId, type, whatsappNumber, formerPrice } = createListingDto;
        const skipReview = creatorRole === contants_1.UserRole.SuperAdmin || creatorRole === contants_1.UserRole.Admin;
        const sellingAmount = createListingDto.askingPrice?.amount ?? 0;
        let formerPriceKobo;
        let discountPercent;
        if (formerPrice && sellingAmount > 0 && formerPrice > sellingAmount) {
            formerPriceKobo = formerPrice;
            discountPercent = Math.round(((formerPrice - sellingAmount) / formerPrice) * 100);
        }
        let store = null;
        if (storeId) {
            store = await this.storesService.findById(storeId);
            const storeOwnerId = store.userId?._id?.toString() || store.userId?.toString();
            if (storeOwnerId !== userId) {
                throw new common_1.ForbiddenException('You do not own this store');
            }
        }
        const creator = await this.creatorsService.findByUserId(userId);
        if (type === contants_1.ListingType.SelfListing && !whatsappNumber) {
            throw new common_1.BadRequestException('WhatsApp number is required for self-listed items. ' +
                'Buyers will use this to contact you.');
        }
        if (!createListingDto.media || createListingDto.media.length === 0) {
            throw new common_1.BadRequestException('At least one image is required');
        }
        if (createListingDto.media.length > 10) {
            throw new common_1.BadRequestException('Maximum 10 media items allowed');
        }
        let selfListingFeeData = {};
        if (type === contants_1.ListingType.SelfListing) {
            const freeListing = await this.isFreeListing();
            const fee = await this.calculateListingFee(createListingDto.askingPrice.amount);
            selfListingFeeData = {
                listingFee: fee,
                feePaidAmount: 0,
                listingFeeStatus: freeListing ? 'waived' : 'pending',
                isExpectingFee: !freeListing && fee > 0,
            };
        }
        const listing = new this.listingModel({
            ...createListingDto,
            storeId: storeId ? new mongoose_2.Types.ObjectId(storeId) : null,
            creatorId: creator._id,
            userId: new mongoose_2.Types.ObjectId(userId),
            whatsappNumber: whatsappNumber || store?.whatsappNumber || creator.whatsappNumber,
            ...selfListingFeeData,
            status: skipReview ? contants_1.ListingStatus.Live : contants_1.ListingStatus.InReview,
            formerPrice: formerPriceKobo,
            discountPercent: discountPercent,
            ...(skipReview
                ? { listingFeeStatus: 'waived', isExpectingFee: false }
                : {}),
        });
        const savedListing = await listing.save();
        if (storeId) {
            await this.storesService.updateStats(storeId, 'totalListings', 1);
        }
        await this.creatorsService.updateStats(creator._id.toString(), 'totalListings', 1);
        return savedListing;
    }
    async findById(listingId) {
        const listing = await this.listingModel
            .findById(listingId)
            .populate({
            path: 'storeId',
            select: 'name slug logo description phoneNumber whatsappNumber address category tags status isVerified isSuperVerified',
        })
            .populate({
            path: 'creatorId',
            select: 'username slug profileImageUrl bio isVerified phoneNumber whatsappNumber website location industries socialLinks plan rating totalReviews totalFollowers',
        })
            .populate('userId', 'firstName lastName avatar email')
            .exec();
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        this.listingModel
            .findByIdAndUpdate(listingId, { $inc: { views: 1 } })
            .exec();
        return listing;
    }
    async update(listingId, userId, updateListingDto, editorRole) {
        const listing = await this.verifyOwnership(listingId, userId);
        const skipReview = editorRole === contants_1.UserRole.SuperAdmin || editorRole === contants_1.UserRole.Admin;
        const editableStatuses = [
            contants_1.ListingStatus.Draft,
            contants_1.ListingStatus.InReview,
            contants_1.ListingStatus.Rejected,
            contants_1.ListingStatus.AwaitingFee,
            contants_1.ListingStatus.PriceOffered,
            contants_1.ListingStatus.CounterOffer,
            contants_1.ListingStatus.Live,
        ];
        if (!editableStatuses.includes(listing.status)) {
            throw new common_1.BadRequestException(`Cannot edit a listing with status "${listing.status}".`);
        }
        const isCurrentlyLive = listing.status === contants_1.ListingStatus.Live;
        const priceChanged = updateListingDto.askingPrice?.amount !== undefined &&
            updateListingDto.askingPrice.amount !== listing.askingPrice?.amount;
        if (isCurrentlyLive && !skipReview) {
            listing.status = contants_1.ListingStatus.InReview;
            listing.wasLive = true;
            listing.reviewInfo = null;
        }
        if (listing.status === contants_1.ListingStatus.Rejected) {
            listing.status = contants_1.ListingStatus.InReview;
            listing.reviewInfo = null;
        }
        Object.assign(listing, updateListingDto);
        const sellingAmount = listing.askingPrice?.amount ?? 0;
        const nextFormer = updateListingDto.formerPrice !== undefined
            ? updateListingDto.formerPrice
            : listing.formerPrice;
        if (nextFormer && sellingAmount > 0 && nextFormer > sellingAmount) {
            listing.formerPrice = nextFormer;
            listing.discountPercent = Math.round(((nextFormer - sellingAmount) / nextFormer) * 100);
        }
        else {
            listing.set('formerPrice', undefined);
            listing.set('discountPercent', undefined);
        }
        if (listing.type === contants_1.ListingType.SelfListing && priceChanged) {
            const freeListing = await this.isFreeListing();
            const newFee = await this.calculateListingFee(listing.askingPrice.amount);
            listing.listingFee = newFee;
            listing.isExpectingFee = !freeListing && newFee > 0;
            if (!listing.isExpectingFee) {
                listing.listingFeeStatus = 'waived';
            }
            else if (listing.feePaidAmount >= newFee) {
                listing.listingFeeStatus = 'paid';
            }
            else {
                listing.listingFeeStatus = 'pending';
            }
        }
        return listing.save();
    }
    async remove(listingId, userId) {
        const listing = await this.verifyOwnership(listingId, userId);
        if (listing.status === contants_1.ListingStatus.Sold) {
            throw new common_1.BadRequestException('Cannot delete a sold listing');
        }
        listing.isDeleted = true;
        listing.deletedAt = new Date();
        listing.status = contants_1.ListingStatus.Delisted;
        await listing.save();
        if (listing.storeId) {
            await this.storesService.updateStats(listing.storeId.toString(), 'totalListings', -1);
        }
        await this.creatorsService.updateStats(listing.creatorId.toString(), 'totalListings', -1);
        return { message: 'Listing deleted successfully' };
    }
    async adminReview(listingId, adminId, reviewDto) {
        const listing = await this.listingModel.findById(listingId).exec();
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        const { action, rejectionReason, adminNotes, sellingPrice, purchasePrice, commissionRate, platformBid, } = reviewDto;
        switch (action) {
            case 'approve': {
                if (listing.status !== contants_1.ListingStatus.InReview &&
                    listing.status !== contants_1.ListingStatus.Draft) {
                    throw new common_1.BadRequestException(`Cannot approve a listing with status "${listing.status}"`);
                }
                if (listing.type === contants_1.ListingType.SelfListing) {
                    const freeListing = await this.isFreeListing();
                    const computedFee = await this.calculateListingFee(listing.askingPrice.amount);
                    listing.listingFee = computedFee;
                    listing.isExpectingFee = !freeListing && computedFee > 0;
                    if (!listing.isExpectingFee) {
                        listing.listingFeeStatus = 'waived';
                        listing.status = contants_1.ListingStatus.Live;
                    }
                    else if (listing.wasLive) {
                        if (listing.listingFeeStatus === 'paid' ||
                            listing.listingFeeStatus === 'waived' ||
                            listing.feePaidAmount >= listing.listingFee) {
                            listing.listingFeeStatus = 'paid';
                            listing.status = contants_1.ListingStatus.Live;
                            listing.wasLive = false;
                        }
                        else {
                            listing.status = contants_1.ListingStatus.AwaitingFee;
                        }
                    }
                    else {
                        listing.listingFeeStatus = 'pending';
                        listing.status = contants_1.ListingStatus.AwaitingFee;
                    }
                }
                else if (listing.type === contants_1.ListingType.Consignment) {
                    if (!sellingPrice) {
                        throw new common_1.BadRequestException('Selling price is required for consignment listings');
                    }
                    listing.adminPricing = {
                        sellingPrice,
                        commissionRate: commissionRate ?? (await this.getConsignmentCommissionRate()),
                    };
                    listing.status = contants_1.ListingStatus.AwaitingProduct;
                }
                else if (listing.type === contants_1.ListingType.DirectPurchase) {
                    if (platformBid) {
                        listing.platformBid = platformBid;
                        listing.status = contants_1.ListingStatus.PriceOffered;
                    }
                    else if (purchasePrice && sellingPrice) {
                        listing.adminPricing = {
                            purchasePrice,
                            sellingPrice,
                            commissionRate: 0,
                        };
                        listing.status = contants_1.ListingStatus.AwaitingProduct;
                    }
                    else {
                        throw new common_1.BadRequestException('Direct purchase requires either a platformBid (offer) or both purchasePrice and sellingPrice');
                    }
                }
                break;
            }
            case 'reject': {
                if (!rejectionReason) {
                    throw new common_1.BadRequestException('Rejection reason is required when rejecting a listing');
                }
                listing.status = contants_1.ListingStatus.Rejected;
                break;
            }
            case 'suspend': {
                if (listing.status !== contants_1.ListingStatus.Live) {
                    throw new common_1.BadRequestException('Can only suspend live listings');
                }
                listing.status = contants_1.ListingStatus.Suspended;
                break;
            }
            case 'reinstate': {
                if (listing.status !== contants_1.ListingStatus.Suspended) {
                    throw new common_1.BadRequestException('Can only reinstate suspended listings');
                }
                listing.status = contants_1.ListingStatus.Live;
                break;
            }
            case 'delist': {
                if (listing.status !== contants_1.ListingStatus.Live) {
                    throw new common_1.BadRequestException('Can only delist live listings');
                }
                listing.status = contants_1.ListingStatus.Delisted;
                break;
            }
            case 'make_offer': {
                if (!platformBid) {
                    throw new common_1.BadRequestException('platformBid is required for make_offer');
                }
                if (listing.type !== contants_1.ListingType.DirectPurchase) {
                    throw new common_1.BadRequestException('make_offer only applies to direct_purchase listings');
                }
                listing.platformBid = platformBid;
                listing.counterOffer = null;
                listing.status = contants_1.ListingStatus.PriceOffered;
                break;
            }
            case 'accept_counter': {
                if (listing.status !== contants_1.ListingStatus.CounterOffer) {
                    throw new common_1.BadRequestException('Listing is not in counter_offer status');
                }
                const agreedPrice = listing.counterOffer;
                if (!sellingPrice) {
                    throw new common_1.BadRequestException('sellingPrice is required when accepting counter-offer (the price Comaket will sell at)');
                }
                listing.adminPricing = {
                    purchasePrice: agreedPrice,
                    sellingPrice,
                    commissionRate: 0,
                };
                listing.status = contants_1.ListingStatus.AwaitingProduct;
                break;
            }
            case 'reject_counter': {
                if (listing.status !== contants_1.ListingStatus.CounterOffer) {
                    throw new common_1.BadRequestException('Listing is not in counter_offer status');
                }
                listing.status = contants_1.ListingStatus.Rejected;
                break;
            }
            case 'mark_awaiting_fee': {
                if (listing.type !== contants_1.ListingType.SelfListing) {
                    throw new common_1.BadRequestException('mark_awaiting_fee only applies to self_listing');
                }
                listing.listingFeeStatus = 'pending';
                listing.status = contants_1.ListingStatus.AwaitingFee;
                break;
            }
            case 'mark_awaiting_product': {
                listing.status = contants_1.ListingStatus.AwaitingProduct;
                break;
            }
            case 'mark_live': {
                const liveableStatuses = [
                    contants_1.ListingStatus.Approved,
                    contants_1.ListingStatus.AwaitingFee,
                    contants_1.ListingStatus.AwaitingProduct,
                    contants_1.ListingStatus.Delisted,
                ];
                if (!liveableStatuses.includes(listing.status)) {
                    throw new common_1.BadRequestException(`Cannot mark live from status "${listing.status}"`);
                }
                if (listing.type === contants_1.ListingType.SelfListing &&
                    listing.listingFeeStatus !== 'paid' &&
                    listing.listingFeeStatus !== 'waived') {
                    throw new common_1.BadRequestException('Listing fee must be paid or waived before going live');
                }
                listing.status = contants_1.ListingStatus.Live;
                break;
            }
            case 'mark_received': {
                if (listing.type !== contants_1.ListingType.DirectPurchase) {
                    throw new common_1.BadRequestException('mark_received only applies to direct_purchase listings');
                }
                if (listing.status !== contants_1.ListingStatus.AwaitingProduct) {
                    throw new common_1.BadRequestException(`Cannot mark received from status "${listing.status}". Must be awaiting_product.`);
                }
                listing.status = contants_1.ListingStatus.SoldToPlatform;
                break;
            }
            default:
                throw new common_1.BadRequestException(`Unknown action: ${action}`);
        }
        listing.reviewInfo = {
            reviewedBy: adminId,
            reviewedAt: new Date(),
            rejectionReason: rejectionReason || undefined,
            adminNotes: adminNotes || undefined,
        };
        const savedListing = await listing.save();
        const sellerUser = await this.listingModel
            .findById(listing._id)
            .populate('userId', 'firstName email')
            .exec();
        if (sellerUser) {
            const seller = sellerUser.userId;
            if (action === 'approve') {
                this.notificationsService.sendListingApproved(seller.email, seller.firstName, listing.itemName);
            }
            else if (action === 'reject' && rejectionReason) {
                this.notificationsService.sendListingRejected(seller.email, seller.firstName, listing.itemName, rejectionReason);
            }
            const sellerId = listing.userId?.toString();
            if (sellerId) {
                if (action === 'approve') {
                    this.alertsService.createAlert({
                        userId: sellerId,
                        type: contants_2.AlertType.ListingApproved,
                        title: 'Listing Approved! ✅',
                        message: `Your listing "${listing.itemName}" has been approved.${savedListing.status === contants_1.ListingStatus.Live ? ' It\'s now live on the marketplace!' : ''}`,
                        entityId: listing._id,
                        entityType: 'listing',
                    }).catch(() => { });
                }
                else if (action === 'reject') {
                    this.alertsService.createAlert({
                        userId: sellerId,
                        type: contants_2.AlertType.ListingRejected,
                        title: 'Listing Not Approved',
                        message: `Your listing "${listing.itemName}" was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
                        entityId: listing._id,
                        entityType: 'listing',
                    }).catch(() => { });
                }
            }
        }
        return savedListing;
    }
    async findMyListings(userId, queryDto) {
        const { page, perPage, sort, search, status, type, condition, category, subCategory, storeId, minPrice, maxPrice, buyableOnly, } = queryDto;
        const filter = {
            userId: new mongoose_2.Types.ObjectId(userId),
            isDeleted: { $ne: true },
        };
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        if (condition)
            filter.condition = condition;
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
        if (storeId)
            filter.storeId = new mongoose_2.Types.ObjectId(storeId);
        if (buyableOnly) {
            filter.type = {
                $in: [contants_1.ListingType.Consignment, contants_1.ListingType.DirectPurchase, contants_1.ListingType.Admin],
            };
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter['askingPrice.amount'] = {};
            if (minPrice !== undefined) {
                filter['askingPrice.amount'].$gte = minPrice;
            }
            if (maxPrice !== undefined) {
                filter['askingPrice.amount'].$lte = maxPrice;
            }
        }
        if (search) {
            filter.$or = [
                { itemName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }
        const sortObj = {};
        if (sort) {
            const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
            const sortOrder = sort.startsWith('-') ? -1 : 1;
            sortObj[sortField] = sortOrder;
        }
        else {
            sortObj.createdAt = -1;
        }
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.listingModel
                .find(filter)
                .populate('storeId', 'name slug logo phoneNumber whatsappNumber location isVerified isSuperVerified')
                .populate('creatorId', 'username slug profileImageUrl isVerified phoneNumber whatsappNumber website location totalFollowers')
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
    async findAll(queryDto) {
        const { page, perPage, sort, search, type, status, condition, category, subCategory, storeId, creatorId, minPrice, maxPrice, buyableOnly, } = queryDto;
        const filter = {
            isDeleted: { $ne: true },
        };
        filter.status = status || contants_1.ListingStatus.Live;
        const hiddenStores = await this.listingModel.db
            .collection('stores')
            .find({ isVisible: false })
            .project({ _id: 1 })
            .toArray();
        if (hiddenStores.length > 0) {
            const hiddenStoreIds = hiddenStores.map((s) => s._id);
            filter.storeId = { $nin: hiddenStoreIds };
        }
        if (type)
            filter.type = type;
        if (condition)
            filter.condition = condition;
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
        if (storeId)
            filter.storeId = new mongoose_2.Types.ObjectId(storeId);
        if (creatorId)
            filter.creatorId = new mongoose_2.Types.ObjectId(creatorId);
        if (buyableOnly) {
            filter.type = {
                $in: [contants_1.ListingType.Consignment, contants_1.ListingType.DirectPurchase, contants_1.ListingType.Admin],
            };
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter['askingPrice.amount'] = {};
            if (minPrice !== undefined) {
                filter['askingPrice.amount'].$gte = minPrice;
            }
            if (maxPrice !== undefined) {
                filter['askingPrice.amount'].$lte = maxPrice;
            }
        }
        if (search) {
            filter.$or = [
                { itemName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }
        const sortObj = {};
        if (sort) {
            const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
            const sortOrder = sort.startsWith('-') ? -1 : 1;
            sortObj[sortField] = sortOrder;
        }
        else {
            sortObj.createdAt = -1;
        }
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.listingModel
                .find(filter)
                .populate('storeId', 'name slug logo phoneNumber whatsappNumber location categories isVerified isSuperVerified')
                .populate({
                path: 'creatorId',
                select: 'username slug profileImageUrl isVerified phoneNumber whatsappNumber website location totalFollowers',
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
    async findByStore(storeId, queryDto) {
        return this.findAll({ ...queryDto, storeId });
    }
    async findByCreator(creatorId, queryDto) {
        return this.findAll({ ...queryDto, creatorId });
    }
    async findAllAdmin(queryDto) {
        const { page, perPage, sort, search, type, status, condition, category, subCategory, storeId, creatorId, minPrice, maxPrice, } = queryDto;
        const filter = {
            isDeleted: { $ne: true },
        };
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        if (condition)
            filter.condition = condition;
        if (category) {
            filter['category.slug'] = { $regex: new RegExp(category, 'i') };
        }
        if (subCategory) {
            filter.subCategory = { $regex: new RegExp(subCategory, 'i') };
        }
        if (storeId)
            filter.storeId = storeId;
        if (creatorId)
            filter.creatorId = creatorId;
        if (minPrice || maxPrice) {
            filter['askingPrice.amount'] = {};
            if (minPrice)
                filter['askingPrice.amount'].$gte = minPrice;
            if (maxPrice)
                filter['askingPrice.amount'].$lte = maxPrice;
        }
        if (search) {
            filter.$or = [
                { itemName: { $regex: new RegExp(search, 'i') } },
                { description: { $regex: new RegExp(search, 'i') } },
                { 'tags': { $regex: new RegExp(search, 'i') } },
            ];
        }
        const skip = ((page || 1) - 1) * (perPage || 20);
        const sortObj = {};
        if (sort) {
            const [field, dir] = sort.split(':');
            sortObj[field] = dir === 'asc' ? 1 : -1;
        }
        else {
            sortObj.createdAt = -1;
        }
        const [items, total] = await Promise.all([
            this.listingModel
                .find(filter)
                .populate('storeId', 'name slug logo phoneNumber whatsappNumber location isVerified isSuperVerified')
                .populate('creatorId', 'username slug profileImageUrl isVerified phoneNumber whatsappNumber website location totalFollowers')
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
    async findPending(queryDto) {
        return this.findAll({
            ...queryDto,
            status: contants_1.ListingStatus.InReview,
        });
    }
    async sellerCounterOffer(listingId, userId, counterOffer) {
        const listing = await this.verifyOwnership(listingId, userId);
        if (listing.type !== contants_1.ListingType.DirectPurchase) {
            throw new common_1.BadRequestException('Counter-offer only applies to direct purchase listings');
        }
        if (listing.status !== contants_1.ListingStatus.PriceOffered) {
            throw new common_1.BadRequestException(`Cannot counter-offer on a listing with status "${listing.status}". ` +
                `Listing must be in "price_offered" status.`);
        }
        listing.counterOffer = counterOffer;
        listing.status = contants_1.ListingStatus.CounterOffer;
        return listing.save();
    }
    async sellerAcceptOffer(listingId, userId) {
        const listing = await this.verifyOwnership(listingId, userId);
        if (listing.type !== contants_1.ListingType.DirectPurchase) {
            throw new common_1.BadRequestException('Accept offer only applies to direct purchase listings');
        }
        if (listing.status !== contants_1.ListingStatus.PriceOffered) {
            throw new common_1.BadRequestException(`Cannot accept offer on a listing with status "${listing.status}"`);
        }
        listing.status = contants_1.ListingStatus.AwaitingProduct;
        return listing.save();
    }
    async sellerRejectOffer(listingId, userId) {
        const listing = await this.verifyOwnership(listingId, userId);
        if (listing.status !== contants_1.ListingStatus.PriceOffered) {
            throw new common_1.BadRequestException(`Cannot reject offer on a listing with status "${listing.status}"`);
        }
        listing.status = contants_1.ListingStatus.Rejected;
        listing.reviewInfo = {
            rejectionReason: 'Seller rejected the platform offer.',
            reviewedAt: new Date(),
        };
        return listing.save();
    }
    async confirmFeePaid(listingId, adminId) {
        const listing = await this.listingModel.findById(listingId).exec();
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (listing.type !== contants_1.ListingType.SelfListing) {
            throw new common_1.BadRequestException('Fee confirmation only applies to self-listings');
        }
        if (listing.status !== contants_1.ListingStatus.AwaitingFee) {
            throw new common_1.BadRequestException(`Cannot confirm fee for listing with status "${listing.status}"`);
        }
        listing.listingFeeStatus = 'paid';
        listing.status = contants_1.ListingStatus.Live;
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
    async sellerDelist(listingId, userId) {
        const listing = await this.verifyOwnership(listingId, userId);
        if (listing.status !== contants_1.ListingStatus.Live) {
            throw new common_1.BadRequestException('Can only delist live listings');
        }
        listing.status = contants_1.ListingStatus.Delisted;
        return listing.save();
    }
    async countListings(filter = {}) {
        return this.listingModel.countDocuments(filter).exec();
    }
};
exports.ListingsService = ListingsService;
exports.ListingsService = ListingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(listing_schema_1.Listing.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        stores_service_1.StoresService,
        creators_service_1.CreatorsService,
        notifications_service_1.NotificationsService,
        platform_settings_service_1.PlatformSettingsService,
        alerts_service_1.AlertsService])
], ListingsService);
//# sourceMappingURL=listings.service.js.map