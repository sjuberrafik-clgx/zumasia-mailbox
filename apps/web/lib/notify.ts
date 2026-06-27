import type { Bindings } from './cf';

export type TokenRequestSummary = {
  id: string;
  label: string | null;
  contact: string | null;
  reason: string | null;
  createdAt: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Email the admin about a new API token request, including a signed review link.
 * No-ops (returns false) unless RESEND_API_KEY, ADMIN_NOTIFY_TO and NOTIFY_FROM are
 * all configured, so the request flow never depends on email being set up.
 */
export async function sendTokenRequestNotification(
  env: Pick<Bindings, 'RESEND_API_KEY' | 'ADMIN_NOTIFY_TO' | 'NOTIFY_FROM'>,
  request: TokenRequestSummary,
  reviewUrl: string,
): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;
  const to = env.ADMIN_NOTIFY_TO;
  const from = env.NOTIFY_FROM;
  if (!apiKey || !to || !from) return false;

  const label = request.label || '(no label)';
  const contact = request.contact || '(no contact)';
  const reason = request.reason || '(no reason given)';
  const when = new Date(request.createdAt).toISOString();
  const subject = `New API token request: ${label}`;

  const text = [
    'A new Zumasia Mail API token request is awaiting review.',
    '',
    `Label:   ${label}`,
    `Contact: ${contact}`,
    `Reason:  ${reason}`,
    `Request: ${request.id}`,
    `When:    ${when}`,
    '',
    `Review & decide: ${reviewUrl}`,
  ].join('\n');

  const html = `<!doctype html><html><body style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#0f172a">
  <h2 style="margin:0 0 12px">New API token request</h2>
  <table style="border-collapse:collapse;font-size:14px">
    <tr><td style="padding:2px 12px 2px 0;color:#64748b">Label</td><td><strong>${escapeHtml(label)}</strong></td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#64748b">Contact</td><td>${escapeHtml(contact)}</td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#64748b">Reason</td><td>${escapeHtml(reason)}</td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#64748b">Request</td><td>${escapeHtml(request.id)}</td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#64748b">When</td><td>${escapeHtml(when)}</td></tr>
  </table>
  <p style="margin:18px 0">
    <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#10b981;color:#04130d;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px">Review &amp; decide</a>
  </p>
  <p style="color:#64748b;font-size:12px">This link lets you approve or deny this one request and expires in 7 days.</p>
  </body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
