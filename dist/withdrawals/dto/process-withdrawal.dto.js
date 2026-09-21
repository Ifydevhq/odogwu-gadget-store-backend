"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessWithdrawalDto = exports.WithdrawalAction = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var WithdrawalAction;
(function (WithdrawalAction) {
    WithdrawalAction["MarkPaid"] = "mark_paid";
    WithdrawalAction["Reject"] = "reject";
})(WithdrawalAction || (exports.WithdrawalAction = WithdrawalAction = {}));
class ProcessWithdrawalDto {
}
exports.ProcessWithdrawalDto = ProcessWithdrawalDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Action to take on a pending request. 'mark_paid' settles it (money already left the wallet, admin paid offline); 'reject' returns the held funds to the wallet.",
        enum: WithdrawalAction,
    }),
    (0, class_validator_1.IsEnum)(WithdrawalAction),
    __metadata("design:type", String)
], ProcessWithdrawalDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional admin note (payout reference or rejection reason).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessWithdrawalDto.prototype, "adminNote", void 0);
//# sourceMappingURL=process-withdrawal.dto.js.map