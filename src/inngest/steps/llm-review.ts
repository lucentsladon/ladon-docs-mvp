import fs from "fs/promises"
import path from "path"
import { generateText } from "ai"
import Docxtemplater from "docxtemplater"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import * as XLSX from "xlsx"
import PizZip from "pizzip"

import model from "@/lib/ai/model"

import { uploadTranslatedFile } from "./document-file-handling"
import { extractTextFromFile } from "./document-parsing"

async function createPdfWithText(text: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const page = pdfDoc.addPage()

  const { width, height } = page.getSize()
  const fontSize = 12
  const margin = 50
  const textWidth = width - 2 * margin

  page.drawText(text, {
    x: margin,
    y: height - 4 * margin,
    font,
    size: fontSize,
    color: rgb(0, 0, 0),
    maxWidth: textWidth,
    lineHeight: 15,
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

async function createXlsxWithText(text: string): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([[text]])
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reviewed Text")
  const xlsxBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })
  return xlsxBuffer
}

async function createDocxWithText(originalDocxPath: string, newText: string): Promise<Buffer> {
  const content = await fs.readFile(originalDocxPath, "binary")
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  const textContent = await extractTextFromFile(originalDocxPath)

  const docxFile = doc.getZip().file("word/document.xml")
  if (!docxFile) {
    throw new Error("Invalid DOCX file: word/document.xml not found.")
  }

  const originalXmlContent = docxFile.asText()
  const updatedXmlContent = originalXmlContent.replace(textContent, newText)

  doc.getZip().file("word/document.xml", updatedXmlContent)

  const buf = doc.getZip().generate({ type: "nodebuffer" })
  return buf
}

export async function reviewTranslationWithLLM(
  filePath: string,
  taskId: string,
  sourceLanguage: string,
  targetLanguage: string,
  userPrompt?: string | null
): Promise<{ reviewed_file_url: string; reviewed_file_key: string }> {
  const translatedText = await extractTextFromFile(filePath)

  const prompt = `You are an expert translator. Review the following text which has been translated from ${sourceLanguage} to ${targetLanguage}. 
    Correct any errors and improve the fluency, while keeping the original meaning and formatting. 
    ${userPrompt ? `Follow these instructions: ${userPrompt}` : ""}
    
    Return only the revised text.

    Translated text:
    ---
    ${translatedText}`

  const { text: reviewedText } = await generateText({
    model,
    prompt,
  })

  const extension = path.extname(filePath).toLowerCase()
  const baseDir = path.dirname(filePath)
  let reviewedFilePath: string

  if (extension === ".docx") {
    reviewedFilePath = path.join(baseDir, `reviewed-${path.basename(filePath)}`)
    const docxBuffer = await createDocxWithText(filePath, reviewedText)
    await fs.writeFile(reviewedFilePath, docxBuffer)
  } else if (extension === ".pdf") {
    reviewedFilePath = path.join(baseDir, `reviewed-${path.basename(filePath)}`)
    const pdfBuffer = await createPdfWithText(reviewedText)
    await fs.writeFile(reviewedFilePath, pdfBuffer)
  } else if (extension === ".xlsx") {
    reviewedFilePath = path.join(baseDir, `reviewed-${path.basename(filePath)}`)
    const xlsxBuffer = await createXlsxWithText(reviewedText)
    await fs.writeFile(reviewedFilePath, xlsxBuffer)
  } else {
    // For other formats (e.g., .txt), we save the reviewed content as a plain text file.
    reviewedFilePath = path.join(baseDir, `reviewed-${path.basename(filePath, extension)}.txt`)
    await fs.writeFile(reviewedFilePath, reviewedText)
  }

  const { translated_file_url, translated_file_key } = await uploadTranslatedFile(reviewedFilePath, taskId)

  return {
    reviewed_file_url: translated_file_url,
    reviewed_file_key: translated_file_key,
  }
}
