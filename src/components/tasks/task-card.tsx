"use client"

import { memo } from "react"
import Link from "next/link"
import { TaskStatus } from "@prisma/client"
import type { inferRouterOutputs } from "@trpc/server"
import { formatDistanceToNow } from "date-fns"
import { ArrowUpRight, Download, FileSpreadsheet, FileText, FileType, FileUp } from "lucide-react"

import { LANGUAGES } from "@/components/file-uploader/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { AppRouter } from "@/server/api/root"

type RouterOutput = inferRouterOutputs<AppRouter>
type TTask = RouterOutput["task"]["list"]["items"][number]

const getFileIcon = (fileName: string) => {
  if (fileName.endsWith(".pdf")) return <FileType className="h-6 w-6 text-red-500" />
  if (fileName.endsWith(".docx")) return <FileText className="h-6 w-6 text-blue-500" />
  if (fileName.endsWith(".xlsx")) return <FileSpreadsheet className="h-6 w-6 text-green-500" />
  if (fileName.endsWith(".txt")) return <FileText className="h-6 w-6 text-gray-500" />
  return <FileUp className="h-6 w-6 text-gray-500" />
}

export const TaskCard = memo(function TaskCard({ task }: { task: TTask }) {
  const sourceLangLabel = LANGUAGES.find((l) => l.value === task.source_language)?.label ?? task.source_language
  const targetLangLabel = LANGUAGES.find((l) => l.value === task.target_language)?.label ?? task.target_language
  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ease-in-out hover:shadow-lg">
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          {getFileIcon(task.file_name)}
        </div>
        <div className="flex-1">
          <CardTitle className="mb-1 text-base font-semibold">{task.file_name}</CardTitle>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            </span>
            <span
              className={`rounded px-2 py-1 text-xs font-medium capitalize ${task.status === TaskStatus.completed ? "bg-green-100 text-green-800" : task.status === TaskStatus.failed ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
            >
              {task.status}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm font-medium capitalize">
          {sourceLangLabel} → {targetLangLabel}
        </div>
        {task.error_message && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <p className="mt-2 cursor-pointer text-xs text-red-600">Error: Hover to see details</p>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <p className="text-sm">{task.error_message}</p>
            </HoverCardContent>
          </HoverCard>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-end gap-2 bg-gray-50 p-4">
        <Button variant="outline" size="sm" className="w-full gap-2" asChild>
          <Link href={task.original_file_url} target="_blank">
            Original
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
        {task.translated_file_url && task.status === TaskStatus.completed && (
          <Button size="sm" className="w-full gap-2" asChild>
            <Link href={task.translated_file_url} target="_blank">
              Translated
              <Download className="h-4 w-4" />
            </Link>
          </Button>
        )}
        {task.reviewed_file_url && (
          <Button size="sm" className="w-full gap-2" asChild>
            <Link href={task.reviewed_file_url} target="_blank">
              Reviewed
              <Download className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
})
