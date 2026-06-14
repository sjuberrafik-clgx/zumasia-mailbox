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
    tagline: 'Public temp inboxes at *@zumasia.com — instant, no signup.',
    status: 'live',
    url: '/mail',
  },
  {
    slug: 'clipboard',
    name: 'Clipboard',
    tagline: 'Share text and snippets via short links. Auto-expires.',
    status: 'soon',
    url: 'https://clip.zumasia.com',
  },
] as const;

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
