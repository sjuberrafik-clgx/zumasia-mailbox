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
