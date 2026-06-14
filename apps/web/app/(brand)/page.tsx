import { Card, ProductBadge, products } from '@zumasia/ui';
import { BRAND_TAGLINE } from '@zumasia/shared/brand';
import { LookupForm } from '@/components/LookupForm';

export default function HomePage() {
  return (
    <div className="zm-container home-page">
      <section className="home-shell">
        <div className="home-shell__copy">
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
            <div>
              <p className="product-card__kicker">Available now</p>
              <h2>Mail</h2>
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
