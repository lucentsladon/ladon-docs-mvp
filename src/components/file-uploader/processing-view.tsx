import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { motion } from "motion/react"
import ReactPlayer from "react-player"

import { Button } from "@/components/ui/button"
import { APP_ROUTES } from "@/config/routes"

import type { FileData } from "./constants"

interface ProcessingViewProps {
  fileData: FileData | null
}

export function ProcessingView({ fileData }: ProcessingViewProps) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="bg-muted relative aspect-video overflow-hidden rounded-xl border">
        {fileData && (
          <ReactPlayer
            src={fileData.preview}
            width="100%"
            height="100%"
            playing={false}
            className="pointer-events-none rounded-xl object-cover opacity-50 blur-sm"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-white/70 p-8 text-center backdrop-blur-sm">
          <CheckCircle2 className="text-primary h-12 w-12" />
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Translation in Progress</h3>
            <div className="text-muted-foreground text-sm">
              <p>Your document is being translated in the background.</p>
              <p>You can safely leave this page.</p>
            </div>
          </div>
          <Button asChild className="mt-4 gap-2">
            <Link href={APP_ROUTES.APP}>
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
