import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/'], disallow: ['/inbox/', '/api/', '/admin/'] }],
    sitemap: 'https://zumasia.com/sitemap.xml',
  };
}
