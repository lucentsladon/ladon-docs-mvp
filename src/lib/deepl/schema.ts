import { z } from "zod"

export const ZDocumentStatus = z.object({
  document_id: z.string(),
  status: z.enum(["queued", "translating", "done", "error"]),
  seconds_remaining: z.number().optional(),
  billed_characters: z.number().optional(),
  error_message: z.string().optional(),
})

export type TDocumentStatus = z.infer<typeof ZDocumentStatus>
