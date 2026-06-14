export const metadata = { title: 'DMCA' };

export default function DmcaPage() {
  return (
    <div className="zm-container">
      <h1>DMCA / Copyright</h1>
      <p>
        Zumasia Mail receives email sent by third parties. We do not generate or curate message
        content. If you believe content held in a Zumasia inbox infringes your copyright, send a
        DMCA takedown notice to <a href="mailto:dmca@zumasia.com">dmca@zumasia.com</a> including:
      </p>
      <ol>
        <li>Identification of the copyrighted work claimed to have been infringed.</li>
        <li>The full inbox address and (if possible) message ID(s).</li>
        <li>Your contact information.</li>
        <li>
          A statement that you have a good-faith belief the use is unauthorized, and that the
          information in the notice is accurate, under penalty of perjury.
        </li>
        <li>Your physical or electronic signature.</li>
      </ol>
      <p>
        Note: messages are auto-purged within 48 hours regardless. Most takedown situations resolve
        themselves through retention.
      </p>
    </div>
  );
}
