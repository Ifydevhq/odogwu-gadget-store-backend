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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const response_message_decorator_1 = require("../common/decorators/response-message.decorator");
const auth_dto_1 = require("./dto/auth.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto) {
        return this.authService.register(registerDto);
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async googleAuth(googleAuthDto) {
        return this.authService.googleAuth(googleAuthDto.token);
    }
    async appleAuth(appleAuthDto) {
        return this.authService.appleAuth(appleAuthDto);
    }
    async verifyEmail(verifyEmailDto) {
        return this.authService.verifyEmail(verifyEmailDto);
    }
    async resendVerification(dto) {
        return this.authService.resendVerification(dto.email);
    }
    async forgotPassword(forgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }
    async resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }
    async logout(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        return this.authService.logout(token);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, response_message_decorator_1.ResponseMessage)('Registration successful'),
    (0, swagger_1.ApiOperation)({
        summary: 'Register a new user',
        description: 'Creates a new user account with email and password',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User registered successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, response_message_decorator_1.ResponseMessage)('Login successful'),
    (0, swagger_1.ApiOperation)({
        summary: 'Login with email and password',
        description: 'Authenticates a user and returns a JWT token',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful, token returned in meta',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('google'),
    (0, response_message_decorator_1.ResponseMessage)('Google authentication successful'),
    (0, swagger_1.ApiOperation)({
        summary: 'Login or register with Google',
        description: 'Validates a Google access token. Creates a new account if the email is new, or logs in if it exists.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Authenticated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid Google token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.GoogleAuthDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Post)('apple'),
    (0, response_message_decorator_1.ResponseMessage)('Apple authentication successful'),
    (0, swagger_1.ApiOperation)({
        summary: 'Login or register with Apple',
        description: 'Verifies an Apple identity token (JWT). Creates a new account if the email is new, or logs in if it exists. firstName/lastName are only sent by Apple on the first authorization.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Authenticated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid Apple token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.AppleAuthDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "appleAuth", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, response_message_decorator_1.ResponseMessage)('Email verified successfully'),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify email with OTP',
        description: "Confirms the user's email address using a 6-digit OTP code",
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email verified' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    (0, response_message_decorator_1.ResponseMessage)('Verification code sent'),
    (0, swagger_1.ApiOperation)({
        summary: 'Resend email verification OTP',
        description: 'Generates and sends a new verification code to the email',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Code sent' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Email already verified or user not found',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResendVerificationDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, response_message_decorator_1.ResponseMessage)('If an account exists, a reset email has been sent'),
    (0, swagger_1.ApiOperation)({
        summary: 'Request password reset',
        description: 'Sends a password reset email. Always returns success to prevent email enumeration.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Reset email sent (if account exists)',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, response_message_decorator_1.ResponseMessage)('Password reset successfully'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reset password with token',
        description: 'Resets the password using the token received via email',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, response_message_decorator_1.ResponseMessage)('Logged out successfully'),
    (0, swagger_1.ApiOperation)({
        summary: 'Logout',
        description: 'Invalidates the current JWT token',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map