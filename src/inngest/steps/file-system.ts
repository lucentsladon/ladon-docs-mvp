import fs from "fs/promises"
import path from "path"
import slugify from "slugify"

async function downloadFileFromUrl(url: string, outputPath: string): Promise<void> {
  // Using step.run will automatically log this with "Starting file download"
  const headers = new Headers({
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
  })

  const response = await fetch(url, { headers, redirect: "follow" })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Failed to read error body")
    throw new Error(`Download failed: ${response.status} ${response.statusText} - ${errorBody}`)
  }

  if (!response.body) {
    throw new Error("Response body is null")
  }
  const data = await response.arrayBuffer()
  await fs.writeFile(outputPath, Buffer.from(data))
}

export async function handleVideoDownload(
  sourceUrl: string,
  tempDir: string,
  taskId: string,
  videoTitle?: string
): Promise<string> {
  const extension = sourceUrl.includes(".mp4") ? ".mp4" : ".tmp"
  const slugifiedTitle = videoTitle ? slugify(videoTitle, { lower: true, strict: true }) : taskId
  const downloadedFilePath = path.join(tempDir, `${slugifiedTitle}${extension}`)

  await downloadFileFromUrl(sourceUrl, downloadedFilePath)
  return downloadedFilePath
}
