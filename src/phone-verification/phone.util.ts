/**
 * phone-verification/phone.util.ts
 * =================================
 * Normalizes Nigerian phone numbers to E.164 format (`+234...`).
 *
 * Accepts the common shapes users type:
 *   0803 123 4567   → +2348031234567   (national, leading 0)
 *   +2348031234567  → +2348031234567   (already E.164)
 *   2348031234567   → +2348031234567   (country code, no +)
 *   8031234567      → +2348031234567   (bare 10-digit subscriber number)
 *
 * Nigerian mobile subscriber numbers are 10 digits after the country code and
 * begin with 7, 8, or 9. Anything else is rejected with a BadRequestException.
 */

import { BadRequestException } from '@nestjs/common';

export function normalizeNigerianPhone(input: string): string {
  if (input == null || String(input).trim() === '') {
    throw new BadRequestException('Phone number is required');
  }

  // Strip spaces, dashes, parentheses and dots.
  let raw = String(input).trim().replace(/[\s\-().]/g, '');

  // Allow a single leading '+', then require digits only.
  const hadPlus = raw.startsWith('+');
  if (hadPlus) raw = raw.slice(1);

  if (!/^\d+$/.test(raw)) {
    throw new BadRequestException('Invalid phone number');
  }

  let national: string;
  if (raw.startsWith('234')) {
    national = raw.slice(3);
  } else if (raw.startsWith('0')) {
    national = raw.slice(1);
  } else if (raw.length === 10) {
    national = raw;
  } else {
    throw new BadRequestException('Invalid Nigerian phone number');
  }

  // Subscriber number: exactly 10 digits, starting 7/8/9.
  if (!/^[789]\d{9}$/.test(national)) {
    throw new BadRequestException('Invalid Nigerian phone number');
  }

  return `+234${national}`;
}
