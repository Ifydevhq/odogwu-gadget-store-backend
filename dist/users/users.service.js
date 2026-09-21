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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
const contants_1 = require("../config/contants");
const user_schema_1 = require("./schemas/user.schema");
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(createUserDto) {
        const { email, password, authProvider } = createUserDto;
        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashedPassword = authProvider !== contants_1.AuthProvider.Google && password
            ? await bcrypt.hash(password, 10)
            : undefined;
        const user = new this.userModel({
            ...createUserDto,
            password: hashedPassword,
            referralCode: await this.generateUniqueReferralCode(),
        });
        return user.save();
    }
    generateReferralCode(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let out = '';
        for (let i = 0; i < length; i++) {
            out += chars[Math.floor(Math.random() * chars.length)];
        }
        return out;
    }
    async generateUniqueReferralCode() {
        for (let i = 0; i < 10; i++) {
            const code = this.generateReferralCode();
            const exists = await this.userModel.exists({ referralCode: code }).exec();
            if (!exists)
                return code;
        }
        return this.generateReferralCode(10);
    }
    async findByReferralCode(code) {
        if (!code)
            return null;
        return this.userModel
            .findOne({ referralCode: code.trim().toUpperCase() })
            .exec();
    }
    async ensureReferralCode(user) {
        if (user.referralCode)
            return user;
        user.referralCode = await this.generateUniqueReferralCode();
        try {
            await user.save();
        }
        catch {
            const fresh = await this.userModel.findById(user._id).exec();
            if (fresh?.referralCode)
                user.referralCode = fresh.referralCode;
        }
        return user;
    }
    async findById(id) {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.referralCode) {
            await this.ensureReferralCode(user);
        }
        return user;
    }
    async findByEmail(email) {
        return this.userModel
            .findOne({ email: email.toLowerCase() })
            .select('+password +verificationCode +verificationExpires')
            .exec();
    }
    async getProfile(userId) {
        return this.findById(userId);
    }
    async updateProfile(userId, updateDto) {
        const user = await this.userModel
            .findByIdAndUpdate(userId, { $set: updateDto }, { new: true, runValidators: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateInternal(userId, update) {
        const user = await this.userModel
            .findByIdAndUpdate(userId, { $set: update }, { new: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByResetToken(token) {
        const users = await this.userModel
            .find({
            passwordResetToken: { $ne: null },
            passwordResetExpires: { $gt: new Date() },
        })
            .select('+passwordResetToken +passwordResetExpires')
            .exec();
        for (const user of users) {
            const isMatch = await bcrypt.compare(token, user.passwordResetToken);
            if (isMatch)
                return user;
        }
        return null;
    }
    async countUsers(filter = {}) {
        return this.userModel.countDocuments(filter).exec();
    }
    async findVerifiedByPhoneE164(phoneE164) {
        return this.userModel
            .findOne({ phoneE164, isPhoneVerified: true })
            .exec();
    }
    async setPhoneVerified(userId, phoneE164) {
        const user = await this.userModel
            .findByIdAndUpdate(userId, {
            $set: {
                isPhoneVerified: true,
                phoneE164,
                phoneVerifiedAt: new Date(),
                mobile: { phoneNumber: phoneE164, isoCode: 'NG' },
            },
        }, { new: true, runValidators: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async isRewardEligible(userId) {
        const user = await this.userModel
            .findById(userId)
            .select('isPhoneVerified')
            .exec();
        return user?.isPhoneVerified === true;
    }
    async deleteAccount(userId, password) {
        const user = await this.userModel
            .findById(userId)
            .select('+password')
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.authProvider === contants_1.AuthProvider.Google) {
            throw new common_1.BadRequestException('Google accounts cannot be deleted with a password. Please contact support.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid password');
        }
        await this.userModel
            .findByIdAndUpdate(userId, {
            $set: { isDeleted: true, deletedAt: new Date() },
        })
            .exec();
    }
    async changePassword(userId, changePasswordDto) {
        const { currentPassword, newPassword } = changePasswordDto;
        const user = await this.userModel
            .findById(userId)
            .select('+password')
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.authProvider === contants_1.AuthProvider.Google) {
            throw new common_1.BadRequestException('Google accounts do not have a password to change. Please use Google sign-in.');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.userModel
            .findByIdAndUpdate(userId, { $set: { password: hashedPassword } })
            .exec();
    }
    async updateNotificationPreferences(userId, updateDto) {
        const setFields = {};
        for (const [key, value] of Object.entries(updateDto)) {
            if (value !== undefined) {
                setFields[`notificationPreferences.${key}`] = value;
            }
        }
        const user = await this.userModel
            .findByIdAndUpdate(userId, { $set: setFields }, { new: true, runValidators: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async addPushToken(userId, token, platform) {
        await this.userModel
            .updateOne({ _id: userId }, { $pull: { pushTokens: { token } } })
            .exec();
        const user = await this.userModel
            .findByIdAndUpdate(userId, {
            $push: {
                pushTokens: { token, platform, updatedAt: new Date() },
            },
        }, { new: true, runValidators: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async removePushToken(userId, token) {
        const user = await this.userModel
            .findByIdAndUpdate(userId, { $pull: { pushTokens: { token } } }, { new: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map