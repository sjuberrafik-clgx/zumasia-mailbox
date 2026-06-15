import { ZumasiaLogo } from './ZumasiaLogo.tsx';

type HeaderProps = {
    homeHref?: string;
    productSlug?: string;
};

const primaryLinks = [
    { href: '/mail', label: 'Mail', tone: 'mail' },
    { href: '/clipboard', label: 'Clipboard', tone: 'clipboard' },
    { href: '/about', label: 'About', tone: 'about' },
];

export function ZumasiaHeader({ homeHref = '/', productSlug }: HeaderProps) {
    return (
        <header className="zm-header">
            <div className="zm-header__inner">
                <div className="zm-header__left">
                    <a href={homeHref} className="zm-header__brand" aria-label="Zumasia home">
                        <ZumasiaLogo size={40} variant="mark" />
                        <span className="zm-header__brand-name">zumasia</span>
                        {productSlug ? <span className="zm-header__brand-product">{productSlug}</span> : null}
                    </a>
                </div>

                <nav className="zm-header__nav" aria-label="Primary">
                    {primaryLinks.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className={`zm-header__nav-link zm-header__nav-link--${item.tone}`}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="zm-header__right">
                    <a href="/mail" className="zm-header__nav-link zm-header__nav-link--inboxes zm-header__utility-link">
                        Public inboxes
                    </a>
                    <a href="/mail" className="zm-button zm-button--primary zm-header__primary-action">
                        Open Mail
                    </a>

                    <details className="zm-header__menu">
                        <summary className="zm-header__toggle" aria-label="Toggle navigation menu">
                            <span className="zm-header__toggle-line" />
                            <span className="zm-header__toggle-line" />
                            <span className="zm-header__toggle-line" />
                        </summary>

                        <div className="zm-header__mobile-panel">
                            <div className="zm-header__mobile-section">
                                <p className="zm-header__mobile-label">Navigate</p>
                                <nav className="zm-header__mobile-nav" aria-label="Mobile primary">
                                    {primaryLinks.map((item) => (
                                        <a key={item.href} href={item.href} className="zm-header__mobile-link">
                                            {item.label}
                                        </a>
                                    ))}
                                </nav>
                            </div>

                            <div className="zm-header__mobile-section">
                                <p className="zm-header__mobile-label">Quick actions</p>
                                <div className="zm-header__mobile-actions">
                                    <a href="/mail" className="zm-button zm-button--primary">
                                        Open Mail
                                    </a>
                                    <a href="mailto:abuse@zumasia.com" className="zm-button">
                                        Report abuse
                                    </a>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </header>
    );
}
