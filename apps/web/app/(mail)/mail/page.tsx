import { WarningBanner } from '@zumasia/ui';
import { LookupForm } from '@/components/LookupForm';
import { MAIL_DOMAIN, RETENTION_HOURS } from '@zumasia/shared/brand';

export const metadata = {
  title: 'Mail — public temp inboxes',
  description: `Open a public temp inbox at *@${MAIL_DOMAIN} for email workflow testing, QA verification, and developer checks. No signup, auto-purge after ${RETENTION_HOURS}h.`,
};

export default function MailPage() {
  return (
    <div className="zm-container mail-page">
      <section className="mail-shell">
        <div className="mail-shell__copy">
          <p className="hero__eyebrow">QA and developer mail testing</p>
          <h1>Public inboxes for QA and developer email testing.</h1>
          <p>
            Use any address at @{MAIL_DOMAIN} to validate signups, transactional emails, notifications,
            and one-off workflow checks. Every inbox clears automatically after {RETENTION_HOURS} hours.
          </p>
          <div className="home-shell__meta" aria-label="Mail features">
            <span>QA teams</span>
            <span>Developer checks</span>
            <span>{RETENTION_HOURS}h retention</span>
          </div>
        </div>

        <div className="mail-shell__panel">
          <div className="mail-shell__panel-head">
            <p className="product-card__kicker">Inbox lookup</p>
            <h2>Open an inbox</h2>
          </div>
          <LookupForm />
          <p className="home-mail-panel__note">Best for disposable, non-sensitive mail only.</p>
        </div>
      </section>

      <div className="mail-info-grid">
        <div className="mail-page__notice">
          <WarningBanner title="Public — anyone can read this">
            Inboxes are <strong>not private</strong>. Anyone who knows or guesses the address can read
            every message. Don't use Zumasia Mail for anything personal, financial, medical, or
            otherwise sensitive.
          </WarningBanner>
        </div>

        <section className="mail-page__guide">
          <h2>How it works</h2>
          <ol>
            <li>
              Pick any address: <code>anything@{MAIL_DOMAIN}</code>.
            </li>
            <li>Use it for email workflow testing, QA verification, or a one-time developer check.</li>
            <li>Open the inbox here; it refreshes automatically.</li>
            <li>Messages disappear after {RETENTION_HOURS} hours.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
