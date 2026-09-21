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
exports.UserSchema = exports.User = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const class_transformer_1 = require("class-transformer");
const contants_1 = require("../../config/contants");
const base_schema_1 = require("../../common/schemas/base-schema");
class Mobile {
}
class PushToken {
}
let User = class User extends base_schema_1.BaseSchema {
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, select: false }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            phoneNumber: { type: String },
            isoCode: { type: String, default: 'NG' },
        },
        default: null,
    }),
    __metadata("design:type", Mobile)
], User.prototype, "mobile", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(contants_1.UserRole),
        default: contants_1.UserRole.User,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(contants_1.AuthProvider),
        default: contants_1.AuthProvider.Local,
    }),
    __metadata("design:type", String)
], User.prototype, "authProvider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isEmailVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isSuspended", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isPhoneVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, index: true }),
    __metadata("design:type", String)
], User.prototype, "phoneE164", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], User.prototype, "phoneVerifiedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, unique: true, sparse: true, index: true }),
    __metadata("design:type", String)
], User.prototype, "referralCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', default: null, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], User.prototype, "referredBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isAffiliate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['male', 'female', 'other', 'prefer_not_to_say'] }),
    __metadata("design:type", String)
], User.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "dateOfBirth", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "country", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "state", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "verificationCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, select: false }),
    __metadata("design:type", Date)
], User.prototype, "verificationExpires", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            emailNotifications: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: true },
            orderUpdates: { type: Boolean, default: true },
            promotions: { type: Boolean, default: false },
        },
        default: {
            emailNotifications: true,
            pushNotifications: true,
            orderUpdates: true,
            promotions: false,
        },
    }),
    __metadata("design:type", Object)
], User.prototype, "notificationPreferences", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                token: { type: String, required: true },
                platform: { type: String, default: 'web' },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], User.prototype, "pushTokens", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "passwordResetToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, select: false }),
    __metadata("design:type", Date)
], User.prototype, "passwordResetExpires", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                bankName: { type: String, required: true },
                bankCode: { type: String, required: true },
                accountNumber: { type: String, required: true },
                accountName: { type: String, required: true },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], User.prototype, "savedBankAccounts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "withdrawalOtpHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, select: false }),
    __metadata("design:type", Date)
], User.prototype, "withdrawalOtpExpires", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, select: false, default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "withdrawalOtpAttempts", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: (_, ret) => {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.index({ email: 1 }, { unique: true });
exports.UserSchema.index({ role: 1 });
exports.UserSchema.index({ phoneE164: 1 });
exports.UserSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
//# sourceMappingURL=user.schema.js.map