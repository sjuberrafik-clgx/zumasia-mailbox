import { NextResponse } from 'next/server';
import { resolveGreeting } from '@zumasia/shared';
import { getGeo } from '@/lib/cf';

export const dynamic = 'force-dynamic';

/**
 * Returns the native-language greeting pack for the visitor's location.
 *
 * In development, `?country=` and `?region=` query params override the detected
 * geo so the banner can be exercised without a real Cloudflare edge.
 */
export function GET(req: Request) {
    let { country, region } = getGeo(req);

    if (process.env.NODE_ENV !== 'production') {
        const url = new URL(req.url);
        country = url.searchParams.get('country') ?? country;
        region = url.searchParams.get('region') ?? region;
    }

    const pack = resolveGreeting({ country, region });

    return NextResponse.json(
        { pack, country, region },
        { headers: { 'cache-control': 'no-store' } },
    );
}
