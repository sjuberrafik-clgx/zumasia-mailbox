import { WarningBanner } from '@zumasia/ui';
import { CLIP_TTL_MS, MAX_CLIP_FILE_BYTES } from '@zumasia/shared/clip';
import { ClipboardPanel } from '@/components/ClipboardPanel';

const TTL_MINUTES = Math.round(CLIP_TTL_MS / 60000);
const MAX_FILE_MB = Math.round(MAX_CLIP_FILE_BYTES / (1024 * 1024));

export const metadata = {
  title: 'Clipboard — share between devices',
  description: `Share text, images, and files between devices with a one-time 6-digit code. No account, auto-expires after ${TTL_MINUTES} minutes.`,
};

export default function ClipboardPage() {
  return (
    <div className="zm-container clip-page">
      <section className="clip-shell">
        <div className="clip-shell__copy">
          <img src="/clipboard-character.png" alt="Zumasia character with a clipboard" className="hero-character" />
          <p className="hero__eyebrow">Cross-device sharing</p>
          <h1>Move text, images, and files between your devices.</h1>
          <p>
            Send something from one device, get a 6-digit code, and pull it up on another. No
            account, no app — every clip is one-time use and clears automatically after {TTL_MINUTES}{' '}
            minutes.
          </p>
          <div className="home-shell__meta" aria-label="Clipboard features">
            <span>One-time code</span>
            <span>Burn after read</span>
            <span>{TTL_MINUTES}-minute expiry</span>
          </div>
        </div>

        <div className="clip-shell__panel">
          <div className="mail-shell__panel-head">
            <p className="product-card__kicker">Share now</p>
            <h2>Send or retrieve</h2>
          </div>
          <ClipboardPanel />
          <p className="home-mail-panel__note">
            Files up to {MAX_FILE_MB} MB. Best for quick, non-sensitive transfers only.
          </p>
        </div>
      </section>

      <div className="mail-info-grid">
        <div className="mail-page__notice">
          <WarningBanner title="One-time and short-lived">
            Anyone with the code can read a clip <strong>once</strong>. Codes burn on first use and
            expire after {TTL_MINUTES} minutes. Don't use Clipboard for passwords, financial, or
            otherwise sensitive data.
          </WarningBanner>
        </div>

        <section className="mail-page__guide">
          <h2>How it works</h2>
          <ol>
            <li>On the sending device, pick Text, Image, or File and add your content.</li>
            <li>Tap “Generate code” to get a one-time 6-digit code.</li>
            <li>On the other device, open Retrieve and enter the code.</li>
            <li>The clip opens once, then the code is used up.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
