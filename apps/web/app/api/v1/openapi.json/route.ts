import { buildOpenApiDocument } from '@/lib/openapi';

export const dynamic = 'force-static';

export function GET() {
  return new Response(JSON.stringify(buildOpenApiDocument()), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
