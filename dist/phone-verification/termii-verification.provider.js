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
var TermiiVerificationProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermiiVerificationProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const axios_1 = require("axios");
const otp_challenge_schema_1 = require("./schemas/otp-challenge.schema");
const PIN_TTL_MIN = 10;
let TermiiVerificationProvider = TermiiVerificationProvider_1 = class TermiiVerificationProvider {
    constructor(config, otpModel) {
        this.config = config;
        this.otpModel = otpModel;
        this.logger = new common_1.Logger(TermiiVerificationProvider_1.name);
        this.apiKey = this.config.get('TERMII_API_KEY') || null;
        this.senderId = this.config.get('TERMII_SENDER_ID') || 'Odogwu';
        this.channel = this.config.get('TERMII_CHANNEL') || 'generic';
        this.baseUrl =
            this.config.get('TERMII_BASE_URL') || 'https://api.ng.termii.com';
        this.enabled = !!this.apiKey;
        this.logger.log(this.enabled
            ? `Phone verification enabled (Termii SMS, channel=${this.channel})`
            : 'Phone verification via Termii disabled: no TERMII_API_KEY');
    }
    msisdn(phoneE164) {
        return phoneE164.replace(/^\+/, '');
    }
    async sendCode(phoneE164) {
        if (!this.enabled) {
            throw new common_1.ServiceUnavailableException('Phone verification is not configured');
        }
        try {
            const { data } = await axios_1.default.post(`${this.baseUrl}/api/sms/otp/send`, {
                api_key: this.apiKey,
                message_type: 'NUMERIC',
                to: this.msisdn(phoneE164),
                from: this.senderId,
                channel: this.channel,
                pin_attempts: 5,
                pin_time_to_live: PIN_TTL_MIN,
                pin_length: 6,
                pin_placeholder: '< 1234 >',
                message_text: 'Your Odogwu Gadget Store verification code is < 1234 >. It expires in 10 minutes.',
                pin_type: 'NUMERIC',
            }, { timeout: 15000 });
            const pinId = data?.pinId || data?.pin_id;
            if (!pinId) {
                throw new Error(`Termii returned no pinId: ${JSON.stringify(data)}`);
            }
            await this.otpModel
                .findOneAndUpdate({ phoneE164 }, {
                phoneE164,
                providerRef: String(pinId),
                codeHash: null,
                expiresAt: new Date(Date.now() + PIN_TTL_MIN * 60 * 1000),
                attempts: 0,
            }, { upsert: true, setDefaultsOnInsert: true })
                .exec();
        }
        catch (err) {
            const detail = err?.response?.data
                ? JSON.stringify(err.response.data)
                : err?.message;
            this.logger.error(`Termii OTP send failed for ${phoneE164}: ${detail}`);
            throw new common_1.ServiceUnavailableException('Could not send the verification code. Please try again.');
        }
    }
    async checkCode(phoneE164, code) {
        if (!this.enabled)
            return false;
        const challenge = await this.otpModel.findOne({ phoneE164 }).exec();
        if (!challenge || !challenge.providerRef)
            return false;
        if (challenge.expiresAt.getTime() < Date.now()) {
            await this.otpModel.deleteOne({ _id: challenge._id }).exec();
            return false;
        }
        try {
            const { data } = await axios_1.default.post(`${this.baseUrl}/api/sms/otp/verify`, { api_key: this.apiKey, pin_id: challenge.providerRef, pin: code }, { timeout: 15000 });
            const verified = data?.verified === true ||
                String(data?.verified).toLowerCase() === 'true';
            if (verified) {
                await this.otpModel.deleteOne({ _id: challenge._id }).exec();
                return true;
            }
            return false;
        }
        catch (err) {
            const detail = err?.response?.data
                ? JSON.stringify(err.response.data)
                : err?.message;
            this.logger.warn(`Termii verify failed for ${phoneE164}: ${detail}`);
            return false;
        }
    }
};
exports.TermiiVerificationProvider = TermiiVerificationProvider;
exports.TermiiVerificationProvider = TermiiVerificationProvider = TermiiVerificationProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(otp_challenge_schema_1.OtpChallenge.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model])
], TermiiVerificationProvider);
//# sourceMappingURL=termii-verification.provider.js.map