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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
const users_service_1 = require("../users/users.service");
const contants_1 = require("../config/contants");
const notifications_service_1 = require("../notifications/notifications.service");
const alerts_service_1 = require("../alerts/alerts.service");
const contants_2 = require("../config/contants");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, notificationsService, alertsService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.notificationsService = notificationsService;
        this.alertsService = alertsService;
        this.tokenBlacklist = new Set();
    }
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    generateToken(user) {
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        };
        return this.jwtService.sign(payload);
    }
    buildAuthResponse(user) {
        const token = this.generateToken(user);
        const { password, verificationCode, verificationExpires, ...userData } = user.toObject();
        return {
            token,
            ...userData,
        };
    }
    async register(registerDto) {
        const otp = this.generateOTP();
        const verificationExpires = new Date();
        verificationExpires.setMinutes(verificationExpires.getMinutes() + 10);
        const user = await this.usersService.create({
            ...registerDto,
            authProvider: contants_1.AuthProvider.Local,
            verificationCode: otp,
            verificationExpires,
        });
        if (!user) {
            throw new common_1.InternalServerErrorException('Failed to create user');
        }
        this.notificationsService.sendVerificationOtp(user.email, registerDto.firstName, otp);
        const { password, verificationCode, verificationExpires: vExp, ...userData } = user.toObject();
        return userData;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.authProvider === contants_1.AuthProvider.Google) {
            throw new common_1.UnauthorizedException('This account uses Google sign-in. Please login with Google.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isEmailVerified) {
            const otp = this.generateOTP();
            const verificationExpires = new Date();
            verificationExpires.setMinutes(verificationExpires.getMinutes() + 10);
            await this.usersService.updateInternal(user._id.toString(), {
                verificationCode: otp,
                verificationExpires,
            });
            this.notificationsService.sendVerificationOtp(user.email, user.firstName, otp);
            const { password: pw, verificationCode, verificationExpires: vExp, ...userData } = user.toObject();
            return {
                ...userData,
                isEmailVerified: false,
                requiresVerification: true,
            };
        }
        return this.buildAuthResponse(user);
    }
    async googleAuth(googleToken) {
        try {
            const tokenResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${googleToken}`);
            const tokenData = await tokenResponse.json();
            if (tokenData.error) {
                throw new common_1.UnauthorizedException('Invalid Google token');
            }
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${googleToken}` } });
            const userInfo = await userInfoResponse.json();
            return this.validateOrCreateGoogleUser({
                email: tokenData.email || userInfo.email,
                firstName: userInfo.given_name ||
                    userInfo.name?.split(' ')[0] ||
                    tokenData.email.split('@')[0],
                lastName: userInfo.family_name ||
                    userInfo.name?.split(' ').slice(1).join(' ') ||
                    null,
                avatar: userInfo.picture || null,
            });
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException)
                throw error;
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
    }
    async validateOrCreateGoogleUser(googleUser) {
        let user = await this.usersService.findByEmail(googleUser.email);
        if (!user) {
            user = await this.usersService.create({
                email: googleUser.email,
                firstName: googleUser.firstName,
                lastName: googleUser.lastName || googleUser.firstName,
                avatar: googleUser.avatar,
                authProvider: contants_1.AuthProvider.Google,
                isEmailVerified: true,
            });
        }
        return this.buildAuthResponse(user);
    }
    async verifyEmail(verifyEmailDto) {
        const { email, otp } = verifyEmailDto;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isEmailVerified) {
            throw new common_1.BadRequestException('Email is already verified');
        }
        if (user.verificationCode !== otp) {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        if (user.verificationExpires < new Date()) {
            throw new common_1.BadRequestException('Verification code has expired');
        }
        await this.usersService.updateInternal(user._id.toString(), {
            isEmailVerified: true,
            verificationCode: null,
            verificationExpires: null,
        });
        this.notificationsService.sendWelcome(user.email, user.firstName);
        this.alertsService.createAlert({
            userId: user._id,
            type: contants_2.AlertType.Welcome,
            title: 'Welcome to Odogwu Gadget Store! 🎉',
            message: `Hi ${user.firstName}, welcome! Browse our laptops, phones and accessories — and reach out any time if you need help choosing.`,
            entityType: 'user',
            entityId: user._id,
        }).catch(() => { });
        return { message: 'Email verified successfully' };
    }
    async resendVerification(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isEmailVerified) {
            throw new common_1.BadRequestException('Email is already verified');
        }
        const otp = this.generateOTP();
        const verificationExpires = new Date();
        verificationExpires.setMinutes(verificationExpires.getMinutes() + 10);
        await this.usersService.updateInternal(user._id.toString(), {
            verificationCode: otp,
            verificationExpires,
        });
        this.notificationsService.sendVerificationOtp(email, user.firstName, otp);
        return { message: 'Verification code sent' };
    }
    async forgotPassword(forgotPasswordDto) {
        const user = await this.usersService.findByEmail(forgotPasswordDto.email);
        if (user) {
            const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
            const resetExpires = new Date();
            resetExpires.setHours(resetExpires.getHours() + 1);
            const hashedToken = await bcrypt.hash(resetToken, 10);
            await this.usersService.updateInternal(user._id.toString(), {
                passwordResetToken: hashedToken,
                passwordResetExpires: resetExpires,
            });
            this.notificationsService.sendPasswordReset(user.email, user.firstName, resetToken);
        }
        return { message: 'If an account exists, a reset email has been sent' };
    }
    async resetPassword(resetPasswordDto) {
        const { token, newPassword } = resetPasswordDto;
        const user = await this.usersService.findByResetToken(token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updateInternal(user._id.toString(), {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
        });
        return { message: 'Password reset successfully' };
    }
    async logout(token) {
        if (token) {
            this.tokenBlacklist.add(token);
        }
        return { message: 'Logged out successfully' };
    }
    isTokenBlacklisted(token) {
        return this.tokenBlacklist.has(token);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService,
        alerts_service_1.AlertsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map