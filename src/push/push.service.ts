/**
 * push/push.service.ts - Firebase Cloud Messaging (FCM) Push Service
 * ====================================================================
 * Sends push notifications to registered device tokens via firebase-admin.
 *
 * CREDENTIAL-GATED: The service tries to initialise firebase-admin on
 * construction from one of (in order):
 *   - FIREBASE_SERVICE_ACCOUNT          → raw JSON string of the service account
 *   - FIREBASE_SERVICE_ACCOUNT_BASE64   → base64 of that JSON
 *   - GOOGLE_APPLICATION_CREDENTIALS    → path to the service-account JSON file
 *
 * If none are present (or init fails) push is simply DISABLED — every method
 * becomes a no-op that returns zero counts. It NEVER throws, so the rest of
 * the app runs fine without Firebase configured.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
  Credential,
} from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface PushResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    this.init();
  }

  private init(): void {
    try {
      // Don't double-initialise if another provider already did.
      if (getApps().length > 0) {
        this.enabled = true;
        return;
      }

      const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      let credential: Credential | null = null;

      if (rawJson) {
        credential = cert(JSON.parse(rawJson));
      } else if (base64) {
        const decoded = Buffer.from(base64, 'base64').toString('utf8');
        credential = cert(JSON.parse(decoded));
      } else if (credsPath) {
        // applicationDefault() reads GOOGLE_APPLICATION_CREDENTIALS
        credential = applicationDefault();
      }

      if (!credential) {
        this.logger.warn('Push disabled: no Firebase credentials');
        this.enabled = false;
        return;
      }

      initializeApp({ credential });
      this.enabled = true;
      this.logger.log('Push enabled: firebase-admin initialised');
    } catch (err) {
      this.logger.warn(
        `Push disabled: no Firebase credentials (init failed: ${err.message})`,
      );
      this.enabled = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Sends a multicast push to raw device tokens. Returns success/failure
   * counts and the list of tokens that are no longer valid so callers can
   * prune them.
   */
  async sendToTokens(
    tokens: string[],
    payload: PushPayload,
  ): Promise<PushResult> {
    const empty: PushResult = {
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
    };

    if (!this.enabled || !tokens || tokens.length === 0) {
      return empty;
    }

    // De-duplicate tokens
    const uniqueTokens = [...new Set(tokens)];

    try {
      const message: MulticastMessage = {
        tokens: uniqueTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
        },
        ...(payload.data ? { data: payload.data } : {}),
      };

      const response = await getMessaging().sendEachForMulticast(message);

      const invalidTokens: string[] = [];
      response.responses.forEach((res, idx) => {
        if (!res.success) {
          const code = res.error?.code || '';
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-argument' ||
            code === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.push(uniqueTokens[idx]);
          }
        }
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (err) {
      this.logger.error(`sendToTokens failed: ${err.message}`);
      return empty;
    }
  }

  /**
   * Loads the given users' device tokens, sends the push, then prunes any
   * tokens FCM reported as invalid from those users.
   */
  async sendToUsers(
    userIds: string[],
    payload: PushPayload,
  ): Promise<PushResult> {
    const empty: PushResult = {
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
    };

    if (!this.enabled || !userIds || userIds.length === 0) {
      return empty;
    }

    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('pushTokens')
      .lean()
      .exec();

    const tokens: string[] = [];
    for (const u of users) {
      for (const t of (u as any).pushTokens || []) {
        if (t?.token) tokens.push(t.token);
      }
    }

    if (tokens.length === 0) return empty;

    const result = await this.sendToTokens(tokens, payload);

    // Prune invalid tokens from every user that held one.
    if (result.invalidTokens.length > 0) {
      try {
        await this.userModel
          .updateMany(
            { 'pushTokens.token': { $in: result.invalidTokens } },
            { $pull: { pushTokens: { token: { $in: result.invalidTokens } } } },
          )
          .exec();
      } catch (err) {
        this.logger.warn(`Failed to prune invalid tokens: ${err.message}`);
      }
    }

    return result;
  }
}
