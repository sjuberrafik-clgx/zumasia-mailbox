import type { Metadata } from 'next';
import { verifyReviewToken } from '@/lib/adminLink';
import { bindings } from '@/lib/cf';
import { getRequest } from '@/lib/tokenRequests';
import { ReviewClient } from './ReviewClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review API token request',
  robots: { index: false, follow: false },
};

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const exp = typeof sp.exp === 'string' ? sp.exp : '';
  const sig = typeof sp.sig === 'string' ? sp.sig : '';

  const env = bindings();
  const valid = await verifyReviewToken(env, id, exp, sig);
  if (!valid) {
    return (
      <div className="zm-container api-access">
        <header className="api-access__head">
          <h1>Link invalid or expired</h1>
          <p>This review link is no longer valid. Ask the requester to submit again, or use the admin API.</p>
        </header>
      </div>
    );
  }

  const row = await getRequest(env, id);
  if (!row) {
    return (
      <div className="zm-container api-access">
        <header className="api-access__head">
          <h1>Request not found</h1>
          <p>This token request no longer exists.</p>
        </header>
      </div>
    );
  }

  return (
    <ReviewClient
      id={id}
      exp={exp}
      sig={sig}
      label={row.label}
      contact={row.contact}
      reason={row.reason}
      status={row.status}
    />
  );
}
