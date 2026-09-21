import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { WalletService } from './wallet.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user wallet balance' })
  @ResponseMessage('Wallet balance retrieved successfully')
  async getBalance(@GetUser('sub') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List the current user wallet transactions (paginated)' })
  @ResponseMessage('Wallet transactions retrieved successfully')
  async listTransactions(
    @GetUser('sub') userId: string,
    @Query() dto: ListTransactionsDto,
  ) {
    return this.walletService.listTransactions(userId, dto);
  }
}
