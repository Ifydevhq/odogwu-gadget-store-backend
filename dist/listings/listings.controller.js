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
exports.ListingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const listings_service_1 = require("./listings.service");
const listing_dto_1 = require("./dto/listing.dto");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const get_user_decorator_1 = require("../common/decorators/get-user.decorator");
const contants_1 = require("../config/contants");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let ListingsController = class ListingsController {
    constructor(listingsService) {
        this.listingsService = listingsService;
    }
    async create(user, createListingDto) {
        return this.listingsService.create(user.sub, createListingDto, user.role);
    }
    async findMyListings(user, queryDto) {
        return this.listingsService.findMyListings(user.sub, queryDto);
    }
    async update(listingId, user, updateListingDto) {
        return this.listingsService.update(listingId, user.sub, updateListingDto, user.role);
    }
    async remove(listingId, user) {
        return this.listingsService.remove(listingId, user.sub);
    }
    async counterOffer(listingId, user, counterOffer) {
        return this.listingsService.sellerCounterOffer(listingId, user.sub, counterOffer);
    }
    async acceptOffer(listingId, user) {
        return this.listingsService.sellerAcceptOffer(listingId, user.sub);
    }
    async rejectOffer(listingId, user) {
        return this.listingsService.sellerRejectOffer(listingId, user.sub);
    }
    async sellerDelist(listingId, user) {
        return this.listingsService.sellerDelist(listingId, user.sub);
    }
    async findAllAdmin(queryDto) {
        return this.listingsService.findAllAdmin(queryDto);
    }
    async findPending(queryDto) {
        return this.listingsService.findPending(queryDto);
    }
    async adminReview(listingId, user, reviewDto) {
        return this.listingsService.adminReview(listingId, user.sub, reviewDto);
    }
    async confirmFee(listingId, user) {
        return this.listingsService.confirmFeePaid(listingId, user.sub);
    }
    async findAll(queryDto) {
        return this.listingsService.findAll(queryDto);
    }
    async findByStore(storeId, queryDto) {
        return this.listingsService.findByStore(storeId, queryDto);
    }
    async findByCreator(creatorId, queryDto) {
        return this.listingsService.findByCreator(creatorId, queryDto);
    }
    async findOne(listingId) {
        return this.listingsService.findById(listingId);
    }
};
exports.ListingsController = ListingsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, response_message_decorator_1.ResponseMessage)('Listing created and submitted for review'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new listing',
        description: 'Creates a product listing under a specific store. ' +
            'Choose the selling type: self_listing, consignment, or direct_purchase. ' +
            'All listings start as pending_approval and require admin review.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Listing created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not the store owner' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, listing_dto_1.CreateListingDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get my listings',
        description: 'Returns all listings by the authenticated user across all their stores. ' +
            'Can filter by status, type, and store.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Paginated list of user's listings",
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, listing_dto_1.QueryListingsDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "findMyListings", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, response_message_decorator_1.ResponseMessage)('Listing updated successfully'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update my listing',
        description: 'Edit a listing. Only works for draft, pending, or rejected listings. ' +
            'If the listing was rejected, editing resubmits it for review.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Listing MongoDB ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listing updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot edit live/sold listings' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not the listing owner' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, listing_dto_1.UpdateListingDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, response_message_decorator_1.ResponseMessage)('Listing deleted successfully'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete my listing',
        description: 'Soft deletes a listing. Cannot delete sold listings.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Listing MongoDB ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listing deleted' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot delete sold listings' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/counter-offer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, response_message_decorator_1.ResponseMessage)('Counter-offer submitted'),
    (0, swagger_1.ApiOperation)({
        summary: 'Submit counter-offer (direct purchase)',
        description: 'When the platform has made a price offer on your direct-purchase listing, ' +
            'you can submit a counter-offer.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Listing MongoDB ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)('counterOffer')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "counterOffer", null);
__decorate([
    (0, common_1.Post)(':id/accept-offer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, response_message_decorator_1.ResponseMessage)('Offer accepted'),
    (0, swagger_1.ApiOperation)({
        summary: 'Accept platform offer (direct purchase)',
        description: "Accept the platform's bid for your direct-purchase listing.",
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Listing MongoDB ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "acceptOffer", null);
__decorate([
    (0, common_1.Post)(':id/reject-offer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, response_message_decorator_1.ResponseMessage)('Offer rejected'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reject platform offer (direct purchase)',
        description: "Reject the platform's bid outright.",
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Listing MongoDB ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "rejectOffer", null);
__decorate([
    (0, common_1.Post)(':id/delist'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, response_message_decorator_1.ResponseMessage)('Listing delisted'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delist my listing',
        description: 'Voluntarily remove your live listing from the marketplace.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Listing MongoDB ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "sellerDelist", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(contants_1.UserRole.Admin, contants_1.UserRole.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({
        summary: '[Admin] List all listings',
        description: 'Returns all listings regardless of status. Supports filtering ' +
            'by status, type, condition, category, and text search.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of all listings',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [listing_dto_1.QueryListingsDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "findAllAdmin", null);
__decorate([
    (0, common_1.Get)('admin/pending'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(contants_1.UserRole.Admin, contants_1.UserRole.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({
        summary: '[Admin] Get pending listings',
        description: 'Returns all listings waiting for admin review',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of pending listings',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [listing_dto_1.QueryListingsDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "findPending", null);
__decorate([
    (0, common_1.Patch)('admin/:id/review'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(contants_1.UserRole.Admin, contants_1.UserRole.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, response_message_decorator_1.ResponseMessage)('Listing review action completed'),
    (0, swagger_1.ApiOperation)({
        summary: '[Admin] Review a listing',
        description: 'Full lifecycle management. Actions: approve, reject, suspend, reinstate, delist, ' +
            'make_offer (direct purchase bid), accept_counter, reject_counter, ' +
            'mark_awaiting_fee, mark_awaiting_product, mark_live.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Listing MongoDB ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Review action completed' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid action or missing required fields',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, listing_dto_1.AdminReviewListingDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "adminReview", null);
__decorate([
    (0, common_1.Post)('admin/:id/confirm-fee'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(contants_1.UserRole.Admin, contants_1.UserRole.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, response_message_decorator_1.ResponseMessage)('Listing fee confirmed — item is now live'),
    (0, swagger_1.ApiOperation)({
        summary: '[Admin] Confirm listing fee payment',
        description: 'Marks the listing fee as paid for a self-listing item. ' +
            'Moves the listing from awaiting_fee to live.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Listing MongoDB ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "confirmFee", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Browse marketplace listings',
        description: 'The main marketplace feed. Only shows live listings. ' +
            'Supports filtering by type, category, condition, price range, ' +
            'and a buyableOnly flag for items that can be purchased on platform.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated marketplace feed' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [listing_dto_1.QueryListingsDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('store/:storeId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get listings by store',
        description: 'Returns all live listings in a specific store',
    }),
    (0, swagger_1.ApiParam)({ name: 'storeId', description: 'Store MongoDB ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated store listings' }),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, listing_dto_1.QueryListingsDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "findByStore", null);
__decorate([
    (0, common_1.Get)('creator/:creatorId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get listings by creator',
        description: 'Returns all live listings by a creator across ALL their stores. ' +
            "This is the aggregated view shown on the creator's profile page.",
    }),
    (0, swagger_1.ApiParam)({ name: 'creatorId', description: 'Creator MongoDB ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated creator listings' }),
    __param(0, (0, common_1.Param)('creatorId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, listing_dto_1.QueryListingsDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "findByCreator", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get listing details',
        description: 'Returns full listing details including store and creator info. ' +
            'Also increments the view counter.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Listing MongoDB ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Listing details with isBuyable computed field',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Listing not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "findOne", null);
exports.ListingsController = ListingsController = __decorate([
    (0, swagger_1.ApiTags)('listings'),
    (0, common_1.Controller)('listings'),
    __metadata("design:paramtypes", [listings_service_1.ListingsService])
], ListingsController);
//# sourceMappingURL=listings.controller.js.map