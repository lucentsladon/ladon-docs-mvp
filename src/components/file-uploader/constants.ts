import type { FileWithPath } from "react-dropzone"

import { deepLSupportedLanguages } from "@/lib/translate/config"
import type { RouterOutputs } from "@/trpc/react"

// Define types for better readability
export type FormStage = "upload" | "uploading" | "configure" | "processing" | "finished"
export type FileData = {
  file: FileWithPath
  preview: string
  key: string
}
export type RunStatus = RouterOutputs["task"]["runStatus"]

export type SupportedLanguage = (typeof deepLSupportedLanguages)[number]

// File size constants
export const MAX_SIZE_MB = 10
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
export const SUPPORTED_FORMATS = ["PDF", "DOCX", "XLSX"]
export const SUPPORTED_FORMATS_STRING = SUPPORTED_FORMATS.join(", ")

// Constants for languages
export const LANGUAGES = deepLSupportedLanguages

export const defaultSourceLang = LANGUAGES.find((l) => l.value === "EN") ?? LANGUAGES[0]
export const defaultTargetLang = LANGUAGES.find((l) => l.value === "ES") ?? LANGUAGES[1]

export function isSupportedLanguage(lang: string): boolean {
  return deepLSupportedLanguages.some((l) => l.value === lang)
}
