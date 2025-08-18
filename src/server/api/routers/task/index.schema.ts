import { Formality } from "@prisma/client"
import { z } from "zod"

import { deepLSupportedLanguages } from "@/lib/translate/config"

export const ZTriggerTranslationInputSchema = z.object({
  original_file_url: z.string().url(),
  original_file_key: z.string(),
  file_name: z.string(),
  inputLanguage: z.enum(deepLSupportedLanguages.map((l) => l.value) as [string, ...string[]]),
  outputLanguage: z.string(),
  prompt: z.string().optional(),
  formality: z.nativeEnum(Formality).optional().default("default"),
})

export type TTriggerTranslationInput = z.infer<typeof ZTriggerTranslationInputSchema>

export const ZGetTasksInputSchema = z.object({
  limit: z.number().min(1).max(100).default(6),
  page: z.number().min(1).default(1),
  status: z.enum(["pending", "completed", "failed", "processing"]).optional(),
})

export type TGetTasksInput = z.infer<typeof ZGetTasksInputSchema>
