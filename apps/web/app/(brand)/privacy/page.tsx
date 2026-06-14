export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="zm-container">
      <article className="zm-document">
        <h1>Privacy Policy</h1>
        <p>
          <strong>Last updated:</strong> June 2026
        </p>

        <h2>What we receive</h2>
        <ul>
          <li>
            <strong>Email content</strong> sent to <code>*@zumasia.com</code> by third parties. Stored
            temporarily (currently up to 24 hours) and made publicly readable to anyone who knows the
            inbox address.
          </li>
          <li>
            <strong>IP addresses</strong> for rate-limiting and abuse prevention. Stored ephemerally
            in our edge cache (Cloudflare) and not aggregated into user profiles.
          </li>
        </ul>

        <h2>What we do not collect</h2>
        <p>
          No accounts, no cookies for tracking, no analytics with personal identifiers, no sale or
          sharing of data with advertisers.
        </p>

        <h2>Retention</h2>
        <p>
          Email content and attachments are auto-purged within 48 hours of receipt (target: 24 hours).
          Server logs are retained briefly by Cloudflare per their standard policy.
        </p>

        <h2>Your rights</h2>
        <p>
          Because we do not associate inboxes with identities, GDPR / CCPA data-subject requests are
          limited in scope. To request immediate deletion of a specific inbox or message before it
          auto-purges, email <a href="mailto:privacy@zumasia.com">privacy@zumasia.com</a>.
        </p>
      </article>
    </div>
  );
}
