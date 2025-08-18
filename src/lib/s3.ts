import { Readable } from "stream"
import { GetObjectCommand, PutObjectCommand, PutObjectCommandInput, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import slugify from "slugify"

// Read Generic S3-compatible credentials and endpoint from environment variables
const accessKeyId = process.env.S3_ACCESS_KEY_ID
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
const region = process.env.S3_REGION
const bucketName = process.env.S3_BUCKET_NAME
const endpoint = process.env.S3_ENDPOINT // Generic S3 endpoint
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true" // Read path style config
const publicHostname = process.env.S3_PUBLIC_HOSTNAME // e.g., pub-xxx.r2.dev or your custom domain

// Keep Supabase URL only if needed for non-S3 things
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Validate all necessary environment variables
if (!accessKeyId) throw new Error("Missing environment variable S3_ACCESS_KEY_ID")
if (!secretAccessKey) throw new Error("Missing environment variable S3_SECRET_ACCESS_KEY")
if (!region) throw new Error("Missing environment variable S3_REGION")
if (!bucketName) throw new Error("Missing environment variable S3_BUCKET_NAME")
if (!endpoint) throw new Error("Missing environment variable S3_ENDPOINT")
// Validate the public hostname is set if we intend to return public URLs
if (!publicHostname) throw new Error("Missing environment variable S3_PUBLIC_HOSTNAME (needed for public URLs)")

// Initialize S3 client for the S3-compatible endpoint
const s3Client = new S3Client({
  forcePathStyle: forcePathStyle, // Use env var
  region: region,
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
})

/**
 * Generates pre-signed PUT and GET URLs for a file.
 * @param fileName The name of the file to be uploaded.
 * @param fileType The MIME type of the file.
 * @param fileSize The size of the file in bytes.
 * @param pathPrefix Optional prefix for the S3 key (e.g., 'videos/')
 * @param putUrlExpiresIn Expiration time for the PUT URL in seconds (default: 300 = 5 minutes)
 * @param getUrlExpiresIn Expiration time for the GET URL in seconds (default: 3600 = 1 hour)
 * @returns An object containing the presigned PUT URL, GET URL, S3 key, and public URL.
 */
export async function generatePresignedPutUrl(
  fileName: string,
  fileType: string,
  fileSize: number,
  pathPrefix: string = "",
  putUrlExpiresIn: number = 300, // Renamed expiresIn for clarity
  getUrlExpiresIn: number = 3600 // Added expiration for GET URL (1 hour)
): Promise<{ presignedPutUrl: string; presignedGetUrl: string; key: string; publicUrl: string; error: string | null }> {
  console.log(`Generating presigned PUT/GET URLs for: ${fileName} (${fileType})`)

  // --- Filename Sanitization ---
  const extension = fileName.split(".").pop() ?? ""
  const baseName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName // Handle names with no extension
  // Replace spaces with underscores, remove non-alphanumeric/hyphen/underscore/dot chars (except extension dot)
  const sanitizedBaseName = slugify(baseName, { lower: true, strict: true })
  // Prevent empty basenames after sanitization
  const finalBaseName = sanitizedBaseName || "file"
  // const sanitizedFileName = `${finalBaseName}.${extension}`; // This isn't used for the key, remove if not needed elsewhere

  // Generate the key using only sanitized name and extension
  const uniqueId = crypto.randomUUID()
  const key = `${pathPrefix}${uniqueId}-${finalBaseName}.${extension}`.replace(/^\//, "") // Ensure no leading slash

  console.log(`Original Filename: ${fileName}, Sanitized Base: ${finalBaseName}, Final Key: ${key}`)

  // TODO: Add server-side validation for fileType and fileSize if needed
  // Example: if (!fileType.startsWith('video/')) return {..., error: 'Invalid file type' };

  try {
    // Generate PUT URL
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    })
    const presignedPutUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: putUrlExpiresIn })
    console.log(`Generated Presigned PUT URL (expires in ${putUrlExpiresIn}s): ${presignedPutUrl}`)

    // Generate GET URL
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
    const presignedGetUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: getUrlExpiresIn,
      signableHeaders: new Set(["host"]),
    })
    console.log(`Generated Presigned GET URL (expires in ${getUrlExpiresIn}s): ${presignedGetUrl}`)

    // Construct the public URL using the S3_PUBLIC_HOSTNAME
    // Format: https://<public_hostname>/<key>
    const publicUrl = `${publicHostname}/${key}`

    console.log(`Generated Presigned URL (expires in ${putUrlExpiresIn}s): ${presignedPutUrl}`)
    console.log(`Generated Presigned GET URL (expires in ${getUrlExpiresIn}s): ${presignedGetUrl}`)
    console.log(`Corresponding Public URL: ${publicUrl}`)
    console.log(`Object Key: ${key}`)

    return { presignedPutUrl, presignedGetUrl, key, publicUrl, error: null }
  } catch (e) {
    console.error("Error generating presigned URLs:", e)
    const message = e instanceof Error ? e.message : String(e)
    return {
      presignedPutUrl: "",
      presignedGetUrl: "",
      key: "",
      publicUrl: "",
      error: `Failed to generate presigned URLs: ${message}`,
    }
  }
}


/**
 * Uploads a file (Buffer or ReadableStream) to S3-compatible storage.
 * @param fileContent The file content as a Buffer or ReadableStream.
 * @param s3Key The destination S3 key (path).
 * @param contentType The MIME type of the file.
 * @param contentLength Optional content length of the file
 * @returns The public URL of the uploaded file.
 */
export async function uploadFileToS3(
  fileContent: Buffer | Readable,
  s3Key: string,
  contentType: string,
  contentLength?: number
): Promise<{ publicUrl: string; error: string | null }> {
  console.log(`Starting generic S3 upload to key: ${s3Key}`)

  // Create a promise that handles stream errors during upload
  return new Promise(async (resolve, reject) => {
    let streamError: Error | null = null

    // Attach error listener to the stream immediately
    if (fileContent instanceof Readable) {
      fileContent.on("error", (err) => {
        console.error(`Error emitted from input stream during S3 upload (key: ${s3Key}):`, err)
        streamError = err // Store the error
        // We might not be able to directly reject here if the s3Client.send() call is already in progress
        // The s3Client.send() call should ideally reject in this case, but we log it here for certainty.
      })
    }

    try {
      const putObjectParams: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: s3Key,
        Body: fileContent,
        ContentType: contentType,
        ...(contentLength !== undefined && { ContentLength: contentLength }),
      }

      console.log("S3 PutObject Params:", putObjectParams) // Log params for debugging

      const command = new PutObjectCommand(putObjectParams)
      await s3Client.send(command)

      // Check if the stream emitted an error *during* the send command
      if (streamError) {
        // Even if s3Client.send didn't throw, reject if the source stream failed
        throw streamError
      }

      console.log(`Successfully uploaded file via S3 protocol to bucket '${bucketName}' at key '${s3Key}'`)

      const publicUrl = `${publicHostname}/${s3Key}`
      console.log(`Generated public Storage URL: ${publicUrl}`)
      resolve({ publicUrl: publicUrl, error: null }) // Resolve the promise on success
    } catch (e) {
      // Catch errors from s3Client.send() OR errors re-thrown from the stream listener
      console.error(`Exception during S3 PutObject (generic file, key: ${s3Key}):`, e)
      const message = e instanceof Error ? e.message : String(e)
      // Ensure the stream is destroyed if it exists and an error occurred
      if (fileContent instanceof Readable && !fileContent.destroyed) {
        fileContent.destroy(e instanceof Error ? e : new Error(String(e)))
      }
      reject({ publicUrl: "", error: `Exception uploading file via S3 protocol: ${message}` }) // Reject the promise on error
    }
  })
}
