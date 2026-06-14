import { MAIL_DOMAIN, RESERVED_LOCAL_PARTS } from './brand.ts';

const LOCAL_PART_REGEX = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

export type ParsedInbox = {
    localPart: string;
    fullAddress: string;
};

export function normalizeLocalPart(input: string): string | null {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return null;

    const at = trimmed.indexOf('@');
    let local = at === -1 ? trimmed : trimmed.slice(0, at);
    const domain = at === -1 ? MAIL_DOMAIN : trimmed.slice(at + 1);

    if (domain !== MAIL_DOMAIN) return null;

    const plus = local.indexOf('+');
    if (plus !== -1) local = local.slice(0, plus);

    if (!LOCAL_PART_REGEX.test(local)) return null;
    if (RESERVED_LOCAL_PARTS.has(local)) return null;

    return local;
}

export function parseInbox(input: string): ParsedInbox | null {
    const localPart = normalizeLocalPart(input);
    if (!localPart) return null;
    return { localPart, fullAddress: `${localPart}@${MAIL_DOMAIN}` };
}

export function fullAddressFromLocalPart(localPart: string): string {
    return `${localPart}@${MAIL_DOMAIN}`;
}
