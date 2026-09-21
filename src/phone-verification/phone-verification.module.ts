/**
 * phone-verification/phone-verification.module.ts
 * ================================================
 * Wires up phone (SMS OTP) verification + the phone-keyed welcome credit.
 *
 * - Registers the PhoneRegistry schema (the anti-farm ledger).
 * - Binds the SMS_VERIFICATION_PROVIDER token to the Twilio implementation.
 *   Swap this one provider binding to move to another SMS vendor (e.g. Termii)
 *   without touching PhoneService.
 * - @Global so the provider / PhoneService are injectable elsewhere later.
 *
 * Depends on UsersModule (UsersService) and PlatformSettingsModule
 * (PlatformSettingsService). WalletService comes from the @Global WalletModule.
 */

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import {
  PhoneRegistry,
  PhoneRegistrySchema,
} from './schemas/phone-registry.schema';
import { PhoneVerificationService } from './phone-verification.service';
import { PhoneService } from './phone.service';
import { PhoneController } from './phone.controller';
import { SMS_VERIFICATION_PROVIDER } from './sms-verification.provider';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PhoneRegistry.name, schema: PhoneRegistrySchema },
    ]),
    UsersModule,
    PlatformSettingsModule,
  ],
  controllers: [PhoneController],
  providers: [
    PhoneVerificationService,
    // The concrete provider is bound behind an interface token so it can be
    // swapped for another SMS vendor without changing callers.
    {
      provide: SMS_VERIFICATION_PROVIDER,
      useExisting: PhoneVerificationService,
    },
    PhoneService,
  ],
  exports: [PhoneVerificationService, PhoneService, SMS_VERIFICATION_PROVIDER],
})
export class PhoneVerificationModule {}
