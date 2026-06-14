import type { ProductStatus } from '../products.ts';

const LABEL: Record<ProductStatus, string> = {
  live: 'Live',
  soon: 'Coming Soon',
  planned: 'Planned',
};

export function ProductBadge({ status }: { status: ProductStatus }) {
  return <span className={`zm-badge zm-badge--${status}`}>{LABEL[status]}</span>;
}
