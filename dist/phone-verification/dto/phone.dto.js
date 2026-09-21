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
exports.VerifyPhoneOtpDto = exports.RequestPhoneOtpDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RequestPhoneOtpDto {
}
exports.RequestPhoneOtpDto = RequestPhoneOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '08031234567',
        description: 'Nigerian phone number in any common format (0803..., +234803..., 234803...)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestPhoneOtpDto.prototype, "phoneNumber", void 0);
class VerifyPhoneOtpDto {
}
exports.VerifyPhoneOtpDto = VerifyPhoneOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '08031234567',
        description: 'The same phone number the OTP was requested for',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyPhoneOtpDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456', description: 'The SMS OTP code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyPhoneOtpDto.prototype, "code", void 0);
//# sourceMappingURL=phone.dto.js.map