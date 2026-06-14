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
    description: 'Zumasia is a family of tiny, useful, no-account web tools. Start with Mail.',
    robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <ZumasiaHeader />
                <main>{children}</main>
                <ZumasiaFooter />
            </body>
        </html>
    );
}
