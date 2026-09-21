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
import {
  OtpChallenge,
  OtpChallengeSchema,
} from './schemas/otp-challenge.schema';
import { PhoneVerificationService } from './phone-verification.service';
import { WhatsAppVerificationProvider } from './whatsapp-verification.provider';
import { PhoneService } from './phone.service';
import { PhoneController } from './phone.controller';
import { SMS_VERIFICATION_PROVIDER } from './sms-verification.provider';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PhoneRegistry.name, schema: PhoneRegistrySchema },
      { name: OtpChallenge.name, schema: OtpChallengeSchema },
    ]),
    UsersModule,
    PlatformSettingsModule,
  ],
  controllers: [PhoneController],
  providers: [
    PhoneVerificationService, // Twilio Verify
    WhatsAppVerificationProvider, // WhatsApp Cloud API OTP
    // The active provider is chosen at runtime: WhatsApp when its Cloud API is
    // configured, otherwise Twilio (which is itself disabled without creds).
    // Swap the factory to move to yet another SMS vendor without touching callers.
    {
      provide: SMS_VERIFICATION_PROVIDER,
      useFactory: (
        whatsapp: WhatsAppVerificationProvider,
        twilio: PhoneVerificationService,
      ) => (whatsapp.enabled ? whatsapp : twilio),
      inject: [WhatsAppVerificationProvider, PhoneVerificationService],
    },
    PhoneService,
  ],
  exports: [PhoneVerificationService, PhoneService, SMS_VERIFICATION_PROVIDER],
})
export class PhoneVerificationModule {}
