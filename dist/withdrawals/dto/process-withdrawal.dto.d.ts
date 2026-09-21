export declare enum WithdrawalAction {
    MarkPaid = "mark_paid",
    Reject = "reject"
}
export declare class ProcessWithdrawalDto {
    action: WithdrawalAction;
    adminNote?: string;
}
