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
exports.CreateAnnouncementDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const contants_1 = require("../../config/contants");
class CreateAnnouncementDto {
}
exports.CreateAnnouncementDto = CreateAnnouncementDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        isArray: true,
        enum: ['in_app', 'push', 'email'],
        description: 'Delivery channels (at least one)',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsIn)(['in_app', 'push', 'email'], { each: true }),
    __metadata("design:type", Array)
], CreateAnnouncementDto.prototype, "channels", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['all', 'role', 'users'] }),
    (0, class_validator_1.IsIn)(['all', 'role', 'users']),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "audienceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: contants_1.UserRole, description: 'Required when audienceType = role' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(contants_1.UserRole),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "audienceRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Required when audienceType = users' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateAnnouncementDto.prototype, "audienceUserIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Arbitrary payload, e.g. { route: "/shop" }' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAnnouncementDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ISO date; if in the future the announcement is scheduled' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "scheduleAt", void 0);
//# sourceMappingURL=create-announcement.dto.js.map