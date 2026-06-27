import type { MessageDetail } from '@zumasia/shared/schemas';

// Matches absolute http/https URLs, stopping at whitespace, quotes and closing brackets.
const URL_REGEX = /https?:\/\/[^\s"'<>)\]}]+/gi;
const HTML_ATTR_REGEX = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&#x2f;/gi, '/')
    .replace(/&#47;/g, '/')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Extract de-duplicated, order-preserving absolute URLs from a message.
 * Prefers explicit anchor/src targets in the (sanitized) HTML body, then falls
 * back to any URL-like tokens in the HTML and plain-text bodies.
 */
export function extractLinks(detail: Pick<MessageDetail, 'htmlBody' | 'textBody'>): string[] {
  const seen = new Set<string>();
  const links: string[] = [];

  const add = (raw: string) => {
    const url = decodeEntities(raw.trim()).replace(/[.,;:]+$/, '');
    if (!url || !/^https?:\/\//i.test(url)) return;
    if (seen.has(url)) return;
    seen.add(url);
    links.push(url);
  };

  if (detail.htmlBody) {
    let match: RegExpExecArray | null;
    while ((match = HTML_ATTR_REGEX.exec(detail.htmlBody)) !== null) {
      const value = match[1];
      if (value) add(value);
    }
    HTML_ATTR_REGEX.lastIndex = 0;
    const loose = detail.htmlBody.match(URL_REGEX);
    if (loose) for (const url of loose) add(url);
  }

  if (detail.textBody) {
    const loose = detail.textBody.match(URL_REGEX);
    if (loose) for (const url of loose) add(url);
  }

  return links;
}
