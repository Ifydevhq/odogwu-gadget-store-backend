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
var MediaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
const user_schema_1 = require("../users/schemas/user.schema");
const creator_schema_1 = require("../creators/schemas/creator.schema");
const store_schema_1 = require("../stores/schemas/store.schema");
const listing_schema_1 = require("../listings/schemas/listing.schema");
const categories_schema_1 = require("../categories/schema/categories.schema");
const media_dto_1 = require("./dto/media.dto");
const contants_1 = require("../config/contants");
let MediaService = MediaService_1 = class MediaService {
    constructor(configService, userModel, creatorModel, storeModel, listingModel, categoryModel) {
        this.configService = configService;
        this.userModel = userModel;
        this.creatorModel = creatorModel;
        this.storeModel = storeModel;
        this.listingModel = listingModel;
        this.categoryModel = categoryModel;
        this.logger = new common_1.Logger(MediaService_1.name);
        cloudinary_1.v2.config({
            cloud_name: this.configService.get('app.cloudinary.cloudName'),
            api_key: this.configService.get('app.cloudinary.apiKey'),
            api_secret: this.configService.get('app.cloudinary.apiSecret'),
        });
    }
    async upload(file, dto, userId, userRole) {
        const { entityType, entityId, field, mediaType } = dto;
        this.validateField(entityType, field);
        this.validateFile(file);
        const isAdmin = [contants_1.UserRole.Admin, contants_1.UserRole.SuperAdmin].includes(userRole);
        if (!isAdmin) {
            await this.verifyOwnership(entityType, entityId, userId);
        }
        const folder = this.buildFolder(entityType, entityId, field);
        const cloudinaryUrl = await this.uploadToCloudinary(file, folder);
        const isArrayField = media_dto_1.ENTITY_FIELD_MAP[entityType].array.includes(field);
        const previousUrl = await this.updateEntityField(entityType, entityId, field, cloudinaryUrl, isArrayField, mediaType);
        if (!isArrayField && previousUrl) {
            await this.deleteFromCloudinary(previousUrl).catch((err) => this.logger.warn(`Failed to delete old image: ${err.message}`));
        }
        return {
            url: cloudinaryUrl,
            entityType,
            entityId,
            field,
            message: `Image uploaded and linked to ${entityType}.${field}`,
        };
    }
    async uploadGeneral(file, userId, folder) {
        this.validateFile(file);
        const uploadFolder = folder || `comaket/general/${userId}`;
        const cloudinaryUrl = await this.uploadToCloudinary(file, uploadFolder);
        return {
            url: cloudinaryUrl,
            message: 'File uploaded successfully',
        };
    }
    async uploadGeneralMultiple(files, userId, folder) {
        const results = [];
        for (const file of files) {
            const result = await this.uploadGeneral(file, userId, folder);
            results.push(result);
        }
        return {
            uploaded: results.length,
            urls: results.map((r) => r.url),
        };
    }
    async delete(dto, userId, userRole) {
        const { entityType, entityId, field, imageUrl } = dto;
        this.validateField(entityType, field);
        const isAdmin = [contants_1.UserRole.Admin, contants_1.UserRole.SuperAdmin].includes(userRole);
        if (!isAdmin) {
            await this.verifyOwnership(entityType, entityId, userId);
        }
        const isArrayField = media_dto_1.ENTITY_FIELD_MAP[entityType].array.includes(field);
        if (isArrayField) {
            if (!imageUrl) {
                throw new common_1.BadRequestException('imageUrl is required when removing from an array field (like media)');
            }
            await this.removeFromArrayField(entityType, entityId, field, imageUrl);
        }
        else {
            const currentUrl = await this.getFieldValue(entityType, entityId, field);
            await this.setFieldNull(entityType, entityId, field);
            if (currentUrl) {
                await this.deleteFromCloudinary(currentUrl).catch((err) => this.logger.warn(`Failed to delete from Cloudinary: ${err.message}`));
            }
        }
        if (imageUrl) {
            await this.deleteFromCloudinary(imageUrl).catch((err) => this.logger.warn(`Failed to delete from Cloudinary: ${err.message}`));
        }
        return {
            entityType,
            entityId,
            field,
            message: `Image removed from ${entityType}.${field}`,
        };
    }
    validateField(entityType, field) {
        const allowed = media_dto_1.ENTITY_FIELD_MAP[entityType];
        if (!allowed) {
            throw new common_1.BadRequestException(`Invalid entity type: ${entityType}`);
        }
        const allFields = [...allowed.single, ...allowed.array];
        if (!allFields.includes(field)) {
            throw new common_1.BadRequestException(`Invalid field "${field}" for ${entityType}. ` +
                `Allowed fields: ${allFields.join(', ')}`);
        }
    }
    validateFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'video/mp4',
            'video/quicktime',
            'audio/mp4',
            'audio/aac',
            'audio/mpeg',
            'audio/m4a',
            'audio/x-m4a',
            'audio/webm',
            'audio/ogg',
            'audio/wav',
            'audio/x-wav',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`File type "${file.mimetype}" is not allowed. ` +
                `Allowed: ${allowedMimes.join(', ')}`);
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 10MB limit`);
        }
    }
    async verifyOwnership(entityType, entityId, userId) {
        switch (entityType) {
            case media_dto_1.EntityType.User: {
                if (entityId !== userId) {
                    throw new common_1.ForbiddenException('You can only upload to your own profile');
                }
                break;
            }
            case media_dto_1.EntityType.Creator: {
                const creator = await this.creatorModel.findById(entityId).exec();
                if (!creator)
                    throw new common_1.NotFoundException('Creator not found');
                if (creator.userId.toString() !== userId) {
                    throw new common_1.ForbiddenException('You do not own this creator profile');
                }
                break;
            }
            case media_dto_1.EntityType.Store: {
                const store = await this.storeModel.findById(entityId).exec();
                if (!store)
                    throw new common_1.NotFoundException('Store not found');
                if ((store.userId?._id?.toString() ||
                    store.userId?.toString()) !== userId) {
                    throw new common_1.ForbiddenException('You do not own this store');
                }
                break;
            }
            case media_dto_1.EntityType.Listing: {
                const listing = await this.listingModel.findById(entityId).exec();
                if (!listing)
                    throw new common_1.NotFoundException('Listing not found');
                if (listing.userId.toString() !== userId) {
                    throw new common_1.ForbiddenException('You do not own this listing');
                }
                break;
            }
            case media_dto_1.EntityType.Category: {
                throw new common_1.ForbiddenException('Only admins can upload category images');
            }
        }
    }
    buildFolder(entityType, entityId, field) {
        return `comaket/${entityType}s/${entityId}/${field}`;
    }
    async uploadToCloudinary(file, folder) {
        return new Promise((resolve, reject) => {
            const isVideoOrAudio = file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/');
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: isVideoOrAudio ? 'video' : 'image',
                ...(isVideoOrAudio
                    ? {}
                    : {
                        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
                    }),
            }, (error, result) => {
                if (error) {
                    this.logger.error(`Cloudinary upload failed: ${error.message}`);
                    reject(new common_1.BadRequestException('Image upload failed. Please try again.'));
                }
                else {
                    resolve(result.secure_url);
                }
            });
            const readableStream = new stream_1.Readable();
            readableStream.push(file.buffer);
            readableStream.push(null);
            readableStream.pipe(uploadStream);
        });
    }
    async deleteFromCloudinary(url) {
        try {
            const parts = url.split('/upload/');
            if (parts.length < 2)
                return;
            const pathWithVersion = parts[1];
            const pathWithoutVersion = pathWithVersion.replace(/^v\d+\//, '');
            const publicId = pathWithoutVersion.replace(/\.[^.]+$/, '');
            await cloudinary_1.v2.uploader.destroy(publicId);
        }
        catch (error) {
            this.logger.warn(`Cloudinary delete failed for ${url}: ${error.message}`);
        }
    }
    async updateEntityField(entityType, entityId, field, url, isArrayField, mediaType) {
        const model = this.getModel(entityType);
        const id = entityType === media_dto_1.EntityType.User ? entityId : entityId;
        if (isArrayField) {
            if (entityType === media_dto_1.EntityType.Listing && field === 'media') {
                await model
                    .findByIdAndUpdate(id, {
                    $push: {
                        [field]: {
                            url,
                            type: mediaType || 'image',
                            thumbnail: mediaType === 'video' ? null : undefined,
                        },
                    },
                })
                    .exec();
            }
            else {
                await model.findByIdAndUpdate(id, { $push: { [field]: url } }).exec();
            }
            return null;
        }
        else {
            const entity = await model.findById(id).exec();
            const previousUrl = entity?.[field] || null;
            await model.findByIdAndUpdate(id, { $set: { [field]: url } }).exec();
            return previousUrl;
        }
    }
    async getFieldValue(entityType, entityId, field) {
        const model = this.getModel(entityType);
        const entity = await model.findById(entityId).exec();
        return entity?.[field] || null;
    }
    async setFieldNull(entityType, entityId, field) {
        const model = this.getModel(entityType);
        await model.findByIdAndUpdate(entityId, { $set: { [field]: null } }).exec();
    }
    async removeFromArrayField(entityType, entityId, field, imageUrl) {
        const model = this.getModel(entityType);
        if (entityType === media_dto_1.EntityType.Listing && field === 'media') {
            await model
                .findByIdAndUpdate(entityId, {
                $pull: { [field]: { url: imageUrl } },
            })
                .exec();
        }
        else {
            await model
                .findByIdAndUpdate(entityId, {
                $pull: { [field]: imageUrl },
            })
                .exec();
        }
    }
    getModel(entityType) {
        switch (entityType) {
            case media_dto_1.EntityType.User:
                return this.userModel;
            case media_dto_1.EntityType.Creator:
                return this.creatorModel;
            case media_dto_1.EntityType.Store:
                return this.storeModel;
            case media_dto_1.EntityType.Listing:
                return this.listingModel;
            case media_dto_1.EntityType.Category:
                return this.categoryModel;
            default:
                throw new common_1.BadRequestException(`Unknown entity type: ${entityType}`);
        }
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = MediaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(creator_schema_1.Creator.name)),
    __param(3, (0, mongoose_1.InjectModel)(store_schema_1.Store.name)),
    __param(4, (0, mongoose_1.InjectModel)(listing_schema_1.Listing.name)),
    __param(5, (0, mongoose_1.InjectModel)(categories_schema_1.Category.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], MediaService);
//# sourceMappingURL=media.service.js.map