import { useCallback, useEffect, useMemo, useState } from "react"
import { useDropzone, type DropzoneInputProps, type FileError, type FileRejection } from "react-dropzone"
import { toast } from "sonner"

import { api } from "@/trpc/react"

export interface FileWithPreview extends File {
  preview?: string
  errors: readonly FileError[]
  uploadProgress?: number
}

type UsePresignedUploadOptions = {
  /**
   * Allowed MIME types for each file upload (e.g `image/png`, `text/html`, etc).
   * Wildcards are also supported (e.g `image/*`).
   * Defaults to allowing uploading of all MIME types.
   */
  allowedMimeTypes?: string[]
  /**
   * Maximum upload size of each file allowed in bytes. (e.g 1000 bytes = 1 KB)
   */
  maxFileSize?: number
  /**
   * Maximum number of files allowed per upload.
   */
  maxFiles?: number
}

export type UploadSuccess = {
  originalName: string
  s3Key: string
  publicUrl: string
}

export type UploadError = {
  name: string
  message: string
}

type UsePresignedUploadReturn = {
  files: FileWithPreview[]
  setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>
  successes: UploadSuccess[]
  isSuccess: boolean
  loading: boolean
  errors: UploadError[]
  setErrors: React.Dispatch<React.SetStateAction<UploadError[]>>
  uploadFiles: () => Promise<UploadSuccess[]>
  isDragActive: boolean
  isDragAccept: boolean
  isDragReject: boolean
  isFocused: boolean
  getRootProps: <T extends React.HTMLAttributes<HTMLElement>>(props?: T) => T
  getInputProps: <T extends React.InputHTMLAttributes<HTMLInputElement>>(props?: T) => T & DropzoneInputProps
  open: () => void
  maxFileSize?: number
  maxFiles?: number
  allowedMimeTypes?: string[]
  totalUploadProgress: number | null
  inputRef: React.RefObject<HTMLInputElement>
}

const usePresignedUpload = (options: UsePresignedUploadOptions): UsePresignedUploadReturn => {
  const { allowedMimeTypes = [], maxFileSize = Number.POSITIVE_INFINITY, maxFiles = 1 } = options

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<UploadError[]>([])
  const [successes, setSuccesses] = useState<UploadSuccess[]>([])

  const getUploadUrlMutation = api.storage.createPresignedUploadUrl.useMutation()

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setErrors([])
      setSuccesses([])

      const currentFiles = files

      const validFilesToAdd = acceptedFiles
        .filter((file) => !currentFiles.some((f) => f.name === file.name))
        .map((file) => {
          const fileWithPreview: FileWithPreview = Object.assign(file, {
            preview: URL.createObjectURL(file),
            errors: [],
            uploadProgress: 0,
          })
          return fileWithPreview
        })

      const invalidFilesToAdd = fileRejections
        .filter((rejection) => !currentFiles.some((f) => f.name === rejection.file.name))
        .map(({ file, errors }) => {
          const fileWithPreview: FileWithPreview = Object.assign(file, {
            preview: URL.createObjectURL(file),
            errors: errors,
            uploadProgress: 0,
          })
          return fileWithPreview
        })

      const combinedFiles = [...currentFiles, ...validFilesToAdd, ...invalidFilesToAdd]

      if (combinedFiles.length > maxFiles) {
        const filesToKeep = combinedFiles.slice(0, maxFiles)
        const filesToReject = combinedFiles.slice(maxFiles)

        const rejectedWithErrors = filesToReject.map((file) => {
          if (!file.errors.some((e) => e.code === "too-many-files")) {
            return {
              ...file,
              errors: [...file.errors, { code: "too-many-files", message: `Maximum number of files is ${maxFiles}` }],
            }
          }
          return file
        })

        setFiles([...filesToKeep, ...rejectedWithErrors])

        setErrors([
          { name: "general", message: `Cannot add more than ${maxFiles} file(s). Some files were not added.` },
        ])
      } else {
        setFiles(combinedFiles)
      }
    },
    [files, maxFiles]
  )

  const dropzoneProps = useDropzone({
    onDrop,
    accept: allowedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    multiple: maxFiles !== 1,
    onDropRejected: (fileRejections) => {
      const rejectionErrors: UploadError[] = fileRejections.map(({ file, errors: fileErrors }) => ({
        name: file.name,
        message: fileErrors.map((e) => e.message).join(", "),
      }))
      setErrors((prev) => [...prev, ...rejectionErrors])
    },
    onDropAccepted: () => {
      setErrors((prev) => prev.filter((e) => e.name !== "general"))
    },
  })

  const uploadFile = useCallback(
    async (file: FileWithPreview): Promise<UploadSuccess | UploadError> => {
      try {
        const data = await getUploadUrlMutation.mutateAsync({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        })

        const { presignedUrl, key, publicUrl } = data
        console.log(`Requesting presigned URL for ${file.name}`)
        if (!presignedUrl || !key || !publicUrl) {
          console.error(`Invalid presigned URL response for ${file.name}:`, { presignedUrl, key, publicUrl })
          throw new Error("Invalid response from presigned URL endpoint.")
        }

        if (!presignedUrl || !key || !publicUrl) {
          console.error(`Invalid presigned URL response for ${file.name}:`, { presignedUrl, key, publicUrl })
          throw new Error("Invalid response from presigned URL endpoint.")
        }
        console.log(`Got presigned URL for ${file.name}, Key: ${key}`)

        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open("PUT", presignedUrl)

          xhr.setRequestHeader("Content-Type", file.type)

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100)
              setFiles((prevFiles) =>
                prevFiles.map((f) => (f.name === file.name ? { ...f, uploadProgress: progress } : f))
              )
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              console.log(`Upload successful for ${file.name}`)
              setFiles((prevFiles) => prevFiles.map((f) => (f.name === file.name ? { ...f, uploadProgress: 100 } : f)))
              resolve({ originalName: file.name, s3Key: key, publicUrl })
            } else {
              console.error(`Upload failed for ${file.name}: ${xhr.statusText} (Status: ${xhr.status})`)
              setFiles((prevFiles) =>
                prevFiles.map((f) => (f.name === file.name ? { ...f, uploadProgress: undefined } : f))
              )
              reject(new Error(`Upload failed: ${xhr.statusText} (Status: ${xhr.status})`))
            }
          }

          xhr.onerror = (err) => {
            console.error(`Upload network error for ${file.name}:`, err)
            setFiles((prevFiles) =>
              prevFiles.map((f) => (f.name === file.name ? { ...f, uploadProgress: undefined } : f))
            )
            reject(new Error("Upload failed due to network error."))
          }

          xhr.send(file)
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown upload error occurred"
        console.error(`Error during upload process for ${file.name}:`, error)
        setFiles((prevFiles) => prevFiles.map((f) => (f.name === file.name ? { ...f, uploadProgress: undefined } : f)))
        toast.error(`Upload error for ${file.name}: ${message}`)
        return { name: file.name, message }
      }
    },
    [setFiles, getUploadUrlMutation]
  )

  const uploadFiles = useCallback(async () => {
    setLoading(true)
    setErrors([])
    setSuccesses([])
    setFiles((prev) => prev.map((f) => ({ ...f, uploadProgress: 0 })))

    const filesToUpload = files.filter((file) => file.errors.length === 0)

    if (filesToUpload.length === 0) {
      console.log("No valid files selected for upload.")
      setLoading(false)
      if (files.length > 0) {
        setErrors([{ name: "general", message: "No valid files to upload (check errors)." }])
        toast.error("No valid files to upload (check errors).")
      } else {
        setErrors([{ name: "general", message: "Please select a file to upload." }])
        toast.error("Please select a file to upload.")
      }
      return []
    }

    console.log(`Starting upload for ${filesToUpload.length} files...`)
    const results = await Promise.all(filesToUpload.map(uploadFile))

    const currentErrors: UploadError[] = []
    const currentSuccesses: UploadSuccess[] = []

    results.forEach((result) => {
      if (result && "message" in result && "name" in result && !("s3Key" in result)) {
        currentErrors.push(result as UploadError)
      } else if (result && "s3Key" in result) {
        currentSuccesses.push(result as UploadSuccess)
      }
    })

    setErrors(currentErrors)
    setSuccesses(currentSuccesses)
    setLoading(false)
    console.log(`Upload finished. Successes: ${currentSuccesses.length}, Errors: ${currentErrors.length}`)

    currentErrors.forEach((err) => toast.error(`Upload error: ${err.name} - ${err.message}`))

    return currentSuccesses
  }, [files, uploadFile, setFiles])

  const totalUploadProgress = useMemo(() => {
    if (files.length === 0) return null

    const filesBeingUploaded = files.filter((f) => f.errors.length === 0)

    if (!loading || filesBeingUploaded.length === 0) {
      return null
    }

    const totalProgress = filesBeingUploaded.reduce((acc, file) => acc + (file.uploadProgress ?? 0), 0)
    return Math.round(totalProgress / filesBeingUploaded.length)
  }, [files, loading])

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (files.length === 0) {
      setErrors([])
      setSuccesses([])
    }
  }, [files.length])

  return {
    files,
    setFiles,
    successes,
    isSuccess: successes.length > 0 && successes.length === files.filter((f) => f.errors.length === 0).length,
    loading,
    errors,
    setErrors,
    uploadFiles,
    isDragActive: dropzoneProps.isDragActive,
    isDragAccept: dropzoneProps.isDragAccept,
    isDragReject: dropzoneProps.isDragReject,
    isFocused: dropzoneProps.isFocused,
    getRootProps: dropzoneProps.getRootProps,
    getInputProps: dropzoneProps.getInputProps,
    open: dropzoneProps.open,
    maxFileSize,
    maxFiles,
    allowedMimeTypes,
    totalUploadProgress,
    inputRef: dropzoneProps.inputRef,
  }
}

export type { UsePresignedUploadOptions, UsePresignedUploadReturn }

export default usePresignedUpload
