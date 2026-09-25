/**
 * media/media.service.ts - Media Upload Service
 * ================================================
 * Handles the full upload lifecycle:
 *
 * 1. VALIDATE: Check entity type + field combination is valid
 * 2. AUTHORIZE: Verify the user owns the entity
 * 3. UPLOAD: Send file to Cloudinary (organized in folders)
 * 4. LINK: Update the entity's field with the new URL
 * 5. RETURN: Send back the URL and entity update confirmation
 *
 * CLOUDINARY FOLDER STRUCTURE:
 *   comaket/
 *     users/{userId}/avatar/
 *     creators/{creatorId}/logo/
 *     creators/{creatorId}/cover/
 *     stores/{storeId}/logo/
 *     listings/{listingId}/media/
 *     categories/{categoryId}/
 *
 * SINGLE vs ARRAY FIELDS:
 *   Single (avatar, logo, coverImage): Replaces the existing value.
 *     If there was a previous image, the old Cloudinary file is deleted.
 *
 *   Array (media, featuredWorks): Pushes to the array.
 *     Each upload ADDS an image, doesn't replace existing ones.
 *     Use the delete endpoint to remove specific items.
 *
 * OWNERSHIP VERIFICATION:
 *   We check that the logged-in user actually owns the entity.
 *   A creator can only upload to their own store, not someone else's.
 *   An admin can upload to any entity (e.g., updating category images).
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Creator, CreatorDocument } from '../creators/schemas/creator.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';
import { Listing, ListingDocument } from '../listings/schemas/listing.schema';
import {
  Category,
  CategoryDocument,
} from '../categories/schema/categories.schema';
import {
  EntityType,
  ENTITY_FIELD_MAP,
  UploadMediaDto,
  DeleteMediaDto,
} from './dto/media.dto';
import { UserRole } from '@config/contants';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Creator.name) private creatorModel: Model<CreatorDocument>,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('app.cloudinary.cloudName'),
      api_key: this.configService.get<string>('app.cloudinary.apiKey'),
      api_secret: this.configService.get<string>('app.cloudinary.apiSecret'),
    });
  }

  // ─── Main Upload Method ──────────────────────────────────

  /**
   * Upload a file and link it to an entity.
   *
   * @param file - Multer file object from the request
   * @param dto  - Which entity and field to attach to
   * @param userId - The authenticated user's ID
   * @param userRole - The user's role (admin bypasses ownership checks)
   */
  async upload(
    file: Express.Multer.File,
    dto: UploadMediaDto,
    userId: string,
    userRole: string,
  ) {
    const { entityType, entityId, field, mediaType } = dto;

    // ─── Step 1: Validate field for this entity type ───────
    this.validateField(entityType, field);

    // ─── Step 2: Validate file ─────────────────────────────
    this.validateFile(file);

    // ─── Step 3: Verify ownership ──────────────────────────
    // Admin can upload to anything (e.g., category images)
    const isAdmin = [UserRole.Admin, UserRole.SuperAdmin].includes(
      userRole as UserRole,
    );
    if (!isAdmin) {
      await this.verifyOwnership(entityType, entityId, userId);
    }

    // ─── Step 4: Upload to Cloudinary ──────────────────────
    const folder = this.buildFolder(entityType, entityId, field);
    const cloudinaryUrl = await this.uploadToCloudinary(file, folder);

    // ─── Step 5: Update entity field ───────────────────────
    const isArrayField = ENTITY_FIELD_MAP[entityType].array.includes(field);
    const previousUrl = await this.updateEntityField(
      entityType,
      entityId,
      field,
      cloudinaryUrl,
      isArrayField,
      mediaType,
    );

    // ─── Step 6: Delete old file if replacing (single fields) ──
    if (!isArrayField && previousUrl) {
      await this.deleteFromCloudinary(previousUrl).catch((err) =>
        this.logger.warn(`Failed to delete old image: ${err.message}`),
      );
    }

    return {
      url: cloudinaryUrl,
      entityType,
      entityId,
      field,
      message: `Image uploaded and linked to ${entityType}.${field}`,
    };
  }

  // ─── General Upload (no entity linking) ────────────────

  /**
   * Upload a file to Cloudinary WITHOUT linking it to any entity.
   * Returns just the URL. Use this when you need image URLs before
   * creating the entity (e.g., uploading listing images before
   * calling POST /listings).
   *
   * Files go to: comaket/general/{userId}/
   */
  async uploadGeneral(
    file: Express.Multer.File,
    userId: string,
    folder?: string,
  ) {
    this.validateFile(file);

    const uploadFolder = folder || `comaket/general/${userId}`;
    const cloudinaryUrl = await this.uploadToCloudinary(file, uploadFolder);

    return {
      url: cloudinaryUrl,
      message: 'File uploaded successfully',
    };
  }

  /**
   * Upload multiple files to Cloudinary WITHOUT linking to any entity.
   */
  async uploadGeneralMultiple(
    files: Express.Multer.File[],
    userId: string,
    folder?: string,
  ) {
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

  // ─── Delete Media ────────────────────────────────────────

  /**
   * Remove an image from an entity and delete from Cloudinary.
   *
   * For single fields (avatar, logo): Sets the field to null.
   * For array fields (media): Removes the specific URL from the array.
   */
  async delete(dto: DeleteMediaDto, userId: string, userRole: string) {
    const { entityType, entityId, field, imageUrl } = dto;

    this.validateField(entityType, field);

    const isAdmin = [UserRole.Admin, UserRole.SuperAdmin].includes(
      userRole as UserRole,
    );
    if (!isAdmin) {
      await this.verifyOwnership(entityType, entityId, userId);
    }

    const isArrayField = ENTITY_FIELD_MAP[entityType].array.includes(field);

    if (isArrayField) {
      if (!imageUrl) {
        throw new BadRequestException(
          'imageUrl is required when removing from an array field (like media)',
        );
      }
      await this.removeFromArrayField(entityType, entityId, field, imageUrl);
    } else {
      // Get the current URL before nulling it (so we can delete from Cloudinary)
      const currentUrl = await this.getFieldValue(entityType, entityId, field);
      await this.setFieldNull(entityType, entityId, field);
      if (currentUrl) {
        await this.deleteFromCloudinary(currentUrl).catch((err) =>
          this.logger.warn(`Failed to delete from Cloudinary: ${err.message}`),
        );
      }
    }

    // Delete from Cloudinary if we have a URL
    if (imageUrl) {
      await this.deleteFromCloudinary(imageUrl).catch((err) =>
        this.logger.warn(`Failed to delete from Cloudinary: ${err.message}`),
      );
    }

    return {
      entityType,
      entityId,
      field,
      message: `Image removed from ${entityType}.${field}`,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════

  // ─── Validation ──────────────────────────────────────────

  private validateField(entityType: EntityType, field: string): void {
    const allowed = ENTITY_FIELD_MAP[entityType];
    if (!allowed) {
      throw new BadRequestException(`Invalid entity type: ${entityType}`);
    }

    const allFields = [...allowed.single, ...allowed.array];
    if (!allFields.includes(field)) {
      throw new BadRequestException(
        `Invalid field "${field}" for ${entityType}. ` +
          `Allowed fields: ${allFields.join(', ')}`,
      );
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/quicktime',
      // Voice notes (chat) — recorders emit m4a/aac/mpeg/webm/ogg/wav.
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
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. ` +
          `Allowed: ${allowedMimes.join(', ')}`,
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 10MB limit`,
      );
    }
  }

  // ─── Ownership Verification ──────────────────────────────

  /**
   * Verify the user owns the entity they're uploading to.
   * Each entity type has a different ownership check.
   */
  private async verifyOwnership(
    entityType: EntityType,
    entityId: string,
    userId: string,
  ): Promise<void> {
    switch (entityType) {
      case EntityType.User: {
        // Users can only upload to their own profile
        if (entityId !== userId) {
          throw new ForbiddenException(
            'You can only upload to your own profile',
          );
        }
        break;
      }

      case EntityType.Creator: {
        const creator = await this.creatorModel.findById(entityId).exec();
        if (!creator) throw new NotFoundException('Creator not found');
        if (creator.userId.toString() !== userId) {
          throw new ForbiddenException('You do not own this creator profile');
        }
        break;
      }

      case EntityType.Store: {
        const store = await this.storeModel.findById(entityId).exec();
        if (!store) throw new NotFoundException('Store not found');
        if (
          ((store.userId as any)?._id?.toString() ||
            store.userId?.toString()) !== userId
        ) {
          throw new ForbiddenException('You do not own this store');
        }
        break;
      }

      case EntityType.Listing: {
        const listing = await this.listingModel.findById(entityId).exec();
        if (!listing) throw new NotFoundException('Listing not found');
        if (listing.userId.toString() !== userId) {
          throw new ForbiddenException('You do not own this listing');
        }
        break;
      }

      case EntityType.Category: {
        // Only admins can upload category images (handled before this method)
        throw new ForbiddenException('Only admins can upload category images');
      }
    }
  }

  // ─── Cloudinary Upload ───────────────────────────────────

  /**
   * Build a Cloudinary folder path to keep files organized.
   * e.g., "comaket/listings/507f1f77bcf86cd/media"
   */
  private buildFolder(
    entityType: EntityType,
    entityId: string,
    field: string,
  ): string {
    return `comaket/${entityType}s/${entityId}/${field}`;
  }

  /**
   * Upload a file buffer to Cloudinary using streams.
   * Returns the secure HTTPS URL.
   */
  private async uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Cloudinary handles audio under the 'video' resource type.
      const isVideoOrAudio =
        file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/');

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: isVideoOrAudio ? 'video' : 'image',
          // Auto-optimize images only
          ...(isVideoOrAudio
            ? {}
            : {
                transformation: [{ quality: 'auto', fetch_format: 'auto' }],
              }),
        },
        (error, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            reject(
              new BadRequestException('Image upload failed. Please try again.'),
            );
          } else {
            resolve(result.secure_url);
          }
        },
      );

      // Pipe the file buffer into the upload stream
      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Delete a file from Cloudinary by its URL.
   * Extracts the public_id from the URL to identify the file.
   */
  private async deleteFromCloudinary(url: string): Promise<void> {
    try {
      // Extract public_id from URL
      // URL: https://res.cloudinary.com/xxx/image/upload/v123/comaket/users/abc/avatar/filename.jpg
      // public_id: comaket/users/abc/avatar/filename
      const parts = url.split('/upload/');
      if (parts.length < 2) return;

      const pathWithVersion = parts[1]; // v123/comaket/users/abc/avatar/filename.jpg
      const pathWithoutVersion = pathWithVersion.replace(/^v\d+\//, ''); // Remove version
      const publicId = pathWithoutVersion.replace(/\.[^.]+$/, ''); // Remove extension

      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.warn(`Cloudinary delete failed for ${url}: ${error.message}`);
    }
  }

  // ─── Entity Field Updates ────────────────────────────────

  /**
   * Update the entity's field with the new image URL.
   * Returns the previous URL (for cleanup of single fields).
   */
  private async updateEntityField(
    entityType: EntityType,
    entityId: string,
    field: string,
    url: string,
    isArrayField: boolean,
    mediaType?: string,
  ): Promise<string | null> {
    const model = this.getModel(entityType);
    const id = entityType === EntityType.User ? entityId : entityId;

    if (isArrayField) {
      // ARRAY FIELD: Push to array
      if (entityType === EntityType.Listing && field === 'media') {
        // Listing media has a specific shape: { url, type, thumbnail }
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
      } else {
        // Simple string array (like featuredWorks)
        await model.findByIdAndUpdate(id, { $push: { [field]: url } }).exec();
      }
      return null; // No previous URL to clean up
    } else {
      // SINGLE FIELD: Get old value, then replace
      const entity = await model.findById(id).exec();
      const previousUrl = entity?.[field] || null;

      await model.findByIdAndUpdate(id, { $set: { [field]: url } }).exec();

      return previousUrl;
    }
  }

  /**
   * Get the current value of a field (for cleanup before deletion).
   */
  private async getFieldValue(
    entityType: EntityType,
    entityId: string,
    field: string,
  ): Promise<string | null> {
    const model = this.getModel(entityType);
    const entity = await model.findById(entityId).exec();
    return entity?.[field] || null;
  }

  /**
   * Set a single field to null (for delete operation).
   */
  private async setFieldNull(
    entityType: EntityType,
    entityId: string,
    field: string,
  ): Promise<void> {
    const model = this.getModel(entityType);
    await model.findByIdAndUpdate(entityId, { $set: { [field]: null } }).exec();
  }

  /**
   * Remove a specific URL from an array field.
   */
  private async removeFromArrayField(
    entityType: EntityType,
    entityId: string,
    field: string,
    imageUrl: string,
  ): Promise<void> {
    const model = this.getModel(entityType);

    if (entityType === EntityType.Listing && field === 'media') {
      // Listing media is an array of objects with { url, type }
      await model
        .findByIdAndUpdate(entityId, {
          $pull: { [field]: { url: imageUrl } },
        })
        .exec();
    } else {
      // Simple string array
      await model
        .findByIdAndUpdate(entityId, {
          $pull: { [field]: imageUrl },
        })
        .exec();
    }
  }

  /**
   * Get the Mongoose model for an entity type.
   */
  private getModel(entityType: EntityType): Model<any> {
    switch (entityType) {
      case EntityType.User:
        return this.userModel;
      case EntityType.Creator:
        return this.creatorModel;
      case EntityType.Store:
        return this.storeModel;
      case EntityType.Listing:
        return this.listingModel;
      case EntityType.Category:
        return this.categoryModel;
      default:
        throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }
  }
}
