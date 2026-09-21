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
var PhoneService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const users_service_1 = require("../users/users.service");
const platform_settings_service_1 = require("../platform-settings/platform-settings.service");
const wallet_service_1 = require("../wallet/wallet.service");
const wallet_transaction_schema_1 = require("../wallet/schemas/wallet-transaction.schema");
const phone_registry_schema_1 = require("./schemas/phone-registry.schema");
const sms_verification_provider_1 = require("./sms-verification.provider");
const phone_util_1 = require("./phone.util");
let PhoneService = PhoneService_1 = class PhoneService {
    constructor(smsProvider, phoneRegistryModel, usersService, platformSettingsService, walletService) {
        this.smsProvider = smsProvider;
        this.phoneRegistryModel = phoneRegistryModel;
        this.usersService = usersService;
        this.platformSettingsService = platformSettingsService;
        this.walletService = walletService;
        this.logger = new common_1.Logger(PhoneService_1.name);
    }
    async requestOtp(userId, rawPhoneNumber) {
        const phoneE164 = (0, phone_util_1.normalizeNigerianPhone)(rawPhoneNumber);
        const owner = await this.usersService.findVerifiedByPhoneE164(phoneE164);
        if (owner && owner._id.toString() !== userId) {
            throw new common_1.BadRequestException('This phone number is already in use');
        }
        await this.smsProvider.sendCode(phoneE164);
        return { sent: true };
    }
    async verifyOtp(userId, rawPhoneNumber, code) {
        const phoneE164 = (0, phone_util_1.normalizeNigerianPhone)(rawPhoneNumber);
        const owner = await this.usersService.findVerifiedByPhoneE164(phoneE164);
        if (owner && owner._id.toString() !== userId) {
            throw new common_1.BadRequestException('This phone number is already in use');
        }
        const approved = await this.smsProvider.checkCode(phoneE164, code);
        if (!approved) {
            throw new common_1.BadRequestException('Invalid or expired verification code');
        }
        await this.usersService.setPhoneVerified(userId, phoneE164);
        const registry = await this.phoneRegistryModel
            .findOneAndUpdate({ phoneE164 }, { $setOnInsert: { phoneE164, firstUserId: new mongoose_2.Types.ObjectId(userId) } }, { upsert: true, new: true, setDefaultsOnInsert: true })
            .exec();
        const welcomeGranted = await this.maybeGrantWelcomeCredit(userId, phoneE164, registry);
        return { verified: true, welcomeGranted };
    }
    async maybeGrantWelcomeCredit(userId, phoneE164, registry) {
        if (registry.welcomeGranted)
            return false;
        const settings = await this.platformSettingsService.getSettings();
        const amount = settings.welcomeCreditAmount ?? 0;
        if (amount <= 0)
            return false;
        await this.walletService.credit({
            userId,
            amount,
            bucket: wallet_transaction_schema_1.WalletBucket.Promo,
            type: wallet_transaction_schema_1.WalletTxnType.SignupCredit,
            description: 'Welcome credit',
            idempotencyKey: `welcome:${phoneE164}`,
        });
        const res = await this.phoneRegistryModel
            .updateOne({ phoneE164, welcomeGranted: false }, { $set: { welcomeGranted: true } })
            .exec();
        return res.modifiedCount === 1;
    }
};
exports.PhoneService = PhoneService;
exports.PhoneService = PhoneService = PhoneService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sms_verification_provider_1.SMS_VERIFICATION_PROVIDER)),
    __param(1, (0, mongoose_1.InjectModel)(phone_registry_schema_1.PhoneRegistry.name)),
    __metadata("design:paramtypes", [Object, mongoose_2.Model,
        users_service_1.UsersService,
        platform_settings_service_1.PlatformSettingsService,
        wallet_service_1.WalletService])
], PhoneService);
//# sourceMappingURL=phone.service.js.map