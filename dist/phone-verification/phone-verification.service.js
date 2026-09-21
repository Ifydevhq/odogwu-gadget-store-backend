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
var PhoneVerificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneVerificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const twilio_1 = require("twilio");
let PhoneVerificationService = PhoneVerificationService_1 = class PhoneVerificationService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PhoneVerificationService_1.name);
        this.client = null;
        this.verifyServiceSid = null;
        const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
        const verifyServiceSid = this.configService.get('TWILIO_VERIFY_SERVICE_SID');
        if (!accountSid || !authToken || !verifyServiceSid) {
            this.enabled = false;
            this.logger.warn('Phone verification disabled: no Twilio credentials');
            return;
        }
        this.client = new twilio_1.Twilio(accountSid, authToken);
        this.verifyServiceSid = verifyServiceSid;
        this.enabled = true;
        this.logger.log('Phone verification enabled (Twilio Verify)');
    }
    async sendCode(phoneE164) {
        if (!this.enabled || !this.client || !this.verifyServiceSid) {
            throw new common_1.ServiceUnavailableException('Phone verification is not configured');
        }
        await this.client.verify.v2
            .services(this.verifyServiceSid)
            .verifications.create({ to: phoneE164, channel: 'sms' });
    }
    async checkCode(phoneE164, code) {
        if (!this.enabled || !this.client || !this.verifyServiceSid) {
            return false;
        }
        try {
            const check = await this.client.verify.v2
                .services(this.verifyServiceSid)
                .verificationChecks.create({ to: phoneE164, code });
            return check.status === 'approved';
        }
        catch (error) {
            this.logger.warn(`Twilio verificationCheck failed for ${phoneE164}: ${error?.message ?? error}`);
            return false;
        }
    }
};
exports.PhoneVerificationService = PhoneVerificationService;
exports.PhoneVerificationService = PhoneVerificationService = PhoneVerificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PhoneVerificationService);
//# sourceMappingURL=phone-verification.service.js.map