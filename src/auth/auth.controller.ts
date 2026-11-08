/**
 * auth/auth.controller.ts - Authentication Endpoints
 * =====================================================
 * All the routes for authentication. These are PUBLIC — no JWT required
 * (because you can't have a token before you log in!).
 *
 * The controller's job is simple:
 * 1. Receive the request
 * 2. Validate the body (via DTOs + ValidationPipe)
 * 3. Call the service method
 * 4. Return the result
 *
 * The service does the actual work. The controller is just the "front desk".
 *
 * ENDPOINTS:
 *   POST /api/v1/auth/register         → Create new account
 *   POST /api/v1/auth/login            → Login with email + password
 *   POST /api/v1/auth/google           → Login/register with Google token
 *   POST /api/v1/auth/verify-email     → Verify email with OTP
 *   POST /api/v1/auth/resend-verification → Resend OTP
 *   POST /api/v1/auth/forgot-password  → Request password reset email
 *   POST /api/v1/auth/reset-password   → Reset password with token
 */

import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { AppleAuthDto, ForgotPasswordDto, GoogleAuthDto, LoginDto, RegisterDto, ResendVerificationDto, ResetPasswordDto, VerifyEmailDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── POST /api/v1/auth/register ─────────────────────────

  @Post('register')
  @ResponseMessage('Registration successful')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with email and password',
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // ─── POST /api/v1/auth/login ────────────────────────────

  @Post('login')
  @ResponseMessage('Login successful')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticates a user and returns a JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, token returned in meta',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ─── POST /api/v1/auth/google ───────────────────────────

  @Post('google')
  @ResponseMessage('Google authentication successful')
  @ApiOperation({
    summary: 'Login or register with Google',
    description:
      'Validates a Google access token. Creates a new account if the email is new, or logs in if it exists.',
  })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleAuth(googleAuthDto.token);
  }

  // ─── POST /api/v1/auth/apple ────────────────────────────

  @Post('apple')
  @ResponseMessage('Apple authentication successful')
  @ApiOperation({
    summary: 'Login or register with Apple',
    description:
      'Verifies an Apple identity token (JWT). Creates a new account if the email is new, or logs in if it exists. firstName/lastName are only sent by Apple on the first authorization.',
  })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid Apple token' })
  async appleAuth(@Body() appleAuthDto: AppleAuthDto) {
    return this.authService.appleAuth(appleAuthDto);
  }

  // ─── POST /api/v1/auth/verify-email ─────────────────────

  @Post('verify-email')
  @ResponseMessage('Email verified successfully')
  @ApiOperation({
    summary: 'Verify email with OTP',
    description: "Confirms the user's email address using a 6-digit OTP code",
  })
  @ApiResponse({ status: 200, description: 'Email verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  // ─── POST /api/v1/auth/resend-verification ──────────────

  @Post('resend-verification')
  @ResponseMessage('Verification code sent')
  @ApiOperation({
    summary: 'Resend email verification OTP',
    description: 'Generates and sends a new verification code to the email',
  })
  @ApiResponse({ status: 200, description: 'Code sent' })
  @ApiResponse({
    status: 400,
    description: 'Email already verified or user not found',
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  // ─── POST /api/v1/auth/forgot-password ──────────────────

  @Post('forgot-password')
  @ResponseMessage('If an account exists, a reset email has been sent')
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends a password reset email. Always returns success to prevent email enumeration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset email sent (if account exists)',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  // ─── POST /api/v1/auth/reset-password ───────────────────

  @Post('reset-password')
  @ResponseMessage('Password reset successfully')
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Resets the password using the token received via email',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // ─── POST /api/v1/auth/logout ─────────────────────────

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ResponseMessage('Logged out successfully')
  @ApiOperation({
    summary: 'Logout',
    description: 'Invalidates the current JWT token',
  })
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(token);
  }
}
