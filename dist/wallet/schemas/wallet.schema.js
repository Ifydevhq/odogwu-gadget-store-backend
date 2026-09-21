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
exports.WalletSchema = exports.Wallet = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const base_schema_1 = require("../../common/schemas/base-schema");
let Wallet = class Wallet extends base_schema_1.BaseSchema {
};
exports.Wallet = Wallet;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, unique: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Wallet.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "promoBalance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "earnedBalance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "pendingBalance", void 0);
exports.Wallet = Wallet = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Wallet);
exports.WalletSchema = mongoose_1.SchemaFactory.createForClass(Wallet);
//# sourceMappingURL=wallet.schema.js.map