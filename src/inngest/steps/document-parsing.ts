import fs from "fs/promises"
import mammoth from "mammoth"
import pdf from "pdf-parse"

export async function extractTextFromFile(filePath: string): Promise<string> {
  const extension = filePath.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "docx": {
      const result = await mammoth.extractRawText({ path: filePath })
      return result.value
    }
    case "pdf": {
      const dataBuffer = await fs.readFile(filePath)
      const data = await pdf(dataBuffer)
      return data.text
    }
    case "txt": {
      return fs.readFile(filePath, "utf-8")
    }
    default:
      console.warn(`Unsupported file type for text extraction: ${extension}`)
      return ""
  }
}
