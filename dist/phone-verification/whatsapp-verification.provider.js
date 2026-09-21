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
var WhatsAppVerificationProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppVerificationProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const axios_1 = require("axios");
const otp_challenge_schema_1 = require("./schemas/otp-challenge.schema");
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
let WhatsAppVerificationProvider = WhatsAppVerificationProvider_1 = class WhatsAppVerificationProvider {
    constructor(config, otpModel) {
        this.config = config;
        this.otpModel = otpModel;
        this.logger = new common_1.Logger(WhatsAppVerificationProvider_1.name);
        this.token = this.config.get('app.whatsapp.cloudToken') || null;
        this.phoneNumberId =
            this.config.get('app.whatsapp.phoneNumberId') || null;
        this.apiVersion =
            this.config.get('app.whatsapp.apiVersion') || 'v21.0';
        this.templateName =
            this.config.get('WHATSAPP_OTP_TEMPLATE') || 'otp_verification';
        this.lang = this.config.get('WHATSAPP_OTP_LANG') || 'en_US';
        this.includeButton =
            (this.config.get('WHATSAPP_OTP_INCLUDE_BUTTON') ?? 'true') !==
                'false';
        this.pepper = this.config.get('JWT_SECRET') || 'otp-pepper';
        this.enabled = !!(this.token && this.phoneNumberId);
        this.logger.log(this.enabled
            ? `Phone verification enabled (WhatsApp OTP, template=${this.templateName})`
            : 'Phone verification via WhatsApp disabled: WhatsApp Cloud API not configured');
    }
    hash(code, phoneE164) {
        return (0, crypto_1.createHash)('sha256')
            .update(`${code}:${phoneE164}:${this.pepper}`)
            .digest('hex');
    }
    async sendCode(phoneE164) {
        if (!this.enabled) {
            throw new common_1.ServiceUnavailableException('Phone verification is not configured');
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.otpModel
            .findOneAndUpdate({ phoneE164 }, {
            phoneE164,
            codeHash: this.hash(code, phoneE164),
            expiresAt: new Date(Date.now() + CODE_TTL_MS),
            attempts: 0,
        }, { upsert: true, setDefaultsOnInsert: true })
            .exec();
        await this.deliver(phoneE164, code);
    }
    async deliver(phoneE164, code) {
        const to = phoneE164.replace(/^\+/, '');
        const components = [
            { type: 'body', parameters: [{ type: 'text', text: code }] },
        ];
        if (this.includeButton) {
            components.push({
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: code }],
            });
        }
        try {
            await axios_1.default.post(`https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                to,
                type: 'template',
                template: {
                    name: this.templateName,
                    language: { code: this.lang },
                    components,
                },
            }, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            });
        }
        catch (err) {
            const detail = err?.response?.data
                ? JSON.stringify(err.response.data)
                : err?.message;
            this.logger.error(`WhatsApp OTP send failed for ${phoneE164}: ${detail}`);
            throw new common_1.ServiceUnavailableException('Could not send the verification code. Please try again.');
        }
    }
    async checkCode(phoneE164, code) {
        if (!this.enabled)
            return false;
        const challenge = await this.otpModel.findOne({ phoneE164 }).exec();
        if (!challenge)
            return false;
        if (challenge.expiresAt.getTime() < Date.now()) {
            await this.otpModel.deleteOne({ _id: challenge._id }).exec();
            return false;
        }
        if (challenge.attempts >= MAX_ATTEMPTS) {
            return false;
        }
        const expected = this.hash(code, phoneE164);
        const match = expected.length === challenge.codeHash.length &&
            (0, crypto_1.timingSafeEqual)(Buffer.from(expected), Buffer.from(challenge.codeHash));
        if (match) {
            await this.otpModel.deleteOne({ _id: challenge._id }).exec();
            return true;
        }
        await this.otpModel
            .updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } })
            .exec();
        return false;
    }
};
exports.WhatsAppVerificationProvider = WhatsAppVerificationProvider;
exports.WhatsAppVerificationProvider = WhatsAppVerificationProvider = WhatsAppVerificationProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(otp_challenge_schema_1.OtpChallenge.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model])
], WhatsAppVerificationProvider);
//# sourceMappingURL=whatsapp-verification.provider.js.map