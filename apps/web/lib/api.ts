import type { InboxResponse, MessageDetail } from '@zumasia/shared/schemas';

class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

async function getJson<T>(url: string): Promise<T> {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new ApiError(r.status, `${r.status} ${r.statusText}`);
    return (await r.json()) as T;
}

export function fetchInbox(localPart: string): Promise<InboxResponse> {
    return getJson<InboxResponse>(`/api/inbox/${encodeURIComponent(localPart)}`);
}

export function fetchMessage(id: string): Promise<MessageDetail> {
    return getJson<MessageDetail>(`/api/message/${encodeURIComponent(id)}`);
}
