import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'a',
    'b',
    'blockquote',
    'br',
    'code',
    'div',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'img',
    'li',
    'ol',
    'p',
    'pre',
    'span',
    'strong',
    'sub',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'u',
    'ul',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'width', 'height', 'title', 'data-original-src'],
    '*': ['class', 'style'],
    table: ['cellpadding', 'cellspacing', 'border'],
    td: ['colspan', 'rowspan', 'align', 'valign'],
    th: ['colspan', 'rowspan', 'align', 'valign'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data', 'cid'],
  },
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  allowedStyles: {
    '*': {
      color: [/.*/],
      'background-color': [/.*/],
      'text-align': [/.*/],
      'font-size': [/.*/],
      'font-weight': [/.*/],
      'font-style': [/.*/],
      'text-decoration': [/.*/],
      padding: [/.*/],
      margin: [/.*/],
      border: [/.*/],
    },
  },
  transformTags: {
    a: (_tag, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      },
    }),
    img: (_tag, attribs) => {
      const src = attribs.src ?? '';
      const isRemote = /^https?:/i.test(src);
      if (isRemote) {
        return {
          tagName: 'img',
          attribs: {
            ...attribs,
            src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4=',
            'data-original-src': src,
            alt: attribs.alt ?? 'Remote image (blocked)',
          },
        };
      }
      return { tagName: 'img', attribs };
    },
  },
};

export function sanitizeMessageHtml(html: string): string {
  if (!html) return '';
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}
