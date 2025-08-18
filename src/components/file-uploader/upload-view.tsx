import { Loader2, UploadCloud } from "lucide-react"
import { motion } from "motion/react"

import { MAX_SIZE_MB, SUPPORTED_FORMATS_STRING } from "./constants"

interface UploadViewProps {
  isDragActive: boolean
  isUploading: boolean
  getRootProps: () => React.HTMLAttributes<HTMLDivElement>
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>
}

export function UploadView({ isDragActive, isUploading, getRootProps, getInputProps }: UploadViewProps) {
  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div
        {...getRootProps()}
        className={`border-border bg-background relative flex h-64 flex-col items-center justify-center rounded-2xl border transition-all duration-300 ease-in-out ${isDragActive ? "border-primary bg-primary/10 scale-105" : ""} ${isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="z-10 flex flex-col items-center gap-4 text-center">
          {isUploading ? (
            <>
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">Uploading your document...</p>
            </>
          ) : (
            <>
              <div className="bg-primary/10 rounded-full p-3">
                <UploadCloud className="text-primary h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {isDragActive ? "Drop it like it's hot!" : "Drag & drop files here"}
                </p>
                <p className="text-muted-foreground text-sm">or click to browse</p>
              </div>
              <p className="text-muted-foreground px-6 text-xs">
                Supports {SUPPORTED_FORMATS_STRING} up to {MAX_SIZE_MB}MB
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
