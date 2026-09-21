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
exports.ReferralsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../common/decorators/get-user.decorator");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const referrals_service_1 = require("./referrals.service");
let ReferralsController = class ReferralsController {
    constructor(referralsService) {
        this.referralsService = referralsService;
    }
    async getMySummary(userId) {
        return this.referralsService.getMyReferralSummary(userId);
    }
    async listMyReferrals(userId, paging) {
        return this.referralsService.listMyReferrals(userId, paging);
    }
};
exports.ReferralsController = ReferralsController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my referral code, link and summary stats' }),
    (0, response_message_decorator_1.ResponseMessage)('Referral summary retrieved successfully'),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getMySummary", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List my referrals (paginated history)' }),
    (0, response_message_decorator_1.ResponseMessage)('Referrals retrieved successfully'),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "listMyReferrals", null);
exports.ReferralsController = ReferralsController = __decorate([
    (0, swagger_1.ApiTags)('Referrals'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('referrals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [referrals_service_1.ReferralsService])
], ReferralsController);
//# sourceMappingURL=referrals.controller.js.map