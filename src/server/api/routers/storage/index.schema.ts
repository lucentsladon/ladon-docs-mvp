import { z } from "zod"

export const ZCreatePresignedUploadUrlInputSchema = z.object({
  fileName: z.string().min(1, { message: "fileName cannot be empty." }),
  fileType: z.string().min(1, { message: "fileType cannot be empty." }),
  fileSize: z.number().positive({ message: "fileSize must be a positive number." }),
  // pathPrefix: z.string().optional(), // Uncomment if you want to allow custom path
})

export type CreatePresignedUploadUrlInput = z.infer<typeof ZCreatePresignedUploadUrlInputSchema>
