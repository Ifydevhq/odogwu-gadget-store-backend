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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../common/decorators/get-user.decorator");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const wallet_service_1 = require("./wallet.service");
const list_transactions_dto_1 = require("./dto/list-transactions.dto");
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getBalance(userId) {
        return this.walletService.getBalance(userId);
    }
    async listTransactions(userId, dto) {
        return this.walletService.listTransactions(userId, dto);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get the current user wallet balance' }),
    (0, response_message_decorator_1.ResponseMessage)('Wallet balance retrieved successfully'),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'List the current user wallet transactions (paginated)' }),
    (0, response_message_decorator_1.ResponseMessage)('Wallet transactions retrieved successfully'),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_transactions_dto_1.ListTransactionsDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "listTransactions", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map