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
import { ConfigService } from '@nestjs/config';
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
import { TermiiVerificationProvider } from './termii-verification.provider';
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
    TermiiVerificationProvider, // Termii SMS OTP
    // The active provider is chosen at runtime. Set SMS_PROVIDER to force one:
    //   'whatsapp' | 'termii' | 'twilio'
    // When unset, the first *configured* provider wins (whatsapp → termii →
    // twilio). To add another vendor, implement SmsVerificationProvider and
    // slot it into this factory — callers never change.
    {
      provide: SMS_VERIFICATION_PROVIDER,
      useFactory: (
        config: ConfigService,
        whatsapp: WhatsAppVerificationProvider,
        termii: TermiiVerificationProvider,
        twilio: PhoneVerificationService,
      ) => {
        const choice = (config.get<string>('SMS_PROVIDER') || '')
          .trim()
          .toLowerCase();
        if (choice === 'whatsapp') return whatsapp;
        if (choice === 'termii') return termii;
        if (choice === 'twilio') return twilio;
        // Auto: first configured wins; fall back to the (disabled) WhatsApp
        // no-op so the app boots even with nothing configured.
        if (whatsapp.enabled) return whatsapp;
        if (termii.enabled) return termii;
        if (twilio.enabled) return twilio;
        return whatsapp;
      },
      inject: [
        ConfigService,
        WhatsAppVerificationProvider,
        TermiiVerificationProvider,
        PhoneVerificationService,
      ],
    },
    PhoneService,
  ],
  exports: [PhoneVerificationService, PhoneService, SMS_VERIFICATION_PROVIDER],
})
export class PhoneVerificationModule {}
