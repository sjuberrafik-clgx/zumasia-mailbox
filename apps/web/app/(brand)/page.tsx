import { Card, ProductBadge, products } from '@zumasia/ui';
import { BRAND_TAGLINE } from '@zumasia/shared/brand';
import { LookupForm } from '@/components/LookupForm';

function HeroMailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Envelope Back */}
      <path d="M12 28C12 23.5817 15.5817 20 20 20H92C96.4183 20 100 23.5817 100 28V68C100 72.4183 96.4183 76 92 76H20C15.5817 76 12 72.4183 12 68V28Z" fill="#F59E0B" />

      {/* Envelope Flaps */}
      <path d="M12 28L56 54L100 28" fill="#FBBF24" />
      <path d="M12 76L42 54" stroke="#D97706" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M100 76L70 54" stroke="#D97706" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Motion Trails */}
      <path d="M18 108L42 84" stroke="#FB7185" strokeWidth="6" strokeLinecap="round" />
      <path d="M42 112L56 98" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" />

      {/* Paper Plane */}
      <path d="M36 78L108 42L72 104L62 78L36 78Z" fill="#7DD3FC" />
      <path d="M108 42L62 78L72 104L108 42Z" fill="#0284C7" />
      <path d="M36 78L108 42L62 78L36 78Z" fill="#38BDF8" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="zm-container home-page">
      <section className="home-shell">
        <div className="home-shell__copy">
          <img src="/character.png" alt="Zumasia character leaning" className="hero-character" />
          <p className="hero__eyebrow">Email workflow testing</p>
          <h1>Email workflow testing for QA teams and developers.</h1>
          <p>{BRAND_TAGLINE} Start with Mail to validate signups, transactional emails, and one-off test flows in seconds.</p>
          <div className="home-shell__meta" aria-label="Product qualities">
            <span>QA friendly</span>
            <span>Developer ready</span>
            <span>24h retention</span>
          </div>
        </div>

        <div className="home-mail-panel" aria-label="Open Zumasia Mail">
          <div className="home-mail-panel__head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <HeroMailIcon className="hero-mail-icon" />
              <div>
                <p className="product-card__kicker">Available now</p>
                <h2>Temporary Mail</h2>
              </div>
            </div>
            <ProductBadge status="live" />
          </div>
          <p>Open any public inbox at zumasia.com to test signup flows, delivery steps, and transactional email behavior.</p>
          <LookupForm />
          <p className="home-mail-panel__note">Every inbox is public and messages are removed automatically after 24 hours.</p>
        </div>
      </section>

      <section className="tools-section catalog-shell" aria-labelledby="tools-title">
        <div className="section-header section-header--stacked">
          <div className="section-header__copy">
            <p className="section-header__eyebrow">Product lineup</p>
            <h2 id="tools-title">Explore current and upcoming Zumasia tools.</h2>
            <p className="section-header__note">
              Zumasia.com is the landing page for the full product lineup, starting with Mail and
              expanding into more focused utilities over time.
            </p>
          </div>
        </div>

        <div className="products-grid">
          {products.map((p) => (
            <Card key={p.slug} className={`product-card product-card--${p.status}`}>
              <div className="product-card__head">
                <div>
                  <p className="product-card__kicker">Zumasia {p.name}</p>
                  <h2>{p.name}</h2>
                </div>
                <ProductBadge status={p.status} />
              </div>
              <p>{p.tagline}</p>
              <div className="product-card__actions">
                {p.status === 'live' ? (
                  <a className="zm-button zm-button--primary" href={p.url}>
                    Open {p.name}
                  </a>
                ) : (
                  <span className="zm-button" aria-disabled="true">
                    Coming soon
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
