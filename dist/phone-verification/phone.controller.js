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
exports.PhoneController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../common/decorators/get-user.decorator");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const phone_service_1 = require("./phone.service");
const phone_dto_1 = require("./dto/phone.dto");
let PhoneController = class PhoneController {
    constructor(phoneService) {
        this.phoneService = phoneService;
    }
    async requestOtp(user, dto) {
        return this.phoneService.requestOtp(user.sub, dto.phoneNumber);
    }
    async verifyOtp(user, dto) {
        return this.phoneService.verifyOtp(user.sub, dto.phoneNumber, dto.code);
    }
};
exports.PhoneController = PhoneController;
__decorate([
    (0, common_1.Post)('request-otp'),
    (0, response_message_decorator_1.ResponseMessage)('Verification code sent'),
    (0, swagger_1.ApiOperation)({
        summary: 'Request an SMS OTP to verify the current user\'s phone number',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'OTP sent' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid number or already in use' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Phone verification not configured' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, phone_dto_1.RequestPhoneOtpDto]),
    __metadata("design:returntype", Promise)
], PhoneController.prototype, "requestOtp", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    (0, response_message_decorator_1.ResponseMessage)('Phone number verified'),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify the SMS OTP and (once per phone) grant the welcome credit',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Phone verified' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid code or number in use' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, phone_dto_1.VerifyPhoneOtpDto]),
    __metadata("design:returntype", Promise)
], PhoneController.prototype, "verifyOtp", null);
exports.PhoneController = PhoneController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth/phone'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [phone_service_1.PhoneService])
], PhoneController);
//# sourceMappingURL=phone.controller.js.map