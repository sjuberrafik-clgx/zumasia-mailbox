import type { Metadata } from 'next';
import { ApiDocsClient } from './ApiDocsClient';

export const metadata: Metadata = {
  title: 'Mail Automation API',
  description:
    'REST API reference for automating email checks against Zumasia public inboxes — built for QA and developer workflows.',
};

export default function ApiDocsPage() {
  return (
    <>
      <div className="zm-container" style={{ paddingTop: 24 }}>
        <p className="hero__eyebrow">Mail Automation API</p>
        <p className="api-access__note">
          Need a token? <a href="/api-access">Request API access</a>.
        </p>
      </div>
      <ApiDocsClient />
    </>
  );
}
