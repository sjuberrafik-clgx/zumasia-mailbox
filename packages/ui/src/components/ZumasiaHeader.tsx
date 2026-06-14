import { ZumasiaLogo } from './ZumasiaLogo.tsx';

type HeaderProps = {
  homeHref?: string;
  productSlug?: string;
};

export function ZumasiaHeader({ homeHref = '/', productSlug }: HeaderProps) {
  return (
    <header className="zm-header">
      <div className="zm-header__inner">
        <a href={homeHref} className="zm-header__brand" aria-label="Zumasia home">
          <ZumasiaLogo />
          <span className="zm-header__brand-text">
            Zumasia
            {productSlug ? <span className="zm-header__brand-product">{productSlug}</span> : null}
          </span>
        </a>
        <nav className="zm-header__nav" aria-label="Primary">
          <a href="/mail">Mail</a>
          <a href="/about">About</a>
        </nav>
      </div>
    </header>
  );
}
