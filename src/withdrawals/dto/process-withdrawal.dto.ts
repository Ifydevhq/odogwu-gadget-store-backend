import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum WithdrawalAction {
  MarkPaid = 'mark_paid',
  Reject = 'reject',
}

export class ProcessWithdrawalDto {
  @ApiProperty({
    description:
      "Action to take on a pending request. 'mark_paid' settles it (money already left the wallet, admin paid offline); 'reject' returns the held funds to the wallet.",
    enum: WithdrawalAction,
  })
  @IsEnum(WithdrawalAction)
  action: WithdrawalAction;

  @ApiPropertyOptional({
    description: 'Optional admin note (payout reference or rejection reason).',
  })
  @IsOptional()
  @IsString()
  adminNote?: string;
}
