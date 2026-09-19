/**
 * push/push.module.ts - Push Notification Module
 * ================================================
 * GLOBAL module (like NotificationsModule) so any service can inject
 * PushService without importing this module. It registers the User schema
 * so PushService can read/prune device tokens.
 *
 * INSTALL:
 *   npm install firebase-admin
 */

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PushService } from './push.service';
import { User, UserSchema } from '../users/schemas/user.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
