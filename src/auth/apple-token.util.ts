/**
 * apple-token.util.ts — Verify "Sign in with Apple" identity tokens.
 * ==================================================================
 * An Apple identity token is a JWT signed by Apple (RS256). We verify it the
 * same way any OIDC id_token is verified, using only Node's built-in `crypto`
 * (no extra dependency):
 *
 *   1. Split the JWT and read its header to get the signing key id (`kid`).
 *   2. Fetch Apple's public keys (JWKS) from https://appleid.apple.com/auth/keys
 *      and pick the one whose `kid` matches.
 *   3. Verify the RS256 signature over `header.payload` with that public key.
 *   4. Validate the standard claims: issuer, audience (our app), expiry.
 *
 * On success we return the decoded payload, which contains:
 *   - sub              Apple's stable, unique user id
 *   - email            the user's email (real, or a private-relay address)
 *   - email_verified   "true" | true
 *   - is_private_email whether `email` is an Apple relay address
 */

import { UnauthorizedException } from '@nestjs/common';
import { createPublicKey, verify as cryptoVerify, constants } from 'crypto';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';

export interface AppleTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
  [key: string]: any;
}

interface AppleJwk {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

// Short-lived cache of Apple's JWKS so we don't fetch on every login.
let cachedKeys: { keys: AppleJwk[]; fetchedAt: number } | null = null;
const KEYS_TTL_MS = 10 * 60 * 1000; // 10 minutes

function base64UrlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

async function getAppleKeys(): Promise<AppleJwk[]> {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < KEYS_TTL_MS) {
    return cachedKeys.keys;
  }
  const res = await fetch(APPLE_KEYS_URL);
  if (!res.ok) {
    throw new UnauthorizedException('Could not fetch Apple public keys');
  }
  const data = (await res.json()) as { keys: AppleJwk[] };
  if (!data?.keys?.length) {
    throw new UnauthorizedException('Apple public keys unavailable');
  }
  cachedKeys = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

/**
 * Verify an Apple identity token and return its payload.
 *
 * @param identityToken the JWT from Sign in with Apple
 * @param audiences     the allowed `aud` values — the native app's bundle id
 *                      (and/or a Service ID for web). Any match passes.
 */
export async function verifyAppleIdentityToken(
  identityToken: string,
  audiences: string[],
): Promise<AppleTokenPayload> {
  if (!identityToken || typeof identityToken !== 'string') {
    throw new UnauthorizedException('Missing Apple identity token');
  }

  const parts = identityToken.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedException('Malformed Apple identity token');
  }
  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg: string; kid: string };
  let payload: AppleTokenPayload;
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
  } catch {
    throw new UnauthorizedException('Could not decode Apple identity token');
  }

  if (header.alg !== 'RS256') {
    throw new UnauthorizedException('Unexpected Apple token algorithm');
  }

  // Find the matching public key by key id.
  const keys = await getAppleKeys();
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    // Key may have rotated — force a refresh once.
    cachedKeys = null;
    jwk = (await getAppleKeys()).find((k) => k.kid === header.kid);
  }
  if (!jwk) {
    throw new UnauthorizedException('No matching Apple public key');
  }

  // Verify the RS256 signature over `header.payload`.
  const publicKey = createPublicKey({ key: jwk as any, format: 'jwk' });
  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);
  const valid = cryptoVerify(
    'sha256',
    signingInput,
    { key: publicKey, padding: constants.RSA_PKCS1_PADDING },
    signature,
  );
  if (!valid) {
    throw new UnauthorizedException('Invalid Apple token signature');
  }

  // Validate standard claims.
  if (payload.iss !== APPLE_ISSUER) {
    throw new UnauthorizedException('Unexpected Apple token issuer');
  }
  if (!audiences.includes(payload.aud)) {
    throw new UnauthorizedException('Apple token was issued for another app');
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < nowSeconds) {
    throw new UnauthorizedException('Apple token has expired');
  }

  return payload;
}
