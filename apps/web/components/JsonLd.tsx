/**
 * Renders a JSON-LD structured-data script tag.
 *
 * Server component only; the serialized payload is static markup so it streams
 * with the HTML and is visible to crawlers without client JS.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is trusted, build-time content (no user input).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
