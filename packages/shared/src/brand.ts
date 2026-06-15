export const BRAND_NAME = 'Zumasia';
export const BRAND_TAGLINE = 'Practical no-account tools for email workflow testing, QA checks, and developer workflows.';
export const MAIL_DOMAIN = 'zumasia.com';
export const MAIL_PRODUCT_NAME = 'Mail';
export const RETENTION_HOURS = 24;
export const MAX_MESSAGE_BYTES = 25 * 1024 * 1024;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const INBOX_LIST_LIMIT = 50;

export const RESERVED_LOCAL_PARTS = new Set([
  'postmaster',
  'abuse',
  'dmarc',
  'support',
  'hello',
  'admin',
  'dmca',
  'legal',
  'privacy',
  'noreply',
  'no-reply',
]);

export const BLOCKED_ATTACHMENT_EXTENSIONS = new Set([
  'exe',
  'scr',
  'bat',
  'cmd',
  'com',
  'msi',
  'pif',
  'js',
  'jse',
  'vbs',
  'vbe',
  'wsf',
  'ps1',
  'jar',
  'svg',
  'html',
  'htm',
]);
