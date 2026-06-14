export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="zm-container">
      <h1>About Zumasia</h1>
      <p>
        Zumasia is a family of tiny, useful, no-account web tools — built to be free, fast, and
        disposable. Think of it as a Swiss-army knife of web utilities.
      </p>
      <p>
        Today: <a href="/mail">Mail</a> — public temp inboxes for testing and throwaway signups.
        Coming soon: Clipboard (paste-bin with short links), Notes, and more.
      </p>
      <p>
        Questions or abuse reports? Email <a href="mailto:hello@zumasia.com">hello@zumasia.com</a>{' '}
        or <a href="mailto:abuse@zumasia.com">abuse@zumasia.com</a>.
      </p>
    </div>
  );
}
