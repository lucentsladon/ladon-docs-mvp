import { useCallback, useEffect, useState } from "react"
import { env } from "@/env"
import { Formality } from "@prisma/client"
import { useDropzone, type FileRejection, type FileWithPath } from "react-dropzone"
import { toast } from "sonner"

import usePresignedUpload from "@/hooks/use-presigned-upload"
import { formatBytes } from "@/lib/utils"
import { api } from "@/trpc/react"

import {
  defaultSourceLang,
  defaultTargetLang,
  isSupportedLanguage,
  LANGUAGES,
  MAX_SIZE_BYTES,
  type FileData,
  type RunStatus,
  type SupportedLanguage,
} from "../constants"

export function useFileUploader() {
  const [currentStep, setCurrentStep] = useState(0)
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [sourceLang, setSourceLang] = useState<SupportedLanguage>(defaultSourceLang as SupportedLanguage)
  const [targetLang, setTargetLang] = useState<SupportedLanguage>(defaultTargetLang as SupportedLanguage)
  const [userPrompt, setUserPrompt] = useState("")
  const [formality, setFormality] = useState<Formality>("default")
  const [eventId, setEventId] = useState<string | null>(null)

  const utils = api.useUtils()

  const enableSameLanguageTranslation = env.NEXT_PUBLIC_ENABLE_SAME_LANGUAGE_TRANSLATION === "true"

  const {
    files,
    setFiles,
    loading: isUploading,
    uploadFiles,
  } = usePresignedUpload({
    maxFiles: 1,
    maxFileSize: MAX_SIZE_BYTES,
    allowedMimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ],
  })

  const triggerTranslate = api.task.triggerTranslation.useMutation({
    onSuccess: (data) => {
      setEventId(data.eventId)
      utils.task.list.invalidate()
    },
    onError: (error) => {
      console.error("Translation trigger failed:", error)
      toast.error(`Translation failed: ${error.message}`)
      setCurrentStep(1)
    },
  })

  const {
    data: run,
    isSuccess,
    isError,
    error: runError,
  } = api.task.runStatus.useQuery(eventId!, {
    enabled: !!eventId && currentStep === 2,
    refetchInterval: (query) => {
      const data = query.state.data as RunStatus
      const terminalStatus = data?.status === "Completed" || data?.status === "Failed" || data?.status === "Cancelled"
      return terminalStatus ? false : 2000
    },
  })

  useEffect(() => {
    if (isSuccess && run) {
      if (run?.status === "Completed" || run?.status === "Failed" || run?.status === "Cancelled") {
        setCurrentStep(3)
        if (run.status === "Completed") {
          toast.success("Translation process finished.")
        } else if (run.status === "Failed") {
          toast.error("Translation process failed.", {
            description: run.error?.message ?? "An unknown error occurred.",
          })
        }
      }
    }
  }, [isSuccess, run])

  useEffect(() => {
    if (isError && runError) {
      toast.error(`Error checking task status: ${runError.message}`)
      setEventId(null)
      setCurrentStep(1)
    }
  }, [isError, runError])

  useEffect(() => {
    if (files.length > 0 && !fileData) {
      const file = files[0]
      setFileData({
        file,
        preview: file.preview || "",
        key: "",
      })
      setCurrentStep(1)
    } else if (files.length === 0) {
      setFileData(null)
      setCurrentStep(0)
    }
  }, [files, fileData])

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        toast.error(`${fileRejections.length} file(s) were rejected.`, {
          description: fileRejections
            .map((r) => {
              const errorMessage = r.errors
                .map((e) => {
                  if (e.code === "file-too-large") {
                    return `File is larger than ${formatBytes(MAX_SIZE_BYTES)}`
                  }
                  return e.message
                })
                .join(", ")
              return `${r.file.name}: ${errorMessage}`
            })
            .join("\\n"),
        })
        return
      }
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
            errors: [],
          })
        )
      )
    },
    [setFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: MAX_SIZE_BYTES,
  })

  const handleSourceLangChange = (value: string) => {
    const newLang = LANGUAGES.find((l) => l.value === value)
    if (newLang && isSupportedLanguage(newLang.value)) {
      if (newLang.value === targetLang.value && !enableSameLanguageTranslation) {
        setTargetLang(sourceLang)
      }
      setSourceLang(newLang)
    } else {
      toast.error("Invalid source language selected.")
    }
  }

  const handleTargetLangChange = (value: string) => {
    const newLang = LANGUAGES.find((l) => l.value === value)
    if (newLang && isSupportedLanguage(newLang.value)) {
      if (newLang.value === sourceLang.value && !enableSameLanguageTranslation) {
        setSourceLang(targetLang)
      }
      setTargetLang(newLang)
    } else {
      toast.error("Invalid target language selected.")
    }
  }

  const handleTranslate = () => {
    if (!files[0]) {
      toast.error("No file to translate.")
      return
    }
    if (sourceLang === targetLang && !enableSameLanguageTranslation) {
      toast.error("Source and target languages must be different.")
      return
    }

    setCurrentStep(2) // This will now be the "processing" step, but we show "uploading" view in the component
    uploadFiles()
      .then((uploadResults) => {
        const result = uploadResults[0]
        if (!result || !("publicUrl" in result)) {
          throw new Error("Upload failed or did not return a public URL.")
        }
        // Update fileData with the final public URL and S3 key
        setFileData((prevData: FileData | null) => {
          if (!prevData) throw new Error("File data was not initialized.")
          return {
            ...prevData,
            preview: result.publicUrl,
            key: result.s3Key,
          }
        })
        const file = files[0]
        if (!file) {
          throw new Error("File not found after upload.")
        }
        return triggerTranslate.mutateAsync({
          original_file_url: result.publicUrl,
          original_file_key: result.s3Key,
          file_name: file.name,
          inputLanguage: sourceLang.value,
          outputLanguage: targetLang.value,
          prompt: userPrompt || undefined,
          formality: formality,
        })
      })
      .catch((error) => {
        console.error("Upload or translation trigger failed:", error)
        toast.error("Process failed.", {
          description: error instanceof Error ? error.message : "An unknown error occurred.",
        })
        setCurrentStep(1)
      })
  }

  const handleStartNew = () => {
    window.location.reload()
  }

  const shouldDisableActions = currentStep === 2 || triggerTranslate.isPending || isUploading
  const isLanguageSwapDisabled = shouldDisableActions

  return {
    currentStep,
    fileData,
    isUploading,
    sourceLang,
    targetLang,
    userPrompt,
    formality,
    run,
    shouldDisableActions,
    isLanguageSwapDisabled,
    getRootProps,
    getInputProps,
    isDragActive,
    handleSourceLangChange,
    handleTargetLangChange,
    setUserPrompt,
    setFormality,
    handleTranslate,
    handleStartNew,
    triggerTranslate,
  }
}
