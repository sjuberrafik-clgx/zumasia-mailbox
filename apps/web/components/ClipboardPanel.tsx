'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  CLIP_CODE_LENGTH,
  CLIP_TTL_MS,
  MAX_CLIP_FILE_BYTES,
  type ClipRetrieveResponse,
} from '@zumasia/shared/clip';
import { createClip, retrieveClip } from '@/lib/api';

type Mode = 'send' | 'retrieve';
type SendKind = 'text' | 'image' | 'file';

type SentClip = { code: string; expiresAt: number; kind: SendKind };

const ERROR_COPY: Record<string, string> = {
  empty_text: 'Type or paste something to share first.',
  text_too_large: 'That text is too large. Keep it under 100 KB.',
  missing_file: 'Choose a file to share first.',
  file_too_large: `That file is too large. Keep it under ${formatBytes(MAX_CLIP_FILE_BYTES)}.`,
  blocked_type: 'That file type is not allowed for safety reasons.',
  unsupported_image: 'Use a PNG, JPEG, GIF, or WebP image.',
  rate_limited: 'Too many requests. Wait a moment and try again.',
  not_found: 'That code is invalid, already used, or expired.',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function errorMessage(err: unknown, fallback: string): string {
  const status = (err as { status?: number }).status;
  if (status === 429) return ERROR_COPY.rate_limited!;
  if (status === 404) return ERROR_COPY.not_found!;
  return fallback;
}

function useCountdown(expiresAt: number | null): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return remaining;
}

function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const ICONS = {
  text: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  image: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  file: (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  )
};

export function ClipboardPanel() {
  const [mode, setMode] = useState<Mode>('send');

  return (
    <div className="clip-panel">
      <div className="clip-tabs" role="tablist" aria-label="Clipboard mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'send'}
          className={`clip-tab${mode === 'send' ? ' clip-tab--active' : ''}`}
          onClick={() => setMode('send')}
        >
          Send
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'retrieve'}
          className={`clip-tab${mode === 'retrieve' ? ' clip-tab--active' : ''}`}
          onClick={() => setMode('retrieve')}
        >
          Retrieve
        </button>
      </div>

      {mode === 'send' ? <SendView /> : <RetrieveView />}
    </div>
  );
}

function SendView() {
  const [kind, setKind] = useState<SendKind>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<SentClip | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = useCountdown(sent?.expiresAt ?? null);
  useEffect(() => {
    if (sent && Date.now() >= sent.expiresAt) setSent(null);
  }, [sent, remaining]);

  function reset() {
    setSent(null);
    setText('');
    setFile(null);
    setError(null);
    setCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function switchKind(next: SendKind) {
    setKind(next);
    setError(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const form = new FormData();
    form.set('kind', kind);
    if (kind === 'text') {
      if (!text.trim()) {
        setError(ERROR_COPY.empty_text!);
        return;
      }
      form.set('text', text);
    } else {
      if (!file) {
        setError(ERROR_COPY.missing_file!);
        return;
      }
      if (file.size > MAX_CLIP_FILE_BYTES) {
        setError(ERROR_COPY.file_too_large!);
        return;
      }
      form.set('file', file);
    }

    setBusy(true);
    try {
      const res = await createClip(form);
      setSent({ code: res.code, expiresAt: res.expiresAt, kind });
    } catch (err) {
      setError(errorMessage(err, 'Could not create a share code. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function onPasteImage() {
    setError(null);
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          const ext = type.split('/')[1] || 'png';
          setFile(new File([blob], `pasted.${ext}`, { type }));
          return;
        }
      }
      setError('No image found on your clipboard.');
    } catch {
      setError('Clipboard access was blocked. Choose an image instead.');
    }
  }

  async function copyCode() {
    if (!sent) return;
    try {
      await navigator.clipboard.writeText(sent.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (sent) {
    return (
      <div className="clip-result clip-result--code">
        <p className="clip-result__label">Share this code on your other device</p>
        <div className="clip-code-display" aria-label={`Code ${sent.code.split('').join(' ')}`}>
          {sent.code.split('').map((d, i) => (
            <span key={i} className="clip-code-digit">
              {d}
            </span>
          ))}
        </div>
        <p className="clip-result__timer" data-low={remaining < 60 * 1000 ? 'true' : 'false'}>
          Expires in {formatCountdown(remaining)} · one-time use
        </p>
        <div className="clip-result__actions">
          <button type="button" className="zm-button zm-button--primary" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy code'}
          </button>
          <button type="button" className="zm-button" onClick={reset}>
            Share another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="clip-form" onSubmit={onSubmit}>
      <div className="clip-kinds" role="tablist" aria-label="Content type">
        {(['text', 'image', 'file'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            className={`clip-kind${kind === k ? ' clip-kind--active' : ''}`}
            onClick={() => switchKind(k)}
          >
            {ICONS[k]}
            <span>{k === 'text' ? 'Text' : k === 'image' ? 'Image' : 'File'}</span>
          </button>
        ))}
      </div>

      {kind === 'text' ? (
        <textarea
          className="clip-textarea"
          placeholder="Type or paste any text, link, or snippet…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          aria-label="Text to share"
        />
      ) : (
        <div className="clip-dropzone">
          <input
            ref={fileInputRef}
            type="file"
            className="clip-dropzone__input"
            accept={kind === 'image' ? 'image/png,image/jpeg,image/gif,image/webp' : undefined}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            aria-label={kind === 'image' ? 'Choose an image' : 'Choose a file'}
          />
          <div className="clip-dropzone__body">
            {file ? (
              <>
                <span className="clip-dropzone__name">{file.name}</span>
                <span className="clip-dropzone__meta">{formatBytes(file.size)}</span>
              </>
            ) : (
              <>
                <span className="clip-dropzone__title">
                  Choose {kind === 'image' ? 'an image' : 'a file'} or drop it here
                </span>
                <span className="clip-dropzone__meta">Up to {formatBytes(MAX_CLIP_FILE_BYTES)}</span>
              </>
            )}
          </div>
          {kind === 'image' ? (
            <button type="button" className="clip-dropzone__paste" onClick={onPasteImage}>
              Paste from clipboard
            </button>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="clip-alert" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="zm-button zm-button--primary clip-submit" disabled={busy}>
        {busy ? 'Preparing…' : 'Share'}
      </button>
    </form>
  );
}

function RetrieveView() {
  const codeId = useId();
  const [digits, setDigits] = useState<string[]>(Array(CLIP_CODE_LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClipRetrieveResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join('');

  const submit = useCallback(async (value: string) => {
    setError(null);
    setBusy(true);
    try {
      const res = await retrieveClip(value);
      setResult(res);
    } catch (err) {
      setError(errorMessage(err, 'Could not retrieve this code. Try again.'));
    } finally {
      setBusy(false);
    }
  }, []);

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits((prev) => prev.map((d, i) => (i === index ? '' : d)));
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      // Support pasting a full code into one box.
      if (clean.length > 1) {
        for (let i = 0; i < clean.length && index + i < CLIP_CODE_LENGTH; i++) {
          next[index + i] = clean[i]!;
        }
        const last = Math.min(index + clean.length, CLIP_CODE_LENGTH - 1);
        inputsRef.current[last]?.focus();
      } else {
        next[index] = clean;
        if (index < CLIP_CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus();
      }
      return next;
    });
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setDigits(Array(CLIP_CODE_LENGTH).fill(''));
    setCopied(false);
    inputsRef.current[0]?.focus();
  }

  async function copyText() {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length === CLIP_CODE_LENGTH) void submit(code);
  }

  if (result) {
    return (
      <div className="clip-result">
        {result.kind === 'text' ? (
          <>
            <p className="clip-result__label">Shared text</p>
            <pre className="clip-text-out">{result.text}</pre>
            <div className="clip-result__actions">
              <button type="button" className="zm-button zm-button--primary" onClick={copyText}>
                {copied ? 'Copied' : 'Copy text'}
              </button>
              <button type="button" className="zm-button" onClick={reset}>
                Retrieve another
              </button>
            </div>
          </>
        ) : result.isImage && result.blobUrl ? (
          <>
            <p className="clip-result__label">Shared image</p>
            <img className="clip-image-out" src={result.blobUrl} alt={result.filename ?? 'Shared image'} />
            <div className="clip-result__actions">
              <a
                className="zm-button zm-button--primary"
                href={result.blobUrl}
                download={result.filename ?? 'image'}
              >
                Download
              </a>
              <button type="button" className="zm-button" onClick={reset}>
                Retrieve another
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="clip-result__label">Shared file</p>
            <div className="clip-file-out">
              <span className="clip-file-out__name">{result.filename ?? 'download'}</span>
              {result.sizeBytes ? (
                <span className="clip-file-out__meta">{formatBytes(result.sizeBytes)}</span>
              ) : null}
            </div>
            <div className="clip-result__actions">
              {result.blobUrl ? (
                <a
                  className="zm-button zm-button--primary"
                  href={result.blobUrl}
                  download={result.filename ?? 'download'}
                >
                  Download
                </a>
              ) : null}
              <button type="button" className="zm-button" onClick={reset}>
                Retrieve another
              </button>
            </div>
          </>
        )}
        <p className="clip-result__hint">This code is now used up and won't work again.</p>
      </div>
    );
  }

  return (
    <form className="clip-form" onSubmit={onSubmit}>
      <label className="clip-form__label" htmlFor={`${codeId}-0`}>
        Enter the 6-digit code
      </label>
      <div className="clip-code-input">
        {digits.map((d, i) => (
          <input
            key={i}
            id={`${codeId}-${i}`}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            className="clip-code-box"
            inputMode="numeric"
            autoComplete="off"
            maxLength={CLIP_CODE_LENGTH}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {error ? (
        <p className="clip-alert" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="zm-button zm-button--primary clip-submit"
        disabled={busy || code.length !== CLIP_CODE_LENGTH}
      >
        {busy ? 'Retrieving…' : 'Retrieve'}
      </button>
    </form>
  );
}

export const CLIP_TTL_MINUTES = Math.round(CLIP_TTL_MS / 60000);
