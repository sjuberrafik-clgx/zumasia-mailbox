'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeLocalPart } from '@zumasia/shared/address';
import { MAIL_DOMAIN } from '@zumasia/shared/brand';

export function LookupForm() {
  const router = useRouter();
  const errorId = useId();
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
    <form className="lookup-form" onSubmit={onSubmit} noValidate>
      <div className={`lookup-form__control${error ? ' lookup-form__control--error' : ''}`}>
        <input
          type="text"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          placeholder="enter any mail"
          aria-label="Inbox name"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
        />
        <span className="domain-suffix">@{MAIL_DOMAIN}</span>
      </div>
      <button className="zm-button zm-button--primary lookup-form__submit" type="submit">
        Open inbox
      </button>
      {error ? (
        <span className="lookup-form__error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </form>
  );
}
