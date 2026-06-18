export const metadata = {
  title: 'About',
  description:
    'Zumasia builds free, no-account tools for email workflow testing and cross-device sharing — public temp mail and a clipboard, with more utilities coming.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="zm-container">
      <article className="zm-document">
        <h1>About Zumasia</h1>
        <p>
          Zumasia builds free, no-account tools for email workflow testing, QA checks, and fast
          developer verification flows. No signups, no installs — open a tool and go.
        </p>
        <p>
          <a href="/mail">Mail</a> gives you public temp mail and disposable email inboxes for testing
          signup flows, transactional email checks, 2FA codes, and throwaway developer testing. Every
          inbox is public and clears automatically, so it's built for non-sensitive, short-lived mail.
        </p>
        <p>
          <a href="/clipboard">Clipboard</a> lets you share text, images, and files between devices with
          a one-time 6-digit code — handy when you need to move a snippet or file from your phone to your
          laptop without emailing it to yourself. More focused utilities are on the way.
        </p>
        <p>
          Questions or abuse reports? Email <a href="mailto:hello@zumasia.com">hello@zumasia.com</a>{' '}
          or <a href="mailto:abuse@zumasia.com">abuse@zumasia.com</a>.
        </p>
      </article>
    </div>
  );
}
