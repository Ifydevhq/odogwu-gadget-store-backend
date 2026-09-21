/**
 * auth/auth.service.ts - Authentication Business Logic
 * =======================================================
 * This service handles ALL authentication operations:
 * - Register (email + password)
 * - Login (email + password)
 * - Google OAuth (validate Google token, create/find user)
 * - Email verification (OTP-based, same as your Redymit app)
 * - Forgot password / Reset password
 *
 * KEY CONCEPTS:
 *
 * JWT (JSON Web Token): A signed string that proves "I am user X".
 *   Structure: header.payload.signature
 *   Payload contains: { sub: userId, email, role }
 *   Signed with your JWT_SECRET so nobody can fake it.
 *
 * bcrypt: A hashing library for passwords. Hashing is ONE-WAY:
 *   password → hash (easy)
 *   hash → password (impossible)
 *   That's why we compare hashes, not passwords.
 *
 * OTP (One-Time Password): A 6-digit code sent to email for verification.
 */

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { AuthProvider } from '@config/contants';
import { UserDocument } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { AlertsService } from '../alerts/alerts.service';
import { AlertType } from '@config/contants';
import { ReferralsService } from '../referrals/referrals.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private alertsService: AlertsService,
    private referralsService: ReferralsService,
  ) {}

  // ─── Helpers ─────────────────────────────────────────────

  /**
   * Generate a 6-digit OTP for email verification.
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create a JWT token for a user.
   * The payload (sub, email, role) is what gets encoded into the token
   * and later decoded by JwtStrategy.validate().
   */
  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Build the auth response shape.
   * The TransformInterceptor will detect the 'token' key and move it to meta.token.
   */
  private buildAuthResponse(user: UserDocument) {
    const token = this.generateToken(user);
    const { password, verificationCode, verificationExpires, ...userData } =
      user.toObject();

    return {
      token,
      ...userData,
    };
  }

  // ─── Register ────────────────────────────────────────────

  /**
   * POST /auth/register
   *
   * Flow:
   * 1. Generate OTP for email verification
   * 2. Create user via UsersService (which hashes the password)
   * 3. Send verification email with OTP
   * 4. Return user data WITHOUT token (user must verify email first)
   */
  async register(registerDto: RegisterDto) {
    const otp = this.generateOTP();
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 10);

    // Resolve an optional referral code to the referring user. Invalid codes
    // are ignored silently — they must never block a signup. `referredBy` is
    // stored now, but only becomes reward-eligible once the new user verifies
    // their phone (see ReferralsService.activateOnPhoneVerified).
    const { referralCode, ...registerData } = registerDto;
    let referredBy: string | undefined;
    if (referralCode) {
      try {
        const referrer = await this.usersService.findByReferralCode(referralCode);
        if (referrer) referredBy = referrer._id.toString();
      } catch {
        /* ignore — invalid/lookup failure never blocks signup */
      }
    }

    const user = await this.usersService.create({
      ...registerData,
      referredBy,
      authProvider: AuthProvider.Local,
      verificationCode: otp,
      verificationExpires,
    });

    if (!user) {
      throw new InternalServerErrorException('Failed to create user');
    }

    // Create the pending Referral row (self-refer is guarded inside). Never
    // blocks registration.
    if (referredBy) {
      this.referralsService
        .registerReferral(referredBy, user._id.toString())
        .catch(() => {});
    }

    // Send verification email with OTP
    this.notificationsService.sendVerificationOtp(
      user.email,
      registerDto.firstName,
      otp,
    );

    const { password, verificationCode, verificationExpires: vExp, ...userData } =
      user.toObject();

    return userData;
  }

  // ─── Login ───────────────────────────────────────────────

  /**
   * POST /auth/login
   *
   * Flow:
   * 1. Find user by email (includes password field)
   * 2. Check if it's a Google user (they can't login with password)
   * 3. Compare provided password with stored hash
   * 4. If email not verified, resend OTP and return unverified response (no token)
   * 5. Return user data + JWT token
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // findByEmail includes +password in the select
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Google users must login through Google
    if (user.authProvider === AuthProvider.Google) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please login with Google.',
      );
    }

    // Compare the provided password with the hashed one in DB
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If email not verified, resend OTP and return without token
    if (!user.isEmailVerified) {
      const otp = this.generateOTP();
      const verificationExpires = new Date();
      verificationExpires.setMinutes(verificationExpires.getMinutes() + 10);

      await this.usersService.updateInternal(user._id.toString(), {
        verificationCode: otp,
        verificationExpires,
      });

      this.notificationsService.sendVerificationOtp(
        user.email,
        user.firstName,
        otp,
      );

      const { password: pw, verificationCode, verificationExpires: vExp, ...userData } =
        user.toObject();

      return {
        ...userData,
        isEmailVerified: false,
        requiresVerification: true,
      };
    }

    return this.buildAuthResponse(user);
  }

  // ─── Google OAuth ────────────────────────────────────────

  /**
   * POST /auth/google
   *
   * Flow:
   * 1. Frontend gets a Google access token via Google Sign-In
   * 2. Frontend sends that token to this endpoint
   * 3. We verify the token with Google's API
   * 4. Extract email + name from Google's response
   * 5. Find or create the user
   * 6. Return user data + JWT token
   *
   * This is the same approach as your Redymit app — the frontend
   * handles the Google popup/redirect, we just validate the token.
   */
  async googleAuth(googleToken: string) {
    try {
      // Verify the token with Google
      const tokenResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${googleToken}`,
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new UnauthorizedException('Invalid Google token');
      }

      // Fetch user profile info (tokeninfo doesn't include name/picture)
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        { headers: { Authorization: `Bearer ${googleToken}` } },
      );
      const userInfo = await userInfoResponse.json();

      return this.validateOrCreateGoogleUser({
        email: tokenData.email || userInfo.email,
        firstName:
          userInfo.given_name ||
          userInfo.name?.split(' ')[0] ||
          tokenData.email.split('@')[0],
        lastName:
          userInfo.family_name ||
          userInfo.name?.split(' ').slice(1).join(' ') ||
          null,
        avatar: userInfo.picture || null,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  /**
   * Find existing Google user or create a new one.
   * If the email exists but was registered with password, we still
   * allow Google login (links the accounts).
   */
  private async validateOrCreateGoogleUser(googleUser: {
    email: string;
    firstName: string;
    lastName?: string | null;
    avatar?: string;
  }) {
    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      user = await this.usersService.create({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName || googleUser.firstName, // Fallback to firstName if no lastName
        avatar: googleUser.avatar,
        authProvider: AuthProvider.Google,
        isEmailVerified: true, // Google emails are already verified
      });
    }

    return this.buildAuthResponse(user);
  }

  // ─── Email Verification ──────────────────────────────────

  /**
   * POST /auth/verify-email
   *
   * Compares the provided OTP with the stored one.
   * OTPs expire after 10 minutes (set during registration).
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    if (user.verificationCode !== otp) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.verificationExpires < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }

    await this.usersService.updateInternal(user._id.toString(), {
      isEmailVerified: true,
      verificationCode: null,
      verificationExpires: null,
    });

    // Send welcome email
    this.notificationsService.sendWelcome(user.email, user.firstName);

    // In-app welcome alert
    this.alertsService.createAlert({
      userId: user._id,
      type: AlertType.Welcome,
      title: 'Welcome to Odogwu Gadget Store! 🎉',
      message: `Hi ${user.firstName}, welcome! Browse our laptops, phones and accessories — and reach out any time if you need help choosing.`,
      entityType: 'user',
      entityId: user._id,
    }).catch(() => {}); // non-blocking

    return { message: 'Email verified successfully' };
  }

  /**
   * POST /auth/resend-verification
   *
   * Generates a new OTP and sends it to the user's email.
   */
  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const otp = this.generateOTP();
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 10);

    await this.usersService.updateInternal(user._id.toString(), {
      verificationCode: otp,
      verificationExpires,
    });

    // Send verification email
    this.notificationsService.sendVerificationOtp(email, user.firstName, otp);

    return { message: 'Verification code sent' };
  }

  // ─── Password Reset ─────────────────────────────────────

  /**
   * POST /auth/forgot-password
   *
   * Always returns the same message whether the email exists or not.
   * This prevents "email enumeration" — attackers can't use this endpoint
   * to discover which emails are registered.
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (user) {
      const resetToken = randomBytes(32).toString('hex');
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

      // Hash the token before storing (so if DB is compromised, tokens are useless)
      const hashedToken = await bcrypt.hash(resetToken, 10);

      await this.usersService.updateInternal(user._id.toString(), {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpires,
      });

      // Send reset email with the UNHASHED token
      // The email contains a link like: frontend.com/reset-password?token=abc123
      this.notificationsService.sendPasswordReset(
        user.email,
        user.firstName,
        resetToken,
      );
    }

    // Always return same message (security best practice)
    return { message: 'If an account exists, a reset email has been sent' };
  }

  /**
   * POST /auth/reset-password
   *
   * The user clicks the link in their email, which contains the reset token.
   * We find the user by comparing the token, then update their password.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.updateInternal(user._id.toString(), {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return { message: 'Password reset successfully' };
  }

  private tokenBlacklist = new Set<string>();

  async logout(token: string) {
    if (token) {
      this.tokenBlacklist.add(token);
    }
    return { message: 'Logged out successfully' };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.has(token);
  }
}
