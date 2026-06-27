import type { Metadata } from 'next';
import { ApiAccessClient } from './ApiAccessClient';

export const metadata: Metadata = {
  title: 'Get an API token',
  description:
    'Request and claim an API token for the Zumasia Mail automation API. Access is granted after admin approval.',
  robots: { index: true, follow: true },
};

export default function ApiAccessPage() {
  return <ApiAccessClient />;
}
