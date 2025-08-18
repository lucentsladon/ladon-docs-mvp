import fs from "fs/promises"
import path from "path"
import { env } from "@/env"

import { TDocumentStatus } from "./schema"

class DeepLService {
  private baseUrl: string
  private headers: Record<string, string>

  constructor() {
    if (!env.DEEPL_API_KEY) {
      throw new Error("DEEPL_API_KEY environment variable is required")
    }

    this.baseUrl = env.DEEPL_API_URL || "https://api-free.deepl.com/v2"
    this.headers = {
      Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
    }
  }

  async translateDocument(
    filePath: string,
    sourceLang: string,
    targetLang: string,
    formality: "default" | "more" | "less" | "prefer_more" | "prefer_less"
  ): Promise<{ document_id: string; document_key: string }> {
    const formData = new FormData()
    const fileBlob = new Blob([await fs.readFile(filePath)])
    formData.append("file", fileBlob, path.basename(filePath))
    formData.append("source_lang", sourceLang)
    formData.append("target_lang", targetLang)
    formData.append("formality", formality)

    const response = await fetch(`${this.baseUrl}/document`, {
      method: "POST",
      headers: this.headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepL API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async getDocumentStatus(documentId: string, documentKey: string): Promise<TDocumentStatus> {
    const response = await fetch(`${this.baseUrl}/document/${documentId}`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ document_key: documentKey }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepL API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async downloadTranslatedDocument(documentId: string, documentKey: string, outputPath: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/document/${documentId}/result`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ document_key: documentKey }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepL API error: ${response.status} ${errorText}`)
    }

    const buffer = await response.arrayBuffer()
    await fs.writeFile(outputPath, Buffer.from(buffer))
  }
}

let deeplService: DeepLService | null = null

export function getDeepLService(): DeepLService | null {
  try {
    if (!deeplService) {
      deeplService = new DeepLService()
    }
    return deeplService
  } catch (error) {
    console.error("[DeepL] Service initialization failed:", error)
    return null
  }
}
