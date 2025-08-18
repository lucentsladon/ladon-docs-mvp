import fs from "fs/promises"
import path from "path"
import { env } from "@/env"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  endpoint: env.S3_ENDPOINT,
})

export async function downloadOriginalFile(
  sourceUrl: string,
  taskId: string
): Promise<{ tempDir: string; originalFilePath: string }> {
  const tempDir = path.join("/tmp", taskId)
  await fs.mkdir(tempDir, { recursive: true })
  const originalFilePath = path.join(tempDir, path.basename(new URL(sourceUrl).pathname))

  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`Failed to download original file: ${response.statusText}`)
  }
  const fileBuffer = await response.arrayBuffer()
  await fs.writeFile(originalFilePath, Buffer.from(fileBuffer))

  return { tempDir, originalFilePath }
}

export async function uploadTranslatedFile(
  filePath: string,
  taskId: string
): Promise<{ translated_file_url: string; translated_file_key: string }> {
  const fileKey = `translated/${taskId}/${path.basename(filePath)}`
  const fileBuffer = await fs.readFile(filePath)

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
    })
  )

  const publicUrl = `${env.S3_PUBLIC_HOSTNAME}/${fileKey}`

  return { translated_file_url: publicUrl, translated_file_key: fileKey }
}

export async function cleanupTemporaryFiles(tempDir: string): Promise<void> {
  await fs.rm(tempDir, { recursive: true, force: true })
}
