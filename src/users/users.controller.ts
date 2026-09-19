/**
 * users/users.controller.ts - User Profile Endpoints
 * =====================================================
 * This controller handles user profile operations. ALL routes here
 * require authentication (JwtAuthGuard at the class level).
 *
 * NestJS routing works like this:
 *   @Controller('users')           → base path is /api/v1/users
 *   @Get('profile')                → GET /api/v1/users/profile
 *   @Patch('profile')              → PATCH /api/v1/users/profile
 *
 * @UseGuards(JwtAuthGuard) at the CLASS level means EVERY endpoint
 * in this controller requires a valid JWT token. No exceptions.
 *
 * @ApiBearerAuth('JWT-auth') tells Swagger to show the lock icon
 * and include the Authorization header in test requests.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { GetUser, JwtPayload } from '@common/decorators/get-user.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import {
  RegisterPushTokenDto,
  RemovePushTokenDto,
} from './dto/push-token.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── GET /api/v1/users/profile ──────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@GetUser() user: JwtPayload) {
    // user.sub is the MongoDB _id, extracted from the JWT token
    // by the JwtStrategy (we'll create that next)
    return this.usersService.getProfile(user.sub);
  }

  // ─── PATCH /api/v1/users/profile ────────────────────────

  @Patch('me')
  @ResponseMessage('Profile updated successfully')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @GetUser() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, updateProfileDto);
  }

  // ─── DELETE /api/v1/users/me ────────────────────────────

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Account deleted successfully')
  @ApiOperation({ summary: 'Soft-delete current user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async deleteAccount(
    @GetUser() user: JwtPayload,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    await this.usersService.deleteAccount(user.sub, deleteAccountDto.password);
    return { message: 'Account deleted successfully' };
  }

  // ─── PATCH /api/v1/users/me/password ──────────────────

  @Patch('me/password')
  @ResponseMessage('Password changed successfully')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @GetUser() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(user.sub, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  // ─── PATCH /api/v1/users/me/notifications ─────────────

  @Patch('me/notifications')
  @ResponseMessage('Notification preferences updated successfully')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
  })
  async updateNotificationPreferences(
    @GetUser() user: JwtPayload,
    @Body() updateDto: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.sub, updateDto);
  }

  // ─── POST /api/v1/users/me/push-tokens ────────────────

  @Post('me/push-tokens')
  @ResponseMessage('Push token registered')
  @ApiOperation({ summary: 'Register a device push token' })
  @ApiResponse({ status: 201, description: 'Push token registered' })
  async addPushToken(
    @GetUser() user: JwtPayload,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.usersService.addPushToken(user.sub, dto.token, dto.platform);
  }

  // ─── DELETE /api/v1/users/me/push-tokens ──────────────

  @Delete('me/push-tokens')
  @ResponseMessage('Push token removed')
  @ApiOperation({ summary: 'Remove a device push token' })
  @ApiResponse({ status: 200, description: 'Push token removed' })
  async removePushToken(
    @GetUser() user: JwtPayload,
    @Body() dto: RemovePushTokenDto,
  ) {
    return this.usersService.removePushToken(user.sub, dto.token);
  }
}
