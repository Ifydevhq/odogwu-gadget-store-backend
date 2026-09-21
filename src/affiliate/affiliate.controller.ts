/**
 * affiliate/affiliate.controller.ts
 * ==================================
 * Authenticated affiliate dashboard endpoints for the current user.
 *
 *   POST /affiliate/join         → opt into the affiliate program.
 *   GET  /affiliate/summary      → balances (pending / available / total).
 *   GET  /affiliate/commissions  → paginated commission history.
 *   GET  /affiliate/link         → per-product affiliate share link.
 *   GET  /affiliate/products     → paginated affiliate-enabled products.
 */

import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AffiliateService } from './affiliate.service';

@ApiTags('Affiliate')
@ApiBearerAuth()
@Controller('affiliate')
@UseGuards(JwtAuthGuard)
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Post('join')
  @ApiOperation({ summary: 'Join the affiliate program' })
  @ResponseMessage('You are now an affiliate')
  async join(@GetUser('sub') userId: string) {
    return this.affiliateService.join(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get my affiliate balances and status' })
  @ResponseMessage('Affiliate summary retrieved successfully')
  async getSummary(@GetUser('sub') userId: string) {
    return this.affiliateService.getSummary(userId);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'List my affiliate commissions (paginated)' })
  @ResponseMessage('Commissions retrieved successfully')
  async listCommissions(
    @GetUser('sub') userId: string,
    @Query() paging: PaginationDto,
  ) {
    return this.affiliateService.listCommissions(userId, paging);
  }

  @Get('link')
  @ApiOperation({ summary: 'Get my affiliate link for a product' })
  @ApiQuery({ name: 'listingId', required: true })
  @ResponseMessage('Affiliate link generated')
  async getLink(
    @GetUser('sub') userId: string,
    @Query('listingId') listingId: string,
  ) {
    if (!listingId) {
      throw new BadRequestException('listingId is required');
    }
    try {
      return await this.affiliateService.getLink(userId, listingId);
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Could not generate link');
    }
  }

  @Get('products')
  @ApiOperation({ summary: 'List affiliate-enabled products (paginated)' })
  @ApiQuery({ name: 'search', required: false })
  @ResponseMessage('Affiliate products retrieved successfully')
  async listProducts(
    @Query() paging: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.affiliateService.listAffiliateProducts(paging, search);
  }
}
