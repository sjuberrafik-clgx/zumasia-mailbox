import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ZumasiaHeader, ZumasiaFooter } from '@zumasia/ui';
import { SITE_URL } from '@zumasia/shared/brand';
import { GreetingBanner } from '@/components/GreetingBanner';
import { JsonLd } from '@/components/JsonLd';
import './globals.css';

const DESCRIPTION =
  'Free temporary email inboxes and a cross-device clipboard for QA teams and developers. Test signups, 2FA, and transactional email, or share text and files between devices — no account, auto-deletes.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Free Temp Mail & Disposable Email for QA Testing — Zumasia',
    template: '%s · Zumasia',
  },
  description: DESCRIPTION,
  applicationName: 'Zumasia',
  keywords: [
    'disposable mail',
    'disposable mailbox',
    'temporary mail',
    'temporary mailbox',
    'temp mail',
    'temporary email',
    'disposable email',
    'public inbox',
    'online clipboard',
    'clipboard online',
    'share text online',
    'share files between devices',
    'cross-device clipboard',
    'useful tiny tools',
    'email testing',
    'QA email testing',
    'transactional email testing',
  ],
  alternates: { canonical: '/' },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'Zumasia',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="zm-app">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organization`,
                name: 'Zumasia',
                url: SITE_URL,
                logo: `${SITE_URL}/favicon.svg`,
                description:
                  'Zumasia builds free, no-account tools for email workflow testing and cross-device sharing.',
              },
              {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                name: 'Zumasia',
                url: SITE_URL,
                publisher: { '@id': `${SITE_URL}/#organization` },
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: `${SITE_URL}/inbox/{search_term_string}`,
                  },
                  query: 'required',
                  'query-input': 'required name=search_term_string',
                },
              },
            ],
          }}
        />
        <ZumasiaHeader />
        <GreetingBanner />
        <main className="zm-main">{children}</main>
        <ZumasiaFooter />
      </body>
    </html>
  );
}
