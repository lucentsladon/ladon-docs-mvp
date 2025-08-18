"use client"

import { FileText, Loader2, Wand2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { BackButton } from "@/components/common/back-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { APP_ROUTES } from "@/config/routes"

import { ConfigureView } from "./configure-view"
import { MAX_SIZE_MB, SUPPORTED_FORMATS_STRING } from "./constants"
import { FinishedView } from "./finished-view"
import { useFileUploader } from "./hooks/use-file-uploader"
import { ProcessingView } from "./processing-view"
import { UploadView } from "./upload-view"
import { UploadingView } from "./uploading-view"

function FileUploader() {
  const {
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
  } = useFileUploader()

  const stageTitles = [
    "Upload Your Document",
    "Configure Translation",
    isUploading ? "Uploading..." : "Translating Your Document",
    "Translation Complete",
  ]

  const stageDescriptions = [
    "Upload a document to translate it into another language.",
    "Choose languages and customize your translation settings.",
    isUploading
      ? "Your document is being uploaded. Please wait."
      : "We're working our magic to translate your document. This might take a few minutes.",
    "Your document has been translated and is ready to download.",
  ]

  return (
    <Card className="bg-card w-full max-w-2xl overflow-hidden rounded-3xl">
      <CardHeader className="relative pb-2">
        <div className="flex justify-between">
          <BackButton href={APP_ROUTES.APP} />
          {/* <div>
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <Globe className="h-3 w-3" />
              AI Translation
            </Badge>
          </div> */}
        </div>
        <CardTitle className="font-lora text-2xl font-bold tracking-tight text-slate-800">
          {stageTitles[currentStep]}
        </CardTitle>
        <CardDescription>{stageDescriptions[currentStep]}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <UploadView
              isDragActive={isDragActive}
              isUploading={isUploading}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
            />
          )}

          {currentStep === 1 && fileData && (
            <ConfigureView
              fileData={fileData}
              sourceLang={sourceLang}
              targetLang={targetLang}
              userPrompt={userPrompt}
              formality={formality}
              shouldDisableActions={shouldDisableActions}
              isLanguageSwapDisabled={isLanguageSwapDisabled}
              handleStartNew={handleStartNew}
              handleSourceLangChange={handleSourceLangChange}
              handleTargetLangChange={handleTargetLangChange}
              setUserPrompt={setUserPrompt}
              setFormality={setFormality}
            />
          )}

          {currentStep === 2 && (isUploading ? <UploadingView /> : <ProcessingView fileData={fileData} />)}

          {currentStep === 3 && run && <FinishedView run={run} targetLang={targetLang} />}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-between pt-6">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="footer-upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <div className="text-muted-foreground space-y-2 text-center text-xs">
                <p>
                  Upload a document file up to {MAX_SIZE_MB}MB. Supported formats: {SUPPORTED_FORMATS_STRING}.
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="footer-configure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <Button onClick={handleTranslate} disabled={shouldDisableActions} className="w-full gap-2" size="lg">
                {triggerTranslate.isPending || isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Start Translation
              </Button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="footer-processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <p className="text-muted-foreground text-center text-xs">
                {isUploading
                  ? "Your document is uploading. Please do not close this window."
                  : "Please wait while we process your document. This may take a few minutes."}
              </p>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="footer-finished"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <Button onClick={handleStartNew} className="w-full gap-2" size="lg">
                <FileText className="h-4 w-4" />
                Translate Another Document
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardFooter>
    </Card>
  )
}
export default FileUploader
