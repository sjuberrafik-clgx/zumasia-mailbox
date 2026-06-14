import { Card, ProductBadge, products } from '@zumasia/ui';
import { BRAND_TAGLINE } from '@zumasia/shared/brand';

export default function HomePage() {
    return (
        <div className="zm-container">
            <section className="hero">
                <h1>Zumasia</h1>
                <p>{BRAND_TAGLINE} Free, fast, anonymous.</p>
            </section>

            <div className="products-grid">
                {products.map((p) => (
                    <Card key={p.slug} className="product-card">
                        <div className="product-card__head">
                            <h2>{p.name}</h2>
                            <ProductBadge status={p.status} />
                        </div>
                        <p>{p.tagline}</p>
                        {p.status === 'live' ? (
                            <a className="zm-button zm-button--primary" href={p.url}>
                                Open {p.name} →
                            </a>
                        ) : (
                            <span className="zm-button" aria-disabled="true">
                                Coming soon
                            </span>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
