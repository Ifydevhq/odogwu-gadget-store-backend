"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_config_1 = require("./config/app.config");
const database_config_1 = require("./config/database.config");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const creators_module_1 = require("./creators/creators.module");
const stores_module_1 = require("./stores/stores.module");
const listings_module_1 = require("./listings/listings.module");
const orders_module_1 = require("./orders/orders.module");
const payments_module_1 = require("./payments/payments.module");
const categories_module_1 = require("./categories/categories.module");
const reviews_module_1 = require("./reviews/reviews.module");
const admin_module_1 = require("./admin/admin.module");
const media_module_1 = require("./media/media.module");
const notifications_module_1 = require("./notifications/notifications.module");
const cart_module_1 = require("./cart/cart.module");
const saved_products_module_1 = require("./saved-products/saved-products.module");
const follows_module_1 = require("./follows/follows.module");
const featured_works_module_1 = require("./featured-works/featured-works.module");
const shipping_addresses_module_1 = require("./shipping-addresses/shipping-addresses.module");
const platform_settings_module_1 = require("./platform-settings/platform-settings.module");
const delivery_zones_module_1 = require("./delivery-zones/delivery-zones.module");
const disputes_module_1 = require("./disputes/disputes.module");
const alerts_module_1 = require("./alerts/alerts.module");
const chat_module_1 = require("./chat/chat.module");
const push_module_1 = require("./push/push.module");
const announcements_module_1 = require("./announcements/announcements.module");
const wallet_module_1 = require("./wallet/wallet.module");
const phone_verification_module_1 = require("./phone-verification/phone-verification.module");
const referrals_module_1 = require("./referrals/referrals.module");
const affiliate_module_1 = require("./affiliate/affiliate.module");
const withdrawals_module_1 = require("./withdrawals/withdrawals.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, database_config_1.default],
                cache: true,
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    uri: configService.get('database.uri'),
                }),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 60,
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            creators_module_1.CreatorsModule,
            stores_module_1.StoresModule,
            listings_module_1.ListingsModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            categories_module_1.CategoriesModule,
            reviews_module_1.ReviewsModule,
            admin_module_1.AdminModule,
            media_module_1.MediaModule,
            notifications_module_1.NotificationsModule,
            cart_module_1.CartModule,
            saved_products_module_1.SavedProductsModule,
            follows_module_1.FollowsModule,
            featured_works_module_1.FeaturedWorksModule,
            shipping_addresses_module_1.ShippingAddressesModule,
            platform_settings_module_1.PlatformSettingsModule,
            delivery_zones_module_1.DeliveryZonesModule,
            disputes_module_1.DisputesModule,
            alerts_module_1.AlertsModule,
            chat_module_1.ChatModule,
            push_module_1.PushModule,
            announcements_module_1.AnnouncementsModule,
            wallet_module_1.WalletModule,
            phone_verification_module_1.PhoneVerificationModule,
            referrals_module_1.ReferralsModule,
            affiliate_module_1.AffiliateModule,
            withdrawals_module_1.WithdrawalsModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map