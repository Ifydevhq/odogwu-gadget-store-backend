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
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const user_schema_1 = require("../users/schemas/user.schema");
let PushService = PushService_1 = class PushService {
    constructor(userModel) {
        this.userModel = userModel;
        this.logger = new common_1.Logger(PushService_1.name);
        this.enabled = false;
        this.init();
    }
    init() {
        try {
            if ((0, app_1.getApps)().length > 0) {
                this.enabled = true;
                return;
            }
            const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
            const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
            const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            let credential = null;
            if (rawJson) {
                credential = (0, app_1.cert)(JSON.parse(rawJson));
            }
            else if (base64) {
                const decoded = Buffer.from(base64, 'base64').toString('utf8');
                credential = (0, app_1.cert)(JSON.parse(decoded));
            }
            else if (credsPath) {
                credential = (0, app_1.applicationDefault)();
            }
            if (!credential) {
                this.logger.warn('Push disabled: no Firebase credentials');
                this.enabled = false;
                return;
            }
            (0, app_1.initializeApp)({ credential });
            this.enabled = true;
            this.logger.log('Push enabled: firebase-admin initialised');
        }
        catch (err) {
            this.logger.warn(`Push disabled: no Firebase credentials (init failed: ${err.message})`);
            this.enabled = false;
        }
    }
    isEnabled() {
        return this.enabled;
    }
    async sendToTokens(tokens, payload) {
        const empty = {
            successCount: 0,
            failureCount: 0,
            invalidTokens: [],
        };
        if (!this.enabled || !tokens || tokens.length === 0) {
            return empty;
        }
        const uniqueTokens = [...new Set(tokens)];
        try {
            const message = {
                tokens: uniqueTokens,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
                },
                ...(payload.data ? { data: payload.data } : {}),
            };
            const response = await (0, messaging_1.getMessaging)().sendEachForMulticast(message);
            const invalidTokens = [];
            response.responses.forEach((res, idx) => {
                if (!res.success) {
                    const code = res.error?.code || '';
                    if (code === 'messaging/registration-token-not-registered' ||
                        code === 'messaging/invalid-argument' ||
                        code === 'messaging/invalid-registration-token') {
                        invalidTokens.push(uniqueTokens[idx]);
                    }
                }
            });
            return {
                successCount: response.successCount,
                failureCount: response.failureCount,
                invalidTokens,
            };
        }
        catch (err) {
            this.logger.error(`sendToTokens failed: ${err.message}`);
            return empty;
        }
    }
    async sendToUsers(userIds, payload) {
        const empty = {
            successCount: 0,
            failureCount: 0,
            invalidTokens: [],
        };
        if (!this.enabled || !userIds || userIds.length === 0) {
            return empty;
        }
        const users = await this.userModel
            .find({ _id: { $in: userIds } })
            .select('pushTokens')
            .lean()
            .exec();
        const tokens = [];
        for (const u of users) {
            for (const t of u.pushTokens || []) {
                if (t?.token)
                    tokens.push(t.token);
            }
        }
        if (tokens.length === 0)
            return empty;
        const result = await this.sendToTokens(tokens, payload);
        if (result.invalidTokens.length > 0) {
            try {
                await this.userModel
                    .updateMany({ 'pushTokens.token': { $in: result.invalidTokens } }, { $pull: { pushTokens: { token: { $in: result.invalidTokens } } } })
                    .exec();
            }
            catch (err) {
                this.logger.warn(`Failed to prune invalid tokens: ${err.message}`);
            }
        }
        return result;
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PushService);
//# sourceMappingURL=push.service.js.map