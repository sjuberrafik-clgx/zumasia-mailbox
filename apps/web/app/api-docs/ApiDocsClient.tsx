'use client';

import { useEffect, useRef } from 'react';

const REDOC_SRC = 'https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js';
const SPEC_URL = '/api/v1/openapi.json';

type RedocGlobal = {
  init: (spec: string, options: Record<string, unknown>, element: HTMLElement) => void;
};

function getRedoc(): RedocGlobal | undefined {
  return (window as unknown as { Redoc?: RedocGlobal }).Redoc;
}

export function ApiDocsClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const render = () => {
      const redoc = getRedoc();
      if (redoc) redoc.init(SPEC_URL, { hideDownloadButton: false, expandResponses: '200' }, container);
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${REDOC_SRC}"]`);
    if (existing) {
      if (getRedoc()) {
        render();
        return;
      }
      existing.addEventListener('load', render);
      return () => existing.removeEventListener('load', render);
    }

    const script = document.createElement('script');
    script.src = REDOC_SRC;
    script.async = true;
    script.addEventListener('load', render);
    document.body.appendChild(script);
    return () => script.removeEventListener('load', render);
  }, []);

  return <div ref={containerRef} style={{ minHeight: '70vh' }} />;
}
