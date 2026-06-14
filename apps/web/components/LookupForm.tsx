'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeLocalPart } from '@zumasia/shared/address';
import { MAIL_DOMAIN } from '@zumasia/shared/brand';

export function LookupForm() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const local = normalizeLocalPart(value);
    if (!local) {
      setError('Use letters, numbers, dots, dashes, or underscores. Reserved names are blocked.');
      return;
    }
    router.push(`/inbox/${encodeURIComponent(local)}`);
  }

  return (
    <form className="lookup-form" onSubmit={onSubmit}>
      <input
        type="text"
        inputMode="email"
        autoComplete="off"
        spellCheck={false}
        placeholder="anything"
        aria-label="Inbox name"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
      />
      <span className="domain-suffix">@{MAIL_DOMAIN}</span>
      <button className="zm-button zm-button--primary" type="submit">
        Open
      </button>
      {error ? (
        <span role="alert" style={{ color: 'var(--zm-danger)', fontSize: 13, width: '100%' }}>
          {error}
        </span>
      ) : null}
    </form>
  );
}
