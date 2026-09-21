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
exports.OtpChallengeSchema = exports.OtpChallenge = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let OtpChallenge = class OtpChallenge {
};
exports.OtpChallenge = OtpChallenge;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], OtpChallenge.prototype, "phoneE164", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], OtpChallenge.prototype, "codeHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], OtpChallenge.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OtpChallenge.prototype, "attempts", void 0);
exports.OtpChallenge = OtpChallenge = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'otp_challenges' })
], OtpChallenge);
exports.OtpChallengeSchema = mongoose_1.SchemaFactory.createForClass(OtpChallenge);
exports.OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
//# sourceMappingURL=otp-challenge.schema.js.map