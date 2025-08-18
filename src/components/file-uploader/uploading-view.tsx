import { FileText } from "lucide-react"
import { motion } from "motion/react"

import { Progress } from "@/components/ui/progress"

export function UploadingView() {
  return (
    <motion.div
      key="uploading"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="bg-muted flex h-64 flex-col items-center justify-center rounded-xl border p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400" />
        <h3 className="pt-4 text-xl font-semibold">Uploading Document...</h3>
        <p className="text-muted-foreground text-sm">Your document is being uploaded. Please keep this window open.</p>
        <div className="w-full max-w-xs pt-4">
          <Progress value={50} className="h-2" />
        </div>
      </div>
    </motion.div>
  )
}
