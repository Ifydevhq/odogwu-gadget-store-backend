"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const platform_settings_module_1 = require("../platform-settings/platform-settings.module");
const withdrawals_service_1 = require("./withdrawals.service");
const withdrawals_controller_1 = require("./withdrawals.controller");
const withdrawal_request_schema_1 = require("./schemas/withdrawal-request.schema");
const user_schema_1 = require("../users/schemas/user.schema");
let WithdrawalsModule = class WithdrawalsModule {
};
exports.WithdrawalsModule = WithdrawalsModule;
exports.WithdrawalsModule = WithdrawalsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: withdrawal_request_schema_1.WithdrawalRequest.name, schema: withdrawal_request_schema_1.WithdrawalRequestSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
            platform_settings_module_1.PlatformSettingsModule,
        ],
        controllers: [withdrawals_controller_1.WithdrawalsController, withdrawals_controller_1.AdminWithdrawalsController],
        providers: [withdrawals_service_1.WithdrawalsService],
        exports: [withdrawals_service_1.WithdrawalsService],
    })
], WithdrawalsModule);
//# sourceMappingURL=withdrawals.module.js.map