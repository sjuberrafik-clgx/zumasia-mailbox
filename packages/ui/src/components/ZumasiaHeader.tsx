import { ZumasiaLogo } from './ZumasiaLogo.tsx';

type HeaderProps = {
    homeHref?: string;
    productSlug?: string;
};

export function ZumasiaHeader({ homeHref = '/', productSlug }: HeaderProps) {
    return (
        <header className="zm-header">
            <a href={homeHref} className="zm-header__brand" aria-label="Zumasia home">
                <ZumasiaLogo />
                <span>Zumasia{productSlug ? ` · ${productSlug}` : ''}</span>
            </a>
            <nav className="zm-header__nav" aria-label="Primary">
                <a href="/mail">Mail</a>
                <a href="/about">About</a>
            </nav>
        </header>
    );
}
