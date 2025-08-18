import { env } from "@/env"
import { inngest } from "@/inngest/client"
import { documentTranslationJob } from "@/inngest/jobs"
import { serve } from "inngest/next"

// Create an API that serves all of our functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [documentTranslationJob],
  signingKey: env.INNGEST_SIGNING_KEY,
})
