/**
 * config/app.config.ts - Application Configuration
 * ==================================================
 * Instead of calling process.env.SOMETHING everywhere in your code,
 * we centralize all env vars here. This gives you:
 *
 * 1. Type safety — you know exactly what config exists
 * 2. Default values — if an env var is missing, you get a fallback
 * 3. Organization — grouped by concern (app, jwt, paystack, etc.)
 *
 * Usage in any service:
 *   constructor(private configService: ConfigService) {}
 *   const secret = this.configService.get<string>('app.jwt.secret');
 *
 * registerAs('app') means all values are nested under the 'app' key.
 */

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // General
  name: process.env.APP_NAME || 'Kraft',
  logoUrl: process.env.APP_LOGO_URL || null,
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // JWT (JSON Web Tokens) — for authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '120d',
  },

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  // Paystack — Payment gateway
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
    callbackUrl:
      process.env.PAYSTACK_CALLBACK_URL ||
      'http://localhost:3000/payment/callback',
  },

  // OPay — Payment gateway (alternative to Paystack)
  opay: {
    secretKey: process.env.OPAY_SECRET_KEY,
    publicKey: process.env.OPAY_PUBLIC_KEY,
    merchantId: process.env.OPAY_MERCHANT_ID,
    baseUrl:
      process.env.OPAY_BASE_URL ||
      'https://sandboxapi.opaycheckout.com/api/v1/international/cashier',
    callbackUrl:
      process.env.OPAY_CALLBACK_URL ||
      'http://localhost:3000/payment/callback',
  },

  // Cloudinary — Image/video hosting
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Email — Resend (HTTP, recommended) or SMTP fallback
  resendApiKey: process.env.RESEND_API_KEY || null,
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    from:
      process.env.MAIL_FROM ||
      `${process.env.APP_NAME || 'Kraft'} <noreply@kraft.ng>`,
  },

  // Admin
  adminEmail: process.env.ADMIN_EMAIL || null,

  // Listing & Commission Settings
  listing: {
    freeListing: process.env.FREE_LISTING === 'true',
    noCommission: process.env.NO_COMMISSION === 'true',
    selfListingFeePercent:
      parseInt(process.env.SELF_LISTING_FEE_PERCENT, 10) || 5,
    consignmentCommissionPercent:
      parseInt(process.env.CONSIGNMENT_COMMISSION_PERCENT, 10) || 10,
    listingFeeCapKobo: parseInt(process.env.LISTING_FEE_CAP_KOBO, 10) || 500000,
    consignmentCommissionCapKobo:
      parseInt(process.env.CONSIGNMENT_COMMISSION_CAP_KOBO, 10) || 2000000,
  },

  // Media uploads (maxFileSize and maxFiles now come from platform settings)
  upload: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/quicktime',
    ],
  },
}));
