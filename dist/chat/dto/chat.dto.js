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
exports.SearchChatDto = exports.QueryMessagesDto = exports.EditMessageDto = exports.SendMessageDto = exports.CreateConversationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
class ProductContextDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductContextDto.prototype, "listingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductContextDto.prototype, "itemName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProductContextDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProductContextDto.prototype, "image", void 0);
class CreateConversationDto {
}
exports.CreateConversationDto = CreateConversationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The other participant user ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConversationDto.prototype, "participantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product context if initiated from a listing' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProductContextDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ProductContextDto)
], CreateConversationDto.prototype, "productContext", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Initial message to send' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateConversationDto.prototype, "initialMessage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hint: creator or store', enum: ['creator', 'store'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateConversationDto.prototype, "participantType", void 0);
class ProductCardDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductCardDto.prototype, "listingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductCardDto.prototype, "itemName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProductCardDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProductCardDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProductCardDto.prototype, "storeName", void 0);
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['text', 'image', 'product_card', 'product', 'voice'],
    }),
    (0, class_validator_1.IsEnum)(['text', 'image', 'product_card', 'product', 'voice']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProductCardDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ProductCardDto)
], SendMessageDto.prototype, "productCard", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SendMessageDto.prototype, "attachments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata for the message' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SendMessageDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID of the message being replied to' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "replyTo", void 0);
class EditMessageDto {
}
exports.EditMessageDto = EditMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EditMessageDto.prototype, "content", void 0);
class QueryMessagesDto extends pagination_dto_1.PaginationDto {
}
exports.QueryMessagesDto = QueryMessagesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cursor: get messages before this timestamp' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryMessagesDto.prototype, "before", void 0);
class SearchChatDto {
}
exports.SearchChatDto = SearchChatDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchChatDto.prototype, "q", void 0);
//# sourceMappingURL=chat.dto.js.map