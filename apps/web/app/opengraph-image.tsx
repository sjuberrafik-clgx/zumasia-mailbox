import { ImageResponse } from 'next/og';

export const alt = 'Zumasia — free temp mail and cross-device clipboard';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Dynamically generated Open Graph / social share image (1200x630).
 *
 * Uses next/og's bundled default font so no remote font fetch is needed at the
 * edge. Kept to simple flex layout + solid colors for workerd compatibility.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0b0d10',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '88px',
              height: '88px',
              borderRadius: '20px',
              background: '#6ee7b7',
              color: '#0b0d10',
              fontSize: '56px',
              fontWeight: 800,
            }}
          >
            Z
          </div>
          <div style={{ color: '#e8edf2', fontSize: '52px', fontWeight: 700 }}>zumasia</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ color: '#ffffff', fontSize: '68px', fontWeight: 800, lineHeight: 1.1 }}>
            Free temp mail &amp; cross-device clipboard
          </div>
          <div style={{ color: '#9aa5b1', fontSize: '34px', lineHeight: 1.3 }}>
            Disposable email inboxes for QA and developers. Share text, images, and files between
            devices — no account.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          {['No account', 'Auto-deletes', 'Built for testing'].map((tag) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                color: '#6ee7b7',
                fontSize: '26px',
                fontWeight: 600,
                padding: '10px 22px',
                border: '2px solid #1a1f25',
                borderRadius: '999px',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
