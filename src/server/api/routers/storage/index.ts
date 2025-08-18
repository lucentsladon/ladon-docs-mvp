import { generatePresignedPutUrl } from "@/lib/s3"
import { authedProcedure } from "@/server/api/procedures"
import { createTRPCRouter } from "@/server/api/trpc"

import { ZCreatePresignedUploadUrlInputSchema } from "./index.schema"

export const storageRouter = createTRPCRouter({
  createPresignedUploadUrl: authedProcedure.input(ZCreatePresignedUploadUrlInputSchema).mutation(async ({ input }) => {
    const { fileName, fileType, fileSize } = input
    const pathPrefix = "documents/"

    const {
      presignedPutUrl,
      presignedGetUrl,
      key,
      publicUrl,
      error: presignError,
    } = await generatePresignedPutUrl(fileName, fileType, fileSize, pathPrefix)

    if (presignError) {
      throw new Error(`Failed to generate upload URLs: ${presignError}`)
    }

    if (!presignedPutUrl || !presignedGetUrl || !key || !publicUrl) {
      throw new Error("Internal server error: Failed to prepare upload URLs.")
    }

    return {
      presignedUrl: presignedPutUrl,
      presignedGetUrl: presignedGetUrl,
      key,
      publicUrl,
    }
  }),
})
