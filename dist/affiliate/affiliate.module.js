"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const affiliate_commission_schema_1 = require("./schemas/affiliate-commission.schema");
const order_schema_1 = require("../orders/schemas/order.schema");
const listing_schema_1 = require("../listings/schemas/listing.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const platform_settings_module_1 = require("../platform-settings/platform-settings.module");
const affiliate_service_1 = require("./affiliate.service");
const affiliate_controller_1 = require("./affiliate.controller");
let AffiliateModule = class AffiliateModule {
};
exports.AffiliateModule = AffiliateModule;
exports.AffiliateModule = AffiliateModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: affiliate_commission_schema_1.AffiliateCommission.name, schema: affiliate_commission_schema_1.AffiliateCommissionSchema },
                { name: order_schema_1.Order.name, schema: order_schema_1.OrderSchema },
                { name: listing_schema_1.Listing.name, schema: listing_schema_1.ListingSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
            platform_settings_module_1.PlatformSettingsModule,
        ],
        controllers: [affiliate_controller_1.AffiliateController],
        providers: [affiliate_service_1.AffiliateService],
        exports: [affiliate_service_1.AffiliateService],
    })
], AffiliateModule);
//# sourceMappingURL=affiliate.module.js.map