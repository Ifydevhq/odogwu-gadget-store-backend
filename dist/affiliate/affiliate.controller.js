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
exports.AffiliateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../common/decorators/get-user.decorator");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const affiliate_service_1 = require("./affiliate.service");
let AffiliateController = class AffiliateController {
    constructor(affiliateService) {
        this.affiliateService = affiliateService;
    }
    async join(userId) {
        return this.affiliateService.join(userId);
    }
    async getSummary(userId) {
        return this.affiliateService.getSummary(userId);
    }
    async listCommissions(userId, paging) {
        return this.affiliateService.listCommissions(userId, paging);
    }
    async getLink(userId, listingId) {
        if (!listingId) {
            throw new common_1.BadRequestException('listingId is required');
        }
        try {
            return await this.affiliateService.getLink(userId, listingId);
        }
        catch (err) {
            throw new common_1.BadRequestException(err?.message || 'Could not generate link');
        }
    }
    async listProducts(paging) {
        return this.affiliateService.listAffiliateProducts(paging);
    }
};
exports.AffiliateController = AffiliateController;
__decorate([
    (0, common_1.Post)('join'),
    (0, swagger_1.ApiOperation)({ summary: 'Join the affiliate program' }),
    (0, response_message_decorator_1.ResponseMessage)('You are now an affiliate'),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AffiliateController.prototype, "join", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my affiliate balances and status' }),
    (0, response_message_decorator_1.ResponseMessage)('Affiliate summary retrieved successfully'),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AffiliateController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('commissions'),
    (0, swagger_1.ApiOperation)({ summary: 'List my affiliate commissions (paginated)' }),
    (0, response_message_decorator_1.ResponseMessage)('Commissions retrieved successfully'),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AffiliateController.prototype, "listCommissions", null);
__decorate([
    (0, common_1.Get)('link'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my affiliate link for a product' }),
    (0, swagger_1.ApiQuery)({ name: 'listingId', required: true }),
    (0, response_message_decorator_1.ResponseMessage)('Affiliate link generated'),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __param(1, (0, common_1.Query)('listingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AffiliateController.prototype, "getLink", null);
__decorate([
    (0, common_1.Get)('products'),
    (0, swagger_1.ApiOperation)({ summary: 'List affiliate-enabled products (paginated)' }),
    (0, response_message_decorator_1.ResponseMessage)('Affiliate products retrieved successfully'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AffiliateController.prototype, "listProducts", null);
exports.AffiliateController = AffiliateController = __decorate([
    (0, swagger_1.ApiTags)('Affiliate'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('affiliate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [affiliate_service_1.AffiliateService])
], AffiliateController);
//# sourceMappingURL=affiliate.controller.js.map