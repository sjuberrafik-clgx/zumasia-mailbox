import { ZumasiaLogo } from './ZumasiaLogo.tsx';

const productLinks = [
  { href: '/mail', label: 'Mail' },
  { href: '#', label: 'Clipboard', disabled: true },
];

const companyLinks = [
  { href: '/about', label: 'About' },
  { href: 'mailto:abuse@zumasia.com', label: 'Abuse contact' },
];

const legalLinks = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/dmca', label: 'DMCA' },
];

export function ZumasiaFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="zm-footer">
      <div className="zm-footer__top">
        <div className="zm-footer__brand-block">
          <a href="/" className="zm-footer__brand" aria-label="Zumasia home">
            <ZumasiaLogo size={44} variant="mark" />
            <span className="zm-footer__brand-name">zumasia</span>
          </a>
          <p className="zm-footer__summary">
            Public temp mail for email workflow testing, QA verification, and developer workflows.
          </p>
        </div>

        <div className="zm-footer__columns">
          <div className="zm-footer__column">
            <p className="zm-footer__heading">Product</p>
            <div className="zm-footer__column-links">
              {productLinks.map((item) =>
                item.disabled ? (
                  <span key={item.label} className="zm-footer__muted-link" aria-disabled="true">
                    {item.label}
                  </span>
                ) : (
                  <a key={item.href} href={item.href}>
                    {item.label}
                  </a>
                ),
              )}
            </div>
          </div>

          <div className="zm-footer__column">
            <p className="zm-footer__heading">Company</p>
            <div className="zm-footer__column-links">
              {companyLinks.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="zm-footer__column">
            <p className="zm-footer__heading">Legal</p>
            <div className="zm-footer__column-links">
              {legalLinks.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="zm-footer__bottom">
        <div className="zm-footer__bottom-copy">
          <p className="zm-footer__meta">
            © {year} <strong className="zm-footer__meta-brand">Zumasia</strong>. Public inboxes are
            readable by anyone with the address.
          </p>
          <p className="zm-footer__credit">
            <span className="zm-footer__credit-icon" aria-hidden>
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8 13.6L7.09 12.77C3.86 9.84 1.75 7.93 1.75 5.58C1.75 3.67 3.25 2.2 5.13 2.2C6.19 2.2 7.21 2.69 8 3.46C8.79 2.69 9.81 2.2 10.87 2.2C12.75 2.2 14.25 3.67 14.25 5.58C14.25 7.93 12.14 9.84 8.91 12.77L8 13.6Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Crafted with care in India by Mr. Z.
          </p>
        </div>
        <nav className="zm-footer__links" aria-label="Footer quick links">
          <a href="/mail">Open Mail</a>
          <a href="/about">About</a>
          <a href="mailto:abuse@zumasia.com">abuse@zumasia.com</a>
        </nav>
      </div>
    </footer>
  );
}
