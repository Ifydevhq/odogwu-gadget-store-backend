/**
 * referrals/referrals.controller.ts
 * ==================================
 * Authenticated referral dashboard endpoints for the current user.
 *
 *   GET /api/v1/referrals/me → the user's referral code, shareable link and
 *                              headline stats.
 *   GET /api/v1/referrals    → paginated history of the user's referees.
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ReferralsService } from './referrals.service';

@ApiTags('Referrals')
@ApiBearerAuth()
@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my referral code, link and summary stats' })
  @ResponseMessage('Referral summary retrieved successfully')
  async getMySummary(@GetUser('sub') userId: string) {
    return this.referralsService.getMyReferralSummary(userId);
  }

  @Get()
  @ApiOperation({ summary: 'List my referrals (paginated history)' })
  @ResponseMessage('Referrals retrieved successfully')
  async listMyReferrals(
    @GetUser('sub') userId: string,
    @Query() paging: PaginationDto,
  ) {
    return this.referralsService.listMyReferrals(userId, paging);
  }
}
