export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="zm-container">
      <article className="zm-document">
        <h1>About Zumasia</h1>
        <p>
          Zumasia builds no-account tools for email workflow testing, QA checks, and fast developer
          verification flows.
        </p>
        <p>
          Today: <a href="/mail">Mail</a> — public temp inboxes for signup flows, transactional email
          checks, and throwaway developer testing. Coming soon: Clipboard (paste-bin with short links),
          Notes, and more.
        </p>
        <p>
          Questions or abuse reports? Email <a href="mailto:hello@zumasia.com">hello@zumasia.com</a>{' '}
          or <a href="mailto:abuse@zumasia.com">abuse@zumasia.com</a>.
        </p>
      </article>
    </div>
  );
}
