import { MAIL_DOMAIN, RESERVED_LOCAL_PARTS } from './brand.ts';

const LOCAL_PART_REGEX = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;
// Subaddress detail (the part after "+"). Allows the same characters as a base
// local part plus "+" so multi-segment tags like "john+shop+news" are accepted.
const TAG_REGEX = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/;
// RFC 5321 caps the local part at 64 octets.
const MAX_LOCAL_PART_LENGTH = 64;

export type ParsedInbox = {
  localPart: string;
  fullAddress: string;
};

export function normalizeLocalPart(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const at = trimmed.indexOf('@');
  const local = at === -1 ? trimmed : trimmed.slice(0, at);
  const domain = at === -1 ? MAIL_DOMAIN : trimmed.slice(at + 1);

  if (domain !== MAIL_DOMAIN) return null;
  if (local.length > MAX_LOCAL_PART_LENGTH) return null;

  const plus = local.indexOf('+');
  const base = plus === -1 ? local : local.slice(0, plus);
  const tag = plus === -1 ? null : local.slice(plus + 1);

  if (!LOCAL_PART_REGEX.test(base)) return null;
  if (RESERVED_LOCAL_PARTS.has(base)) return null;

  if (tag !== null) {
    if (!TAG_REGEX.test(tag)) return null;
    return `${base}+${tag}`;
  }

  return base;
}

export function parseInbox(input: string): ParsedInbox | null {
  const localPart = normalizeLocalPart(input);
  if (!localPart) return null;
  return { localPart, fullAddress: `${localPart}@${MAIL_DOMAIN}` };
}

export function fullAddressFromLocalPart(localPart: string): string {
  return `${localPart}@${MAIL_DOMAIN}`;
}
