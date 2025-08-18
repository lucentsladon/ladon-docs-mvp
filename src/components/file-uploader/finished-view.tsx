import { AlertCircle, CheckCircle2, FileText, Video, XCircle } from "lucide-react"
import { motion } from "motion/react"
import ReactPlayer from "react-player"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { LANGUAGES, type RunStatus, type SupportedLanguage } from "./constants"

interface FinishedViewProps {
  run: RunStatus
  targetLang: SupportedLanguage
}

export function FinishedView({ run, targetLang }: FinishedViewProps) {
  return (
    <motion.div
      key="finished"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {run && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 ${
            run.status === "Completed"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400"
              : run.status === "Failed"
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
                : "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-400"
          }`}
        >
          {run.status === "Completed" && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
          {run.status === "Failed" && <XCircle className="h-5 w-5 flex-shrink-0" />}
          {run.status === "Cancelled" && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          <div className="space-y-1">
            <p className="font-medium">
              {run.status === "Completed" && "Translation Complete!"}
              {run.status === "Failed" && "Translation Failed"}
              {run.status === "Cancelled" && "Translation Canceled"}
            </p>
            {run.status === "Failed" && <p className="text-sm">Reason: {run.error || "An unknown error occurred."}</p>}
          </div>
        </div>
      )}
      {run?.status === "Completed" && run.output && (
        <div className="space-y-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(run.output as any).sourceVideoUrl && (
            <div className="bg-muted relative aspect-video overflow-hidden rounded-xl border">
              <ReactPlayer
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                src={(run.output as any).sourceVideoUrl}
                width="100%"
                height="100%"
                controls
                className="react-player absolute top-0 left-0"
                crossOrigin="anonymous"
              >
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(run.output as any).translatedVttUrl && (
                  <track
                    kind="subtitles"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    src={(run.output as any).translatedVttUrl}
                    srcLang={targetLang}
                    default
                    label={LANGUAGES.find((l) => l.value === targetLang)?.label ?? targetLang}
                  />
                )}
              </ReactPlayer>
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary/90 backdrop-blur-sm">Translated</Badge>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Separator />
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Download Files</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(run.output as any).shouldBurnSubtitles && (run.output as any).finalVideoUrl && (
                  <Button asChild variant="outline" size="sm" className="h-auto justify-start gap-2 py-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <a href={(run.output as any).finalVideoUrl} target="_blank" rel="noopener noreferrer">
                      <Video className="text-primary" />
                      <div className="flex flex-1 flex-col items-start text-left">
                        <span>Translated Video</span>
                        <span className="text-muted-foreground text-xs">MP4 Format</span>
                      </div>
                    </a>
                  </Button>
                )}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(run.output as any).translatedVttUrl && (
                  <Button asChild variant="outline" size="sm" className="h-auto justify-start gap-2 py-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <a href={(run.output as any).translatedVttUrl} download>
                      <FileText className="text-primary" />
                      <div className="flex flex-1 flex-col items-start text-left">
                        <span>Subtitles (VTT)</span>
                        <span className="text-muted-foreground text-xs">VTT Format</span>
                      </div>
                    </a>
                  </Button>
                )}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(run.output as any).translatedSrtUrl && (
                  <Button asChild variant="outline" size="sm" className="h-auto justify-start gap-2 py-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <a href={(run.output as any).translatedSrtUrl} download>
                      <FileText className="text-primary" />
                      <div className="flex flex-1 flex-col items-start text-left">
                        <span>Subtitles (SRT)</span>
                        <span className="text-muted-foreground text-xs">SRT Format</span>
                      </div>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {run?.status === "Cancelled" && <p className="text-yellow-600">The translation task was canceled.</p>}
    </motion.div>
  )
}
