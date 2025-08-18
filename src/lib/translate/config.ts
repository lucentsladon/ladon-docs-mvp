import { env } from "@/env"

// src/lib/translate/config.ts
export const LEMONFOX_API_URL = "https://api.lemonfox.ai/v1/audio/transcriptions"
export const SUPADATA_API_URL = "https://api.supadata.ai/v1/youtube/transcript"
export const GOOGLE_AI_MODEL_ID = "gemini-2.0-flash"

export const LIMITED_LANGUAGES = [
  "english",
  "spanish",
  "vietnamese",
  "arabic",
  "portuguese",
  "russian",
  "hindi",
  "french",
  "chinese",
] as const
export const USE_LIMITED_LANGUAGES = true

const ALL_DEEPL_LANGUAGES = [
  { value: "AR", label: "Arabic" },
  { value: "BG", label: "Bulgarian" },
  { value: "CS", label: "Czech" },
  { value: "DA", label: "Danish" },
  { value: "DE", label: "German" },
  { value: "EL", label: "Greek" },
  { value: "EN", label: "English" },
  { value: "ES", label: "Spanish" },
  { value: "ET", label: "Estonian" },
  { value: "FI", label: "Finnish" },
  { value: "FR", label: "French" },
  { value: "HE", label: "Hebrew" },
  { value: "HU", label: "Hungarian" },
  { value: "ID", label: "Indonesian" },
  { value: "IT", label: "Italian" },
  { value: "JA", label: "Japanese" },
  { value: "KO", label: "Korean" },
  { value: "LT", label: "Lithuanian" },
  { value: "LV", label: "Latvian" },
  { value: "NB", label: "Norwegian Bokmål" },
  { value: "NL", label: "Dutch" },
  { value: "PL", label: "Polish" },
  { value: "PT", label: "Portuguese" },
  { value: "RO", label: "Romanian" },
  { value: "RU", label: "Russian" },
  { value: "SK", label: "Slovak" },
  { value: "SL", label: "Slovenian" },
  { value: "SV", label: "Swedish" },
  { value: "TH", label: "Thai" },
  { value: "TR", label: "Turkish" },
  { value: "UK", label: "Ukrainian" },
  { value: "VI", label: "Vietnamese" },
  { value: "ZH", label: "Chinese" },
] as const

const LIMITED_DEEPL_LANGUAGES = [
  { value: "EN", label: "English" },
  { value: "ES", label: "Spanish" },
  { value: "VI", label: "Vietnamese" },
  { value: "AR", label: "Arabic" },
  { value: "PT", label: "Portuguese" },
  { value: "RU", label: "Russian" },
  { value: "HI", label: "Hindi" },
  { value: "FR", label: "French" },
  { value: "ZH", label: "Chinese" },
] as const

export const deepLSupportedLanguages = env.NEXT_PUBLIC_USE_LIMITED_LANGUAGES === "true" ? LIMITED_DEEPL_LANGUAGES : ALL_DEEPL_LANGUAGES
