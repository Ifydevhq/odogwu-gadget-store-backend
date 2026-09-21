/**
 * users/users.service.ts - User Business Logic
 * ===============================================
 * A Service in NestJS contains your BUSINESS LOGIC — the actual work.
 * Controllers handle HTTP concerns (routes, status codes, decorators),
 * Services handle everything else (database queries, validation logic,
 * transformations).
 *
 * Why separate them?
 * - Services can be reused across modules (AuthService uses UsersService)
 * - Easier to test (mock the service, test the logic)
 * - Clean separation: Controller = "what endpoint?" / Service = "what work?"
 *
 * @Injectable() tells NestJS this class can be "injected" into other classes.
 * This is Dependency Injection (DI) — instead of doing:
 *   const service = new UsersService(new Model(...))  ← manual, messy
 * NestJS does:
 *   constructor(private usersService: UsersService)   ← automatic, clean
 *
 * @InjectModel(User.name) gives you the Mongoose Model for the User collection.
 * Think of the Model as your gateway to the database for that collection.
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { AuthProvider } from '@config/contants';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Create a new user.
   * - Checks for duplicate email
   * - Hashes password (if not a Google user)
   * - Returns user WITHOUT password
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { email, password, authProvider } = createUserDto;

    // Check if email is already taken
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password for local (email+password) users
    // Google users don't have a password — they authenticate via Google's token
    const hashedPassword =
      authProvider !== AuthProvider.Google && password
        ? await bcrypt.hash(password, 10) // 10 = salt rounds (industry standard)
        : undefined;

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return user.save();
  }

  /**
   * Find a user by their MongoDB _id.
   * Throws NotFoundException if not found — this is better than returning null
   * because the calling code doesn't need to check for null every time.
   */
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Find by email — used during login and registration checks.
   * Returns null instead of throwing, because "user not found by email"
   * is a normal case during login (wrong credentials), not an error.
   *
   * The .select('+password +verificationCode +verificationExpires') explicitly
   * includes fields that are excluded by default (select: false in schema).
   * We need these for auth operations like login and email verification.
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password +verificationCode +verificationExpires')
      .exec();
  }

  /**
   * Get user profile — strips sensitive fields via the schema's toJSON transform.
   */
  async getProfile(userId: string): Promise<UserDocument> {
    return this.findById(userId);
  }

  /**
   * Update user profile.
   * - findByIdAndUpdate with { new: true } returns the UPDATED document
   * - runValidators: true ensures Mongoose validates the update against the schema
   */
  async updateProfile(
    userId: string,
    updateDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: updateDto },
        { new: true, runValidators: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Internal update — used by auth service for things like setting
   * verification codes, reset tokens, etc. Accepts any partial user fields.
   */
  async updateInternal(
    userId: string,
    update: Partial<User>,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: update }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find a user by their password reset token.
   * Tokens are hashed in the database (same approach as your Redymit app),
   * so we find users with non-expired tokens and compare each one.
   */
  async findByResetToken(token: string): Promise<UserDocument | null> {
    const users = await this.userModel
      .find({
        passwordResetToken: { $ne: null },
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+passwordResetToken +passwordResetExpires')
      .exec();

    for (const user of users) {
      const isMatch = await bcrypt.compare(token, user.passwordResetToken);
      if (isMatch) return user;
    }

    return null;
  }

  /**
   * Count total users — used by admin dashboard.
   */
  async countUsers(filter: Record<string, any> = {}): Promise<number> {
    return this.userModel.countDocuments(filter).exec();
  }

  // ─── Phone Verification ─────────────────────────────────

  /**
   * Find a user who has ALREADY verified this exact E.164 phone number.
   * Used to enforce "one verified account per phone". Returns null if the
   * phone is not verified against any account yet.
   */
  async findVerifiedByPhoneE164(
    phoneE164: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ phoneE164, isPhoneVerified: true })
      .exec();
  }

  /**
   * Mark a user's phone as verified: sets isPhoneVerified/phoneE164/
   * phoneVerifiedAt and mirrors the number onto the legacy `mobile` field.
   */
  async setPhoneVerified(
    userId: string,
    phoneE164: string,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            isPhoneVerified: true,
            phoneE164,
            phoneVerifiedAt: new Date(),
            'mobile.phoneNumber': phoneE164,
            'mobile.isoCode': 'NG',
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Reward-eligibility gate. A user can only earn phone-keyed rewards
   * (welcome credit today, referral rewards in a later phase) once they have
   * verified their phone number.
   */
  async isRewardEligible(userId: string): Promise<boolean> {
    const user = await this.userModel
      .findById(userId)
      .select('isPhoneVerified')
      .exec();
    return user?.isPhoneVerified === true;
  }

  // ─── Account Settings ───────────────────────────────────

  /**
   * Soft-delete user account.
   * Requires password confirmation for security.
   * Sets isDeleted=true and deletedAt=now instead of removing the document.
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.userModel
      .findById(userId)
      .select('+password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Google OAuth users don't have a password
    if (user.authProvider === AuthProvider.Google) {
      throw new BadRequestException(
        'Google accounts cannot be deleted with a password. Please contact support.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.userModel
      .findByIdAndUpdate(userId, {
        $set: { isDeleted: true, deletedAt: new Date() },
      })
      .exec();
  }

  /**
   * Change user password.
   * Validates current password before updating to the new one.
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userModel
      .findById(userId)
      .select('+password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.authProvider === AuthProvider.Google) {
      throw new BadRequestException(
        'Google accounts do not have a password to change. Please use Google sign-in.',
      );
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userModel
      .findByIdAndUpdate(userId, { $set: { password: hashedPassword } })
      .exec();
  }

  /**
   * Update notification preferences.
   * Merges the provided fields with the existing preferences.
   */
  async updateNotificationPreferences(
    userId: string,
    updateDto: UpdateNotificationPreferencesDto,
  ): Promise<UserDocument> {
    // Build $set object with dot notation to merge instead of overwrite
    const setFields: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(updateDto)) {
      if (value !== undefined) {
        setFields[`notificationPreferences.${key}`] = value;
      }
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: setFields },
        { new: true, runValidators: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ═══════════════════════════════════════════════════════════
  // PUSH NOTIFICATION DEVICE TOKENS
  // ═══════════════════════════════════════════════════════════

  /**
   * Registers (or refreshes) an FCM device token for the user. Deduped by
   * token: if it already exists, the platform + updatedAt are refreshed.
   */
  async addPushToken(
    userId: string,
    token: string,
    platform: string,
  ): Promise<UserDocument> {
    // Pull any existing copy of this token, then push the fresh entry.
    await this.userModel
      .updateOne(
        { _id: userId },
        { $pull: { pushTokens: { token } } },
      )
      .exec();

    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $push: {
            pushTokens: { token, platform, updatedAt: new Date() },
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /** Removes a device token from the user (e.g. on logout). */
  async removePushToken(userId: string, token: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { pushTokens: { token } } },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}