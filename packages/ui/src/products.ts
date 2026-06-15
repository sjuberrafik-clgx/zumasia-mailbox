export type ProductStatus = 'live' | 'soon' | 'planned';

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  status: ProductStatus;
  url: string;
};

export const products: readonly Product[] = [
  {
    slug: 'mail',
    name: 'Mail',
    tagline: 'Public temp inboxes for email workflow testing, QA verification, and developer signups.',
    status: 'live',
    url: '/mail',
  },
  {
    slug: 'clipboard',
    name: 'Clipboard',
    tagline: 'Share text, images, and files between devices with a one-time 6-digit code.',
    status: 'live',
    url: '/clipboard',
  },
] as const;

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
