import { INBOX_LIST_LIMIT, MAIL_DOMAIN, RETENTION_HOURS, SITE_URL } from '@zumasia/shared/brand';

/**
 * Hand-authored OpenAPI 3.1 description of the Zumasia Mail automation API (v1).
 * Kept in sync by hand with the route handlers and the shared zod schemas.
 */
export function buildOpenApiDocument(): Record<string, unknown> {
  const messageSummary = {
    type: 'object',
    required: ['id', 'fromAddr', 'fromName', 'subject', 'receivedAt', 'expiresAt', 'hasAttachments', 'sizeBytes'],
    properties: {
      id: { type: 'string', description: 'Stable message id used by the other endpoints.' },
      fromAddr: { type: 'string', description: 'Sender email address.' },
      fromName: { type: ['string', 'null'], description: 'Sender display name, if present.' },
      subject: { type: ['string', 'null'] },
      receivedAt: { type: 'integer', format: 'int64', description: 'Receipt time (Unix epoch milliseconds).' },
      expiresAt: { type: 'integer', format: 'int64', description: 'Auto-purge time (Unix epoch milliseconds).' },
      hasAttachments: { type: 'boolean' },
      sizeBytes: { type: 'integer' },
    },
  };

  const attachmentMeta = {
    type: 'object',
    required: ['id', 'filename', 'contentType', 'sizeBytes'],
    properties: {
      id: { type: 'string', description: 'Composite id in the form "<messageId>-<index>".' },
      filename: { type: 'string' },
      contentType: { type: 'string' },
      sizeBytes: { type: 'integer' },
    },
  };

  const messageDetail = {
    allOf: [
      { $ref: '#/components/schemas/MessageSummary' },
      {
        type: 'object',
        required: ['textBody', 'htmlBody', 'headers', 'attachments'],
        properties: {
          textBody: { type: ['string', 'null'], description: 'Plain-text body, if any.' },
          htmlBody: { type: ['string', 'null'], description: 'Sanitized HTML body, if any.' },
          headers: {
            type: 'object',
            additionalProperties: {
              oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
            },
          },
          attachments: { type: 'array', items: { $ref: '#/components/schemas/AttachmentMeta' } },
        },
      },
    ],
  };

  const errorSchema = {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'not_found' },
          message: { type: 'string' },
        },
      },
    },
  };

  const errorResponse = (description: string) => ({
    description,
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  });

  const addressParam = {
    name: 'address',
    in: 'path',
    required: true,
    description: `Inbox local part (e.g. "qa-signup") or full address (e.g. "qa-signup@${MAIL_DOMAIN}"). Sub-addressing with "+" is supported.`,
    schema: { type: 'string' },
  };
  const idParam = {
    name: 'id',
    in: 'path',
    required: true,
    description: 'Message id from a list/wait response.',
    schema: { type: 'string' },
  };

  return {
    openapi: '3.1.0',
    info: {
      title: 'Zumasia Mail Automation API',
      version: '1.0.0',
      description: [
        'Read-only REST API for automating email checks against Zumasia public inboxes',
        `(\`*@${MAIL_DOMAIN}\`). Built for QA and developer workflows: OTP/verification flows,`,
        'transactional email assertions, and CI pipelines.',
        '',
        '## Authentication',
        'Every endpoint requires an API token. Send it as a bearer token:',
        '',
        '`Authorization: Bearer <token>`',
        '',
        'A `?token=<token>` query parameter is also accepted for convenience, but it can leak',
        'into server/proxy logs — prefer the header.',
        '',
        '## Getting a token',
        'Request one at /api-access. An admin approves it, then you claim your token (shown once).',
        '',
        '## Rate limits',
        'Limits are applied per token, per minute. Responses include `X-RateLimit-Remaining`;',
        'exceeding the limit returns `429` with a `Retry-After` header.',
        '',
        '## Retention',
        `Messages and inboxes are public and auto-purge after ${RETENTION_HOURS} hours. Do not send`,
        'sensitive mail to Zumasia inboxes.',
      ].join('\n'),
    },
    servers: [{ url: `${SITE_URL}/api/v1`, description: 'Production' }],
    security: [{ bearerAuth: [] }, { tokenQuery: [] }],
    tags: [
      { name: 'Access', description: 'Request and claim API tokens.' },
      { name: 'Inboxes', description: 'List and wait for messages in an inbox.' },
      { name: 'Messages', description: 'Read a message, its links, and its attachments.' },
      { name: 'Admin', description: 'Admin-only token request review (requires the admin token).' },
    ],
    paths: {
      '/tokens/requests': {
        post: {
          tags: ['Access'],
          summary: 'Request an API token',
          description: 'Submit a token request. An admin must approve it before the token can be claimed.',
          operationId: 'requestToken',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'reason'],
                  properties: {
                    label: { type: 'string', maxLength: 80 },
                    email: { type: 'string', format: 'email' },
                    reason: { type: 'string', maxLength: 600 },
                    turnstileToken: { type: 'string', description: 'Cloudflare Turnstile token (required only when Turnstile is enabled).' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Request created (pending approval).',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenRequestCreated' } } },
            },
            '400': errorResponse('Invalid input or failed verification.'),
            '429': errorResponse('Rate limit exceeded.'),
          },
        },
      },
      '/tokens/claim': {
        post: {
          tags: ['Access'],
          summary: 'Claim an approved token',
          description: 'Exchange a request id + claim code for the API token. Returned once, only after approval.',
          operationId: 'claimToken',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['requestId', 'claimCode'],
                  properties: { requestId: { type: 'string' }, claimCode: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Claim status; includes the token when approved.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenClaimResult' } } },
            },
            '400': errorResponse('Missing requestId or claimCode.'),
            '404': errorResponse('No matching request.'),
            '429': errorResponse('Rate limit exceeded.'),
          },
        },
      },
      '/admin/token-requests': {
        get: {
          tags: ['Admin'],
          summary: 'List token requests',
          operationId: 'adminListTokenRequests',
          security: [{ adminAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'denied', 'claimed'] } },
          ],
          responses: {
            '200': {
              description: 'Matching requests.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminTokenRequestList' } } },
            },
            '401': errorResponse('Missing or invalid admin token.'),
            '503': errorResponse('Admin API not configured.'),
          },
        },
      },
      '/admin/token-requests/{id}/approve': {
        post: {
          tags: ['Admin'],
          summary: 'Approve a token request',
          operationId: 'adminApproveTokenRequest',
          security: [{ adminAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    rateLimitPerMin: { type: 'integer', minimum: 1 },
                    expiresDays: { type: ['integer', 'null'], minimum: 1 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated request.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminTokenRequest' } } },
            },
            '401': errorResponse('Missing or invalid admin token.'),
            '404': errorResponse('Request not found.'),
            '409': errorResponse('Request is not pending.'),
          },
        },
      },
      '/admin/token-requests/{id}/deny': {
        post: {
          tags: ['Admin'],
          summary: 'Deny a token request',
          operationId: 'adminDenyTokenRequest',
          security: [{ adminAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Updated request.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminTokenRequest' } } },
            },
            '401': errorResponse('Missing or invalid admin token.'),
            '404': errorResponse('Request not found.'),
            '409': errorResponse('Request is not pending.'),
          },
        },
      },
      '/inboxes/{address}/messages': {
        get: {
          tags: ['Inboxes'],
          summary: 'List messages in an inbox',
          description: 'Returns non-expired messages for an inbox, newest first.',
          operationId: 'listInboxMessages',
          parameters: [
            addressParam,
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: INBOX_LIST_LIMIT, default: INBOX_LIST_LIMIT },
            },
            { name: 'skip', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } },
            {
              name: 'since',
              in: 'query',
              description: 'Only messages received strictly after this Unix epoch ms.',
              schema: { type: 'integer', format: 'int64' },
            },
            { name: 'from', in: 'query', description: 'Case-insensitive substring match on the sender address.', schema: { type: 'string' } },
            { name: 'subject', in: 'query', description: 'Case-insensitive substring match on the subject.', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'A list of message summaries.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/MessagesListResponse' } } },
            },
            '400': errorResponse('Invalid inbox address.'),
            '401': errorResponse('Missing or invalid API token.'),
            '429': errorResponse('Rate limit exceeded.'),
          },
        },
      },
      '/inboxes/{address}/wait': {
        get: {
          tags: ['Inboxes'],
          summary: 'Wait for a matching message (long-poll)',
          description:
            'Long-polls until a message matching the filters arrives or the timeout elapses. ' +
            'Returns the first match (newest first). Ideal for OTP and email-receipt tests: ' +
            'capture `since` before triggering your action, then poll this endpoint.',
          operationId: 'waitForMessage',
          parameters: [
            addressParam,
            {
              name: 'since',
              in: 'query',
              description: 'Only match messages received after this Unix epoch ms. Defaults to request start.',
              schema: { type: 'integer', format: 'int64' },
            },
            { name: 'from', in: 'query', description: 'Case-insensitive substring match on the sender address.', schema: { type: 'string' } },
            { name: 'subject', in: 'query', description: 'Case-insensitive substring match on the subject.', schema: { type: 'string' } },
            {
              name: 'timeout',
              in: 'query',
              description: 'Seconds to wait before giving up (1–30).',
              schema: { type: 'integer', minimum: 1, maximum: 30, default: 25 },
            },
            {
              name: 'full',
              in: 'query',
              description: 'When "true", return the full message (with bodies + headers) instead of a summary.',
              schema: { type: 'boolean', default: false },
            },
          ],
          responses: {
            '200': {
              description: 'Either a match or a timeout result.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/WaitResponse' } } },
            },
            '400': errorResponse('Invalid inbox address.'),
            '401': errorResponse('Missing or invalid API token.'),
            '429': errorResponse('Rate limit exceeded.'),
          },
        },
      },
      '/messages/{id}': {
        get: {
          tags: ['Messages'],
          summary: 'Get a full message',
          operationId: 'getMessage',
          parameters: [idParam],
          responses: {
            '200': {
              description: 'The full message.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageDetail' } } },
            },
            '401': errorResponse('Missing or invalid API token.'),
            '404': errorResponse('Message not found or expired.'),
            '429': errorResponse('Rate limit exceeded.'),
          },
        },
      },
      '/messages/{id}/links': {
        get: {
          tags: ['Messages'],
          summary: 'Extract links from a message',
          description: 'Returns de-duplicated absolute URLs found in the message body.',
          operationId: 'getMessageLinks',
          parameters: [idParam],
          responses: {
            '200': {
              description: 'The extracted links.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageLinksResponse' } } },
            },
            '401': errorResponse('Missing or invalid API token.'),
            '404': errorResponse('Message not found or expired.'),
            '429': errorResponse('Rate limit exceeded.'),
          },
        },
      },
      '/messages/{id}/attachments': {
        get: {
          tags: ['Messages'],
          summary: 'List a message\u2019s attachments',
          operationId: 'listMessageAttachments',
          parameters: [idParam],
          responses: {
            '200': {
              description: 'Attachment metadata.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AttachmentListResponse' } } },
            },
            '401': errorResponse('Missing or invalid API token.'),
            '404': errorResponse('Message not found or expired.'),
            '429': errorResponse('Rate limit exceeded.'),
          },
        },
      },
      '/messages/{id}/attachments/{index}': {
        get: {
          tags: ['Messages'],
          summary: 'Download an attachment',
          description: 'Returns the raw attachment bytes. Executable/script types are blocked.',
          operationId: 'downloadAttachment',
          parameters: [
            idParam,
            { name: 'index', in: 'path', required: true, description: 'Zero-based attachment index.', schema: { type: 'integer', minimum: 0 } },
          ],
          responses: {
            '200': {
              description: 'The attachment bytes.',
              content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
            },
            '400': errorResponse('Invalid attachment index.'),
            '401': errorResponse('Missing or invalid API token.'),
            '403': errorResponse('Attachment type is blocked.'),
            '404': errorResponse('Attachment not found or expired.'),
            '429': errorResponse('Rate limit exceeded.'),
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', description: 'API token as a bearer credential.' },
        tokenQuery: { type: 'apiKey', in: 'query', name: 'token', description: 'API token as a "token" query parameter (less secure).' },
        adminAuth: { type: 'http', scheme: 'bearer', description: 'Admin API token (ADMIN_API_TOKEN). Required for /admin/* endpoints.' },
      },
      schemas: {
        MessageSummary: messageSummary,
        MessageDetail: messageDetail,
        AttachmentMeta: attachmentMeta,
        MessagesListResponse: {
          type: 'object',
          required: ['address', 'messages', 'limit', 'skip'],
          properties: {
            address: { type: 'string' },
            messages: { type: 'array', items: { $ref: '#/components/schemas/MessageSummary' } },
            limit: { type: 'integer' },
            skip: { type: 'integer' },
          },
        },
        MessageLinksResponse: {
          type: 'object',
          required: ['messageId', 'links'],
          properties: {
            messageId: { type: 'string' },
            links: { type: 'array', items: { type: 'string', format: 'uri' } },
          },
        },
        AttachmentListResponse: {
          type: 'object',
          required: ['messageId', 'attachments'],
          properties: {
            messageId: { type: 'string' },
            attachments: { type: 'array', items: { $ref: '#/components/schemas/AttachmentMeta' } },
          },
        },
        WaitResponse: {
          type: 'object',
          required: ['matched', 'timedOut', 'message'],
          properties: {
            matched: { type: 'boolean' },
            timedOut: { type: 'boolean' },
            message: {
              oneOf: [
                { $ref: '#/components/schemas/MessageSummary' },
                { $ref: '#/components/schemas/MessageDetail' },
                { type: 'null' },
              ],
            },
          },
        },
        TokenRequestCreated: {
          type: 'object',
          required: ['requestId', 'claimCode', 'status'],
          properties: {
            requestId: { type: 'string' },
            claimCode: { type: 'string', description: 'One-time code used to claim the token after approval.' },
            status: { type: 'string', enum: ['pending'] },
          },
        },
        TokenClaimResult: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['pending', 'approved', 'denied', 'claimed'] },
            token: { type: 'string', description: 'Present only when status is "approved".' },
            tokenId: { type: 'string' },
            rateLimitPerMin: { type: 'integer' },
            expiresAt: { type: ['integer', 'null'] },
          },
        },
        AdminTokenRequest: {
          type: 'object',
          required: ['id', 'status', 'rateLimitPerMin', 'createdAt'],
          properties: {
            id: { type: 'string' },
            label: { type: ['string', 'null'] },
            contact: { type: ['string', 'null'] },
            reason: { type: ['string', 'null'] },
            status: { type: 'string', enum: ['pending', 'approved', 'denied', 'claimed'] },
            rateLimitPerMin: { type: 'integer' },
            expiresDays: { type: ['integer', 'null'] },
            createdAt: { type: 'integer' },
            decidedAt: { type: ['integer', 'null'] },
            claimedAt: { type: ['integer', 'null'] },
            tokenId: { type: ['string', 'null'] },
            ip: { type: ['string', 'null'] },
          },
        },
        AdminTokenRequestList: {
          type: 'object',
          required: ['requests'],
          properties: { requests: { type: 'array', items: { $ref: '#/components/schemas/AdminTokenRequest' } } },
        },
        Error: errorSchema,
      },
    },
  };
}
