"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const referral_schema_1 = require("./schemas/referral.schema");
const phone_registry_schema_1 = require("../phone-verification/schemas/phone-registry.schema");
const order_schema_1 = require("../orders/schemas/order.schema");
const users_module_1 = require("../users/users.module");
const platform_settings_module_1 = require("../platform-settings/platform-settings.module");
const referrals_service_1 = require("./referrals.service");
const referrals_controller_1 = require("./referrals.controller");
let ReferralsModule = class ReferralsModule {
};
exports.ReferralsModule = ReferralsModule;
exports.ReferralsModule = ReferralsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: referral_schema_1.Referral.name, schema: referral_schema_1.ReferralSchema },
                { name: phone_registry_schema_1.PhoneRegistry.name, schema: phone_registry_schema_1.PhoneRegistrySchema },
                { name: order_schema_1.Order.name, schema: order_schema_1.OrderSchema },
            ]),
            users_module_1.UsersModule,
            platform_settings_module_1.PlatformSettingsModule,
        ],
        controllers: [referrals_controller_1.ReferralsController],
        providers: [referrals_service_1.ReferralsService],
        exports: [referrals_service_1.ReferralsService],
    })
], ReferralsModule);
//# sourceMappingURL=referrals.module.js.map