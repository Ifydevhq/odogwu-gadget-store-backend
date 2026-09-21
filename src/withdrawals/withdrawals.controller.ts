/**
 * withdrawals/withdrawals.controller.ts
 * ======================================
 * Two controllers, distinct base paths:
 *   /wallet/withdrawals  → user self-service (request + list own)
 *   /admin/withdrawals   → admin queue (list all + process)
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UserRole } from '../config/contants';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { SaveBankAccountDto } from './dto/save-bank-account.dto';
import { ProcessWithdrawalDto } from './dto/process-withdrawal.dto';
import { QueryWithdrawalsDto } from './dto/query-withdrawals.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet/withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post('send-otp')
  @ApiOperation({
    summary: 'Email a 6-digit code to authorize opening the withdrawal view',
  })
  @ResponseMessage('Verification code sent to your email')
  async sendOtp(@GetUser('sub') userId: string) {
    return this.withdrawalsService.sendOtp(userId);
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Check the emailed code to unlock the withdrawal view (no consume)',
  })
  @ResponseMessage('Code verified')
  async verifyOtp(
    @GetUser('sub') userId: string,
    @Body('otp') otp: string,
  ) {
    return this.withdrawalsService.verifyOtp(userId, otp);
  }

  @Get('bank-accounts')
  @ApiOperation({ summary: 'List the current user saved payout bank accounts' })
  @ResponseMessage('Saved bank accounts retrieved successfully')
  async listBankAccounts(@GetUser('sub') userId: string) {
    return this.withdrawalsService.listBankAccounts(userId);
  }

  @Post('bank-accounts')
  @ApiOperation({ summary: 'Save a verified payout bank account for next time' })
  @ResponseMessage('Bank account saved successfully')
  async saveBankAccount(
    @GetUser('sub') userId: string,
    @Body() dto: SaveBankAccountDto,
  ) {
    return this.withdrawalsService.saveBankAccount(userId, dto);
  }

  @Delete('bank-accounts/:id')
  @ApiOperation({ summary: 'Remove a saved payout bank account' })
  @ResponseMessage('Bank account removed successfully')
  async deleteBankAccount(
    @GetUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.withdrawalsService.deleteBankAccount(userId, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Request a withdrawal of available earned wallet balance',
  })
  @ResponseMessage('Withdrawal request submitted successfully')
  async request(
    @GetUser('sub') userId: string,
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.withdrawalsService.request(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List the current user withdrawal requests' })
  @ResponseMessage('Withdrawal requests retrieved successfully')
  async listMine(
    @GetUser('sub') userId: string,
    @Query() dto: QueryWithdrawalsDto,
  ) {
    return this.withdrawalsService.listMine(userId, dto);
  }
}

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin/withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin)
export class AdminWithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all withdrawal requests (admin)' })
  @ResponseMessage('Withdrawal requests retrieved successfully')
  async adminList(@Query() dto: QueryWithdrawalsDto) {
    return this.withdrawalsService.adminList(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Process a pending withdrawal request (mark_paid or reject)',
  })
  @ResponseMessage('Withdrawal request processed successfully')
  async process(
    @Param('id') id: string,
    @GetUser('sub') adminId: string,
    @Body() dto: ProcessWithdrawalDto,
  ) {
    return this.withdrawalsService.process(id, adminId, dto);
  }
}
