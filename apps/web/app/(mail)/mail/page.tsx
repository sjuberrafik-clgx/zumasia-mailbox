import { WarningBanner } from '@zumasia/ui';
import { LookupForm } from '@/components/LookupForm';
import { MAIL_DOMAIN, RETENTION_HOURS } from '@zumasia/shared/brand';

export const metadata = {
  title: 'Mail — public temp inboxes',
  description: `Type any name to open a public temp inbox at *@${MAIL_DOMAIN}. No signup, auto-purge after ${RETENTION_HOURS}h.`,
};

export default function MailPage() {
  return (
    <div className="zm-container">
      <section className="hero">
        <h1>Public temp inboxes</h1>
        <p>
          Type any name. Anyone can read what arrives at it. Messages auto-delete after{' '}
          {RETENTION_HOURS} hours.
        </p>
        <LookupForm />
      </section>

      <div style={{ maxWidth: 720, margin: 'var(--zm-space-xl) auto 0' }}>
        <WarningBanner title="Public — anyone can read this">
          Inboxes are <strong>not private</strong>. Anyone who knows or guesses the address can read
          every message. Don't use Zumasia Mail for anything personal, financial, medical, or
          otherwise sensitive.
        </WarningBanner>
      </div>

      <section style={{ maxWidth: 720, margin: 'var(--zm-space-xl) auto 0' }}>
        <h2>How it works</h2>
        <ol>
          <li>
            Pick any address: <code>anything@{MAIL_DOMAIN}</code>.
          </li>
          <li>Use it to sign up, test a workflow, or receive a one-off message.</li>
          <li>Open the inbox here — it refreshes automatically.</li>
          <li>Messages disappear after {RETENTION_HOURS} hours.</li>
        </ol>
      </section>
    </div>
  );
}
