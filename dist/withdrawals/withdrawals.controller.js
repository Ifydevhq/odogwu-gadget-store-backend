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
exports.AdminWithdrawalsController = exports.WithdrawalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const get_user_decorator_1 = require("../common/decorators/get-user.decorator");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const contants_1 = require("../config/contants");
const withdrawals_service_1 = require("./withdrawals.service");
const create_withdrawal_dto_1 = require("./dto/create-withdrawal.dto");
const process_withdrawal_dto_1 = require("./dto/process-withdrawal.dto");
const query_withdrawals_dto_1 = require("./dto/query-withdrawals.dto");
let WithdrawalsController = class WithdrawalsController {
    constructor(withdrawalsService) {
        this.withdrawalsService = withdrawalsService;
    }
    async request(userId, dto) {
        return this.withdrawalsService.request(userId, dto);
    }
    async listMine(userId, dto) {
        return this.withdrawalsService.listMine(userId, dto);
    }
};
exports.WithdrawalsController = WithdrawalsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Request a withdrawal of available earned wallet balance',
    }),
    (0, response_message_decorator_1.ResponseMessage)('Withdrawal request submitted successfully'),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_withdrawal_dto_1.CreateWithdrawalDto]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "request", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List the current user withdrawal requests' }),
    (0, response_message_decorator_1.ResponseMessage)('Withdrawal requests retrieved successfully'),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_withdrawals_dto_1.QueryWithdrawalsDto]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "listMine", null);
exports.WithdrawalsController = WithdrawalsController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('wallet/withdrawals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [withdrawals_service_1.WithdrawalsService])
], WithdrawalsController);
let AdminWithdrawalsController = class AdminWithdrawalsController {
    constructor(withdrawalsService) {
        this.withdrawalsService = withdrawalsService;
    }
    async adminList(dto) {
        return this.withdrawalsService.adminList(dto);
    }
    async process(id, adminId, dto) {
        return this.withdrawalsService.process(id, adminId, dto);
    }
};
exports.AdminWithdrawalsController = AdminWithdrawalsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all withdrawal requests (admin)' }),
    (0, response_message_decorator_1.ResponseMessage)('Withdrawal requests retrieved successfully'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_withdrawals_dto_1.QueryWithdrawalsDto]),
    __metadata("design:returntype", Promise)
], AdminWithdrawalsController.prototype, "adminList", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Process a pending withdrawal request (mark_paid or reject)',
    }),
    (0, response_message_decorator_1.ResponseMessage)('Withdrawal request processed successfully'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, process_withdrawal_dto_1.ProcessWithdrawalDto]),
    __metadata("design:returntype", Promise)
], AdminWithdrawalsController.prototype, "process", null);
exports.AdminWithdrawalsController = AdminWithdrawalsController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('admin/withdrawals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(contants_1.UserRole.Admin, contants_1.UserRole.SuperAdmin),
    __metadata("design:paramtypes", [withdrawals_service_1.WithdrawalsService])
], AdminWithdrawalsController);
//# sourceMappingURL=withdrawals.controller.js.map