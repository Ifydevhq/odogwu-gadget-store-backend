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
exports.PhoneRegistrySchema = exports.PhoneRegistry = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let PhoneRegistry = class PhoneRegistry {
};
exports.PhoneRegistry = PhoneRegistry;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true, index: true }),
    __metadata("design:type", String)
], PhoneRegistry.prototype, "phoneE164", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PhoneRegistry.prototype, "firstUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], PhoneRegistry.prototype, "welcomeGranted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], PhoneRegistry.prototype, "referralRedeemed", void 0);
exports.PhoneRegistry = PhoneRegistry = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PhoneRegistry);
exports.PhoneRegistrySchema = mongoose_1.SchemaFactory.createForClass(PhoneRegistry);
exports.PhoneRegistrySchema.index({ phoneE164: 1 }, { unique: true });
//# sourceMappingURL=phone-registry.schema.js.map