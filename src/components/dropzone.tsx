"use client"

import { createContext, useCallback, useContext, type PropsWithChildren } from "react"
import { CheckCircle, FileUp, Video, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { type FileError } from "react-dropzone"

import { Button } from "@/components/ui/button"
import {
  type FileWithPreview,
  type UploadError,
  type UploadSuccess,
  type UsePresignedUploadReturn,
} from "@/hooks/use-presigned-upload"
import { cn } from "@/lib/utils"

export const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: "bytes" | "KB" | "MB" | "GB" | "TB" | "PB" | "EB" | "ZB" | "YB"
) => {
  const k = 1000
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  if (bytes === 0 || bytes === undefined) return size !== undefined ? `0 ${size}` : "0 bytes"
  const i = size !== undefined ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

type DropzoneContextType = Omit<UsePresignedUploadReturn, "getRootProps" | "getInputProps">

const DropzoneContext = createContext<DropzoneContextType | undefined>(undefined)

type DropzoneProps = UsePresignedUploadReturn & {
  className?: string
}

const Dropzone = ({
  className,
  children,
  getRootProps,
  getInputProps,
  ...restProps
}: PropsWithChildren<DropzoneProps>) => {
  const isSuccess = restProps.isSuccess
  const isActive = restProps.isDragActive
  const isInvalid =
    (restProps.isDragActive && restProps.isDragReject) ||
    (restProps.errors.length > 0 && !restProps.isSuccess) ||
    restProps.files.some((file: FileWithPreview) => file.errors.length !== 0)

  return (
    <DropzoneContext.Provider value={{ ...restProps }}>
      <motion.div
        {...getRootProps({
          className: cn(
            "relative border-2 rounded-lg text-center bg-card/50 backdrop-blur-sm transition-all duration-300",
            "hover:bg-card/80 hover:border-primary/50",
            className,
            isSuccess ? "border-primary" : "border-dashed",
            isActive && "border-primary bg-primary/5 scale-[1.02]",
            isInvalid && "border-destructive bg-destructive/5"
          ),
        })}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />
        {children}
      </motion.div>
    </DropzoneContext.Provider>
  )
}

const DropzoneContent = ({ className }: { className?: string }) => {
  const {
    files,
    setFiles,
    loading,
    successes,
    errors,
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    isSuccess,
  } = useDropzoneContext()

  const exceedMaxFiles = files.length > maxFiles

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      setFiles(files.filter((file: FileWithPreview) => file.name !== fileName))
    },
    [files, setFiles]
  )

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex flex-row items-center justify-center gap-x-2", className)}
      >
        <CheckCircle size={20} className="text-primary" />
        <p className="text-primary text-sm font-medium">
          Successfully uploaded {files.length} file{files.length > 1 ? "s" : ""}
        </p>
      </motion.div>
    )
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <AnimatePresence>
        {files.map((file: FileWithPreview, idx: number) => {
          const fileError = errors.find((e: UploadError) => e.name === file.name)
          const isSuccessfullyUploaded = !!successes.find((e: UploadSuccess) => e.originalName === file.name)

          return (
            <motion.div
              key={`${file.name}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-x-4 border-b py-3 first:mt-4 last:mb-4"
            >
              <div className="bg-muted/50 flex h-10 w-10 items-center justify-center rounded-lg border">
                <Video size={18} />
              </div>
              <div className="flex shrink grow flex-col items-start truncate">
                <p title={file.name} className="max-w-full truncate text-sm font-medium">
                  {file.name}
                </p>
                {file.errors.length > 0 ? (
                  <p className="text-destructive text-xs">
                    {file.errors
                      .map((e: FileError) =>
                        e.message.startsWith("File is larger than")
                          ? `File is larger than ${formatBytes(maxFileSize, 2)} (Size: ${formatBytes(file.size, 2)})`
                          : e.message
                      )
                      .join(", ")}
                  </p>
                ) : loading && !isSuccessfullyUploaded ? (
                  <p className="text-muted-foreground text-xs">Uploading file...</p>
                ) : !!fileError ? (
                  <p className="text-destructive text-xs">Failed to upload: {fileError.message}</p>
                ) : isSuccessfullyUploaded ? (
                  <p className="text-primary text-xs">Successfully uploaded file</p>
                ) : (
                  <p className="text-muted-foreground text-xs">{formatBytes(file.size, 2)}</p>
                )}
              </div>

              {!loading && !isSuccessfullyUploaded && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 justify-self-end"
                  onClick={() => handleRemoveFile(file.name)}
                >
                  <X />
                </Button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
      {exceedMaxFiles && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-destructive mt-2 text-left text-sm"
        >
          You may upload only up to {maxFiles} files, please remove {files.length - maxFiles} file
          {files.length - maxFiles > 1 ? "s" : ""}.
        </motion.p>
      )}
    </div>
  )
}

const DropzoneEmptyState = ({ className }: { className?: string }) => {
  const { maxFiles = 1, maxFileSize = Number.POSITIVE_INFINITY, inputRef, isSuccess } = useDropzoneContext()

  if (isSuccess) {
    return null
  }

  return (
    <div onClick={() => inputRef.current?.click()} className="size-full cursor-pointer p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex size-full flex-col items-center justify-center gap-y-4", className)}
      >
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <FileUp size={40} className="text-primary" />
          </motion.div>
          <motion.div
            className="bg-primary/10 absolute -inset-2 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">Drop your video here</p>
          <div className="flex flex-col items-center gap-y-1">
            <p className="text-muted-foreground text-xs">
              Drag and drop or select {maxFiles === 1 ? `file` : "files"} to upload
            </p>
            {maxFileSize !== Number.POSITIVE_INFINITY && (
              <p className="text-muted-foreground text-xs">Maximum file size: {formatBytes(maxFileSize, 2)}</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext)

  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone")
  }

  return context
}

export { Dropzone, DropzoneContent, DropzoneEmptyState, useDropzoneContext }
