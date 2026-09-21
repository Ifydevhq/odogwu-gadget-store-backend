/**
 * phone-verification/phone.controller.ts
 * =======================================
 * Endpoints for the CURRENT user to verify their OWN phone number via SMS OTP.
 * Guarded by JwtAuthGuard — user.sub identifies whose phone is being verified.
 *
 *   POST /api/v1/auth/phone/request-otp  { phoneNumber }         → { sent }
 *   POST /api/v1/auth/phone/verify-otp   { phoneNumber, code }   → { verified, welcomeGranted }
 */

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser, JwtPayload } from '@common/decorators/get-user.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { PhoneService } from './phone.service';
import { RequestPhoneOtpDto, VerifyPhoneOtpDto } from './dto/phone.dto';

@ApiTags('auth')
@Controller('auth/phone')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PhoneController {
  constructor(private readonly phoneService: PhoneService) {}

  // ─── POST /api/v1/auth/phone/request-otp ────────────────

  @Post('request-otp')
  @ResponseMessage('Verification code sent')
  @ApiOperation({
    summary: 'Request an SMS OTP to verify the current user\'s phone number',
  })
  @ApiResponse({ status: 201, description: 'OTP sent' })
  @ApiResponse({ status: 400, description: 'Invalid number or already in use' })
  @ApiResponse({ status: 503, description: 'Phone verification not configured' })
  async requestOtp(
    @GetUser() user: JwtPayload,
    @Body() dto: RequestPhoneOtpDto,
  ) {
    return this.phoneService.requestOtp(user.sub, dto.phoneNumber);
  }

  // ─── POST /api/v1/auth/phone/verify-otp ─────────────────

  @Post('verify-otp')
  @ResponseMessage('Phone number verified')
  @ApiOperation({
    summary: 'Verify the SMS OTP and (once per phone) grant the welcome credit',
  })
  @ApiResponse({ status: 201, description: 'Phone verified' })
  @ApiResponse({ status: 400, description: 'Invalid code or number in use' })
  async verifyOtp(
    @GetUser() user: JwtPayload,
    @Body() dto: VerifyPhoneOtpDto,
  ) {
    return this.phoneService.verifyOtp(user.sub, dto.phoneNumber, dto.code);
  }
}
