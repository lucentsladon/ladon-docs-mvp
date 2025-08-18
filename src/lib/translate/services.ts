import fs from "fs"
import path from "path"
import { generateText } from "ai"

import model from "@/lib/ai/model"

import { LEMONFOX_API_URL, SUPADATA_API_URL } from "./config"

const NUM_CHUNKS = 20
const SAVE_TRANSCRIPTIONS_ON_LOCAL = false

// Helper function to generate a unique key
function generateUniqueKey(language: string) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")
  const random = Math.random().toString(36).substring(2, 8)
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}_${language}_${random}`
}

// Helper function to save transcription to a file
async function saveTranscriptionToFile(content: string, language: string): Promise<void> {
  const fileName = `${generateUniqueKey(language)}.txt`
  const dirPath = path.join(process.cwd(), "transcriptions")
  const filePath = path.join(dirPath, fileName)

  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log(`Created directory: ${dirPath}`)
    }

    // Write the file
    fs.writeFileSync(filePath, content, "utf8")
    console.log(`Transcription saved to ${filePath}`)
  } catch (error) {
    console.error(`Failed to save transcription to file: ${error}`)
    // We don't want to fail the whole process if file saving fails
  }
}

/**
 * Fetches SRT transcription from Lemon Fox AI.
 * @returns The SRT string.
 */
export async function getTranscription(
  isYouTubeTask: boolean,
  language: string,
  lemonFoxApiKey: string,
  supaDataApiKey: string,
  videoUrl?: string,
  videoId?: string,
  userPrompt?: string
): Promise<string> {
  if (!isYouTubeTask) {
    if (!videoUrl) {
      throw new Error("`videoUrl` is required for non-YouTube tasks")
    }
    // Lemon Fox logic (as before)
    const formData = new FormData()
    formData.append("file", videoUrl)
    formData.append("language", language)
    formData.append("response_format", "vtt")
    if (userPrompt && userPrompt.trim()) {
      formData.append("prompt", userPrompt)
      console.log("Adding user prompt to Lemon Fox request.")
    }
    console.log("Calling Lemon Fox API for transcription...")
    const response = await fetch(LEMONFOX_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${lemonFoxApiKey}` },
      body: formData,
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Lemon Fox API failed: ${response.status} ${response.statusText} - ${errorText}`)
    }
    const transcriptionRaw = await response.text()
    if (!transcriptionRaw || transcriptionRaw.trim() === "") {
      console.error("Lemon Fox API returned empty or whitespace-only content.")
      console.error("Request details:", { videoUrl, language })
      throw new Error("Transcription failed or resulted in empty content from Lemon Fox.")
    }
    const fixedTranscription = transcriptionRaw.replace(/\n/g, "\n")
    let transcriptionContent = fixedTranscription.trim()
    if (transcriptionContent.charCodeAt(0) === 0xfeff) {
      console.log("Detected and removed BOM character from original transcription.")
      transcriptionContent = transcriptionContent.substring(1)
    }
    transcriptionContent = transcriptionContent.trim()
    console.log("Received transcription from Lemon Fox (requested VTT).")
    if (SAVE_TRANSCRIPTIONS_ON_LOCAL) {
      await saveTranscriptionToFile(transcriptionContent, language)
    }
    return transcriptionContent
  } else {
    if (!videoId) {
      throw new Error("`videoId` is required for YouTube tasks")
    }
    const url = `${SUPADATA_API_URL}?videoId=${videoId}`
    const response = await fetch(url, {
      headers: { "x-api-key": supaDataApiKey },
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SupaData failed: ${response.status} ${response.statusText} - ${errorText}`)
    }
    const data = await response.json()
    const transcriptionContent = JSON.stringify(data, null, 2) // Pretty print JSON
    if (SAVE_TRANSCRIPTIONS_ON_LOCAL) {
      await saveTranscriptionToFile(transcriptionContent, language)
    }
    return JSON.stringify(data)
  }
}

/**
 * Cleans potential markdown code fences and extra text from AI VTT output.
 * Attempts to remove preamble before the first cue identifier or timestamp.
 */
function cleanAiVttOutput(rawOutput: string): string {
  let cleaned = rawOutput.trim()
  cleaned = cleaned.replace(/```vtt|```/g, "").trim()
  return cleaned
}

/**
 * Validates VTT format
 */
function validateVttFormat(vttContent: string): boolean {
  const lines = vttContent.split("\n").filter((line) => line.trim() !== "")

  console.log("\n=== VTT Validation Start ===")
  console.log("First line:", { line: lines[0] })

  // Check for WEBVTT header
  if (!lines[0].startsWith("WEBVTT")) {
    console.error("Validation failed: Missing WEBVTT header")
    return false
  }

  // Check for timestamp format
  const timestampRegex = /^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/
  let hasValidTimestamp = false
  let timestampLine = ""

  for (const line of lines) {
    if (timestampRegex.test(line)) {
      hasValidTimestamp = true
      timestampLine = line
      break
    }
  }

  if (!hasValidTimestamp) {
    console.error("Validation failed: No valid timestamp found")
    return false
  }

  console.log("Found valid timestamp:", { timestamp: timestampLine })
  console.log("=== VTT Validation End ===\n")
  return true
}

/**
 * Merges VTT chunks while maintaining format
 */
function mergeVttChunks(chunks: string[]): string {
  if (chunks.length === 0) return ""

  console.log("\n=== Merging VTT Chunks Start ===")
  console.log("Number of chunks to merge:", { count: chunks.length })

  // Start with clean WEBVTT header
  const mergedLines = ["WEBVTT", ""] // Add blank line after header

  // Process all chunks and remove their headers
  for (let i = 0; i < chunks.length; i++) {
    const chunkLines = chunks[i].split("\n")

    // Skip WEBVTT header and blank line in each chunk
    const contentStart = chunkLines.findIndex(
      (line, index) => index > 0 && line.match(/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/)
    )

    if (contentStart !== -1) {
      // Add this chunk's content (timestamps and text)
      const contentLines = chunkLines.slice(contentStart)
      mergedLines.push(...contentLines)

      // Add a blank line after each chunk except the last one
      if (i < chunks.length - 1) {
        mergedLines.push("")
      }
    }
  }

  // Format to ensure proper spacing between cues
  let result = mergedLines.join("\n")

  // Fix common formatting issues
  result =
    result
      // Ensure single newline between timestamp and text
      .replace(/(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})\n\n/g, "$1\n")
      // Ensure double newline between cues
      .replace(/(\n[^\n]+)\n(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})/g, "$1\n\n$2")
      // Remove any triple or more newlines
      .replace(/\n{3,}/g, "\n\n")
      .trim() + "\n"

  console.log("=== Merging VTT Chunks End ===\n")
  return result
}

/**
 * Rate-limited parallel processing of VTT chunks
 */
async function processVttChunks(
  chunks: string[],
  inputLanguage: string,
  outputLanguage: string,
  systemPrompt: string,
  maxConcurrent: number = 3,
  delayBetweenBatches: number = 1000
): Promise<string[]> {
  const results: string[] = []

  for (let i = 0; i < chunks.length; i += maxConcurrent) {
    const batch = chunks.slice(i, i + maxConcurrent)
    const batchPromises = batch.map(async (chunk, index) => {
      const prompt = `Translate the subtitle text in the following VTT transcription to ${outputLanguage}. Keep the original VTT structure and timestamps.\n\nOriginal Transcription Content:\n\`\`\`\n${chunk}\n\`\`\`\n\nTranslated VTT Content:\n`

      console.log(`\n=== Processing chunk ${i + index + 1}/${chunks.length} ===\n`)
      console.log("Chunk content:", { content: chunk.substring(0, 200) + "..." })

      const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt,
      })

      const cleaned = cleanAiVttOutput(text)
      console.log("Cleaned chunk result:", { result: cleaned.substring(0, 200) + "..." })

      return cleaned
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Add delay between batches to respect rate limits
    if (i + maxConcurrent < chunks.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches))
    }
  }

  return results
}

interface SubtitleSegment {
  text: string
  offset: number
  duration: number
  lang: string
}

interface JsonSubtitle {
  lang: string
  availableLangs: string[]
  content: SubtitleSegment[]
}

/**
 * Detects and normalizes subtitle format
 */
function normalizeSubtitleFormat(content: string): string {
  console.log("\n=== Format Detection Start ===")
  console.log("Content length:", { length: content.length })

  try {
    // Try parsing as JSON
    console.log("Attempting to parse as JSON...")
    const jsonData = JSON.parse(content) as JsonSubtitle

    if (jsonData.content && Array.isArray(jsonData.content)) {
      console.log("Successfully detected JSON subtitle format")
      const vtt = jsonToVtt(jsonData)
      console.log("Converted VTT preview:", { preview: vtt.substring(0, 200) })
      return vtt
    } else if (content.startsWith('"') && content.endsWith('"')) {
      console.log("Detected upload format, converting to link format")
      return content
        .replace(/^"|"$/g, "") // Remove outer quotes
        .replace(/\\n/g, "\n") // Convert \n to actual newlines
        .replace(/\\"/g, '"') // Unescape any escaped quotes
        .trim()
    }
  } catch (e) {
    console.log("JSON parsing failed:", { error: e instanceof Error ? e.message : String(e) })
    // Not JSON, additional check for VTT content
    if (content.includes("WEBVTT")) {
      console.log("Detected VTT format after JSON parse attempt")
      return content
    }
  }
  return content
}

/**
 * Converts JSON subtitle format to VTT
 */
function jsonToVtt(jsonSubtitle: JsonSubtitle): string {
  console.log("\n=== JSON to VTT Conversion Start ===")
  console.log("Input JSON:", {
    lang: jsonSubtitle.lang,
    availableLangs: jsonSubtitle.availableLangs,
    contentLength: jsonSubtitle.content.length,
  })

  const segments = jsonSubtitle.content

  // Start with clean WEBVTT header
  const vttLines = ["WEBVTT", ""] // Required blank line after header

  // Add each segment as a cue
  segments.forEach((segment, index) => {
    if (!segment.text.trim()) return // Skip empty segments

    const startTime = formatTimestamp(segment.offset)
    const endTime = formatTimestamp(segment.offset + segment.duration)

    // Add timestamp line
    vttLines.push(`${startTime} --> ${endTime}`)
    // Add text content
    vttLines.push(segment.text.trim())

    // Add blank line between cues
    if (index < segments.length - 1) {
      vttLines.push("")
    }

    if (index === 0) {
      console.log("First segment converted:", {
        startTime,
        endTime,
        text: segment.text.trim(),
      })
    }
  })

  // Format to ensure proper spacing
  let result = vttLines.join("\n")

  // Fix common formatting issues
  result =
    result
      // Ensure single newline between timestamp and text
      .replace(/(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})\n\n/g, "$1\n")
      // Ensure double newline between cues
      .replace(/(\n[^\n]+)\n(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})/g, "$1\n\n$2")
      // Remove any triple or more newlines
      .replace(/\n{3,}/g, "\n\n")
      .trim() + "\n"

  console.log("=== JSON to VTT Conversion End ===\n")
  return result
}

/**
 * Formats milliseconds to VTT timestamp
 */
function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const milliseconds = ms % 1000

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
}

/**
 * Splits VTT content into a specific number of chunks
 */
function splitVttIntoChunks(vttContent: string, numChunks: number = NUM_CHUNKS): string[] {
  console.log(`\n=== Splitting VTT into ${numChunks} chunks ===`)

  const lines = vttContent.split("\n")
  const chunks: string[] = []
  let currentChunk: string[] = []

  // Always include WEBVTT header in each chunk
  const hasWebVttHeader = lines[0].startsWith("WEBVTT")

  // Find all timestamp lines to use as split points
  const timestampLines: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/)) {
      timestampLines.push(i)
    }
  }

  // Calculate how many timestamps should be in each chunk
  const timestampsPerChunk = Math.ceil(timestampLines.length / numChunks)
  console.log(`Total timestamps: ${timestampLines.length}, Timestamps per chunk: ${timestampsPerChunk}`)

  // Split content into chunks
  let currentTimestampCount = 0

  // Add WEBVTT header to first chunk
  if (hasWebVttHeader) {
    currentChunk.push("WEBVTT")
    currentChunk.push("") // Required blank line after header
  }

  for (let i = hasWebVttHeader ? 2 : 0; i < lines.length; i++) {
    // Add current line to chunk
    currentChunk.push(lines[i])

    // Check if we've reached a timestamp that should start a new chunk
    if (timestampLines.includes(i) && currentTimestampCount > 0 && currentTimestampCount % timestampsPerChunk === 0) {
      chunks.push(currentChunk.join("\n"))
      currentChunk = ["WEBVTT", ""] // Start new chunk with header
    }

    if (timestampLines.includes(i)) {
      currentTimestampCount++
    }
  }

  // Add the last chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n"))
  }

  console.log(`Created ${chunks.length} chunks`)
  return chunks
}

/**
 * Translates transcription content (expected SRT or VTT) to VTT using Google Generative AI.
 */
export async function translateToVtt(
  transcriptionContent: string,
  inputLanguage: string,
  outputLanguage: string,
  userPrompt?: string,
  numChunks: number = NUM_CHUNKS
): Promise<string> {
  // Normalize content to VTT format

  const normalizedContent = normalizeSubtitleFormat(transcriptionContent)
  console.log("Normalized content:", { content: normalizedContent.substring(0, 200) + "..." })

  // --- Persona & Goal Focused System Prompt ---
  const systemPromptLines = [
    `You are an expert subtitle translator. Your task is to accurately translate the text content of VTT subtitles to ${outputLanguage}.`,
    `Focus *only* on translating the spoken words.`,
    `IMPORTANT: If a subtitle line is already in ${outputLanguage}, do not translate it again—keep the original text.`,
    `Maintain the original VTT structure precisely, including the WEBVTT header, all timestamps, and cue separators (blank lines).`,
    `Output *only* the complete, translated VTT content. Do not include any additional explanations, commentary, or markdown formatting.`,
    `Timestamps and text should have this exact format:`,
    `00:00:00.000 --> 00:00:00.000`,
    `Translated text here`,
    ``,
    `00:00:00.000 --> 00:00:00.000`,
    `Next subtitle text here`,
  ]

  if (userPrompt?.trim()) {
    systemPromptLines.push(``)
    systemPromptLines.push(`Consider the following context/nuance for the translation:`)
    systemPromptLines.push(userPrompt.trim())
  }

  const systemPrompt = systemPromptLines.join("\n")

  // Split content into chunks
  const chunks = splitVttIntoChunks(normalizedContent, numChunks)
  console.log(`\n=== Split VTT into ${chunks.length} chunks ===\n`)

  // Process chunks in parallel with rate limiting
  const translatedChunks = await processVttChunks(chunks, inputLanguage, outputLanguage, systemPrompt)

  // Merge results and ensure proper formatting
  const mergedVtt = mergeVttChunks(translatedChunks)

  // Final validation
  if (!validateVttFormat(mergedVtt)) {
    throw new Error("Merged VTT validation failed: Invalid format")
  }

  return mergedVtt
}
