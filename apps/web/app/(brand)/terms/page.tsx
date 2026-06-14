export const metadata = { title: 'Terms of Use' };

export default function TermsPage() {
  return (
    <div className="zm-container">
      <article className="zm-document">
        <h1>Terms of Use</h1>
        <p>
          <strong>Last updated:</strong> June 2026
        </p>

        <h2>1. Public service notice</h2>
        <p>
          The Zumasia Mail service is <strong>public</strong>. Any person who knows or guesses an
          inbox address can read every message in that inbox. Do <strong>not</strong> use Zumasia Mail
          for sensitive, personal, financial, medical, or otherwise private communications.
        </p>

        <h2>2. No account, no SLA</h2>
        <p>
          Zumasia is provided “as-is”, free of charge, with no warranty, no service-level agreement,
          no guarantee of availability, durability, or delivery. Messages are auto-purged after a
          short retention window (currently 24 hours).
        </p>

        <h2>3. Acceptable use</h2>
        <p>
          You agree not to use Zumasia to: (a) violate any law or third-party right; (b) harass,
          threaten, or impersonate anyone; (c) attempt unauthorized access to accounts you do not own
          (including using temp inboxes to bypass account security or recovery); (d) distribute
          malware, phishing content, or illegal content; (e) abuse the service through excessive
          automation, scraping, or denial-of-service techniques.
        </p>

        <h2>4. Modification and termination</h2>
        <p>
          We may, at our sole discretion, purge inboxes, block senders or recipients, or disable the
          service entirely, at any time, without notice.
        </p>

        <h2>5. Contact</h2>
        <p>
          Abuse reports: <a href="mailto:abuse@zumasia.com">abuse@zumasia.com</a>. DMCA:{' '}
          <a href="mailto:dmca@zumasia.com">dmca@zumasia.com</a>.
        </p>
      </article>
    </div>
  );
}
