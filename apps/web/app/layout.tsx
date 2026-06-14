import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ZumasiaHeader, ZumasiaFooter } from '@zumasia/ui';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://zumasia.com'),
  title: {
    default: 'Zumasia — useful tiny tools',
    template: '%s · Zumasia',
  },
  description:
    'Zumasia builds no-account tools for email workflow testing, starting with public temp mail for QA teams and developers.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="zm-app">
        <ZumasiaHeader />
        <main className="zm-main">{children}</main>
        <ZumasiaFooter />
      </body>
    </html>
  );
}
