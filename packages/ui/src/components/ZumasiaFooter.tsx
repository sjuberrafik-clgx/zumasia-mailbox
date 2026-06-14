export function ZumasiaFooter() {
    const year = new Date().getFullYear();
    return (
        <footer className="zm-footer">
            <div className="zm-footer__row">
                <span>© {year} Zumasia</span>
                <nav className="zm-footer__links" aria-label="Legal">
                    <a href="/about">About</a>
                    <a href="/terms">Terms</a>
                    <a href="/privacy">Privacy</a>
                    <a href="/dmca">DMCA</a>
                    <a href="mailto:abuse@zumasia.com">Abuse</a>
                </nav>
            </div>
        </footer>
    );
}
