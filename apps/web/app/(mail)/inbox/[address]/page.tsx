import { notFound } from 'next/navigation';
import { normalizeLocalPart } from '@zumasia/shared/address';
import { fullAddressFromLocalPart } from '@zumasia/shared/address';
import { InboxClient } from './InboxClient';

type Params = { address: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
    const { address } = await params;
    const local = normalizeLocalPart(decodeURIComponent(address));
    if (!local) return { title: 'Inbox not found' };
    return {
        title: `${local}@zumasia.com`,
        robots: { index: false, follow: false },
    };
}

export default async function InboxPage({ params }: { params: Promise<Params> }) {
    const { address } = await params;
    const local = normalizeLocalPart(decodeURIComponent(address));
    if (!local) notFound();
    return <InboxClient localPart={local} fullAddress={fullAddressFromLocalPart(local)} />;
}
