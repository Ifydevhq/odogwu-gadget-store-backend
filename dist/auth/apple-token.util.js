"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAppleIdentityToken = verifyAppleIdentityToken;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
let cachedKeys = null;
const KEYS_TTL_MS = 10 * 60 * 1000;
function base64UrlDecode(input) {
    const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
    return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}
async function getAppleKeys() {
    if (cachedKeys && Date.now() - cachedKeys.fetchedAt < KEYS_TTL_MS) {
        return cachedKeys.keys;
    }
    const res = await fetch(APPLE_KEYS_URL);
    if (!res.ok) {
        throw new common_1.UnauthorizedException('Could not fetch Apple public keys');
    }
    const data = (await res.json());
    if (!data?.keys?.length) {
        throw new common_1.UnauthorizedException('Apple public keys unavailable');
    }
    cachedKeys = { keys: data.keys, fetchedAt: Date.now() };
    return data.keys;
}
async function verifyAppleIdentityToken(identityToken, audiences) {
    if (!identityToken || typeof identityToken !== 'string') {
        throw new common_1.UnauthorizedException('Missing Apple identity token');
    }
    const parts = identityToken.split('.');
    if (parts.length !== 3) {
        throw new common_1.UnauthorizedException('Malformed Apple identity token');
    }
    const [headerB64, payloadB64, signatureB64] = parts;
    let header;
    let payload;
    try {
        header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
        payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
    }
    catch {
        throw new common_1.UnauthorizedException('Could not decode Apple identity token');
    }
    if (header.alg !== 'RS256') {
        throw new common_1.UnauthorizedException('Unexpected Apple token algorithm');
    }
    const keys = await getAppleKeys();
    let jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) {
        cachedKeys = null;
        jwk = (await getAppleKeys()).find((k) => k.kid === header.kid);
    }
    if (!jwk) {
        throw new common_1.UnauthorizedException('No matching Apple public key');
    }
    const publicKey = (0, crypto_1.createPublicKey)({ key: jwk, format: 'jwk' });
    const signingInput = Buffer.from(`${headerB64}.${payloadB64}`);
    const signature = base64UrlDecode(signatureB64);
    const valid = (0, crypto_1.verify)('sha256', signingInput, { key: publicKey, padding: crypto_1.constants.RSA_PKCS1_PADDING }, signature);
    if (!valid) {
        throw new common_1.UnauthorizedException('Invalid Apple token signature');
    }
    if (payload.iss !== APPLE_ISSUER) {
        throw new common_1.UnauthorizedException('Unexpected Apple token issuer');
    }
    if (!audiences.includes(payload.aud)) {
        throw new common_1.UnauthorizedException('Apple token was issued for another app');
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < nowSeconds) {
        throw new common_1.UnauthorizedException('Apple token has expired');
    }
    return payload;
}
//# sourceMappingURL=apple-token.util.js.map