/**
 * app.module.ts - The Root Module
 * ================================
 * In NestJS, everything is organized into "modules". Think of modules like boxes
 * that group related functionality together. The AppModule is the ROOT box —
 * it imports all other boxes (AuthModule, UsersModule, etc.)
 *
 * Key concepts:
 * - @Module() decorator tells NestJS "this class is a module"
 * - imports: other modules this module depends on
 * - controllers: route handlers (like Express routes)
 * - providers: services, helpers, anything injectable
 *
 * ConfigModule.forRoot(): Loads your .env file and makes env vars available
 * everywhere via ConfigService. The `isGlobal: true` means you don't need to
 * import ConfigModule in every single module.
 *
 * MongooseModule.forRootAsync(): Connects to MongoDB. We use "Async" because
 * we need to wait for ConfigService to load the connection string from .env.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CreatorsModule } from './creators/creators.module';
import { StoresModule } from './stores/stores.module';
import { ListingsModule } from './listings/listings.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CartModule } from './cart/cart.module';
import { SavedProductsModule } from './saved-products/saved-products.module';
import { FollowsModule } from './follows/follows.module';
import { FeaturedWorksModule } from './featured-works/featured-works.module';
import { ShippingAddressesModule } from './shipping-addresses/shipping-addresses.module';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';
import { DeliveryZonesModule } from './delivery-zones/delivery-zones.module';
import { DisputesModule } from './disputes/disputes.module';
import { AlertsModule } from './alerts/alerts.module';
import { ChatModule } from './chat/chat.module';
import { PushModule } from './push/push.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { WalletModule } from './wallet/wallet.module';
import { PhoneVerificationModule } from './phone-verification/phone-verification.module';

@Module({
  imports: [
    // -------------------------------------------------------------------
    // Configuration: Loads .env and custom config files.
    // load: [appConfig, databaseConfig] means we organize config into
    // separate files instead of dumping everything in one place.
    // -------------------------------------------------------------------
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      cache: true, // Caches config values for better performance
    }),

    // -------------------------------------------------------------------
    // Database: Connects to MongoDB using the URI from your .env file.
    // MongooseModule.forRootAsync() is the "async" version because we need
    // to inject ConfigService to read the env variable.
    // -------------------------------------------------------------------
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // -------------------------------------------------------------------
    // Rate Limiting: Prevents abuse by limiting requests per IP.
    // ttl: 60000ms (1 minute), limit: 60 requests per minute per IP.
    // This protects your API from being hammered.
    // -------------------------------------------------------------------
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),

    // -------------------------------------------------------------------
    // Task Scheduling: Enables cron jobs and intervals.
    // Used by OrdersCronService for auto-completing delivered orders.
    // -------------------------------------------------------------------
    ScheduleModule.forRoot(),

    // Feature modules will be added here as we build them:
    AuthModule,
    UsersModule,
    CreatorsModule,
    StoresModule,
    ListingsModule,
    OrdersModule,
    PaymentsModule,
    CategoriesModule,
    ReviewsModule,
    AdminModule,
    MediaModule,
    NotificationsModule,
    CartModule,
    SavedProductsModule,
    FollowsModule,
    FeaturedWorksModule,
    ShippingAddressesModule,
    PlatformSettingsModule,
    DeliveryZonesModule,
    DisputesModule,
    AlertsModule,
    ChatModule,
    PushModule,
    AnnouncementsModule,
    WalletModule,
    PhoneVerificationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
