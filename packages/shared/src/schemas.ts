import { z } from 'zod';

export const messageSummarySchema = z.object({
  id: z.string(),
  fromAddr: z.string(),
  fromName: z.string().nullable(),
  subject: z.string().nullable(),
  receivedAt: z.number().int(),
  expiresAt: z.number().int(),
  hasAttachments: z.boolean(),
  sizeBytes: z.number().int(),
});
export type MessageSummary = z.infer<typeof messageSummarySchema>;

export const attachmentMetaSchema = z.object({
  id: z.string(),
  filename: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
});
export type AttachmentMeta = z.infer<typeof attachmentMetaSchema>;

export const messageDetailSchema = messageSummarySchema.extend({
  textBody: z.string().nullable(),
  htmlBody: z.string().nullable(),
  headers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  attachments: z.array(attachmentMetaSchema),
});
export type MessageDetail = z.infer<typeof messageDetailSchema>;

export const inboxResponseSchema = z.object({
  address: z.string(),
  messages: z.array(messageSummarySchema),
});
export type InboxResponse = z.infer<typeof inboxResponseSchema>;

// --- Automation API (v1) response schemas ---

export const messagesListResponseSchema = z.object({
  address: z.string(),
  messages: z.array(messageSummarySchema),
  limit: z.number().int(),
  skip: z.number().int(),
});
export type MessagesListResponse = z.infer<typeof messagesListResponseSchema>;

export const messageLinksResponseSchema = z.object({
  messageId: z.string(),
  links: z.array(z.string()),
});
export type MessageLinksResponse = z.infer<typeof messageLinksResponseSchema>;

export const attachmentListResponseSchema = z.object({
  messageId: z.string(),
  attachments: z.array(attachmentMetaSchema),
});
export type AttachmentListResponse = z.infer<typeof attachmentListResponseSchema>;

export const waitResponseSchema = z.object({
  matched: z.boolean(),
  timedOut: z.boolean(),
  message: z.union([messageSummarySchema, messageDetailSchema]).nullable(),
});
export type WaitResponse = z.infer<typeof waitResponseSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

// --- Self-service token request + admin approval ---

export const tokenRequestCreatedSchema = z.object({
  requestId: z.string(),
  claimCode: z.string(),
  status: z.literal('pending'),
});
export type TokenRequestCreated = z.infer<typeof tokenRequestCreatedSchema>;

export const tokenClaimResultSchema = z.object({
  status: z.enum(['pending', 'approved', 'denied', 'claimed']),
  token: z.string().optional(),
  tokenId: z.string().optional(),
  rateLimitPerMin: z.number().int().optional(),
  expiresAt: z.number().int().nullable().optional(),
});
export type TokenClaimResult = z.infer<typeof tokenClaimResultSchema>;

export const adminTokenRequestSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  contact: z.string().nullable(),
  reason: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'denied', 'claimed']),
  rateLimitPerMin: z.number().int(),
  expiresDays: z.number().int().nullable(),
  createdAt: z.number().int(),
  decidedAt: z.number().int().nullable(),
  claimedAt: z.number().int().nullable(),
  tokenId: z.string().nullable(),
  ip: z.string().nullable(),
});
export type AdminTokenRequest = z.infer<typeof adminTokenRequestSchema>;

export const adminTokenRequestListSchema = z.object({
  requests: z.array(adminTokenRequestSchema),
});
export type AdminTokenRequestList = z.infer<typeof adminTokenRequestListSchema>;
