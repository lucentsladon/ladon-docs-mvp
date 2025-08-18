import { Formality, TaskStatus } from "@prisma/client"
import { NonRetriableError } from "inngest"

import { getDeepLService } from "@/lib/deepl/service"
import { db } from "@/server/db"

import { inngest } from "../client"
import { cleanupTemporaryFiles, downloadOriginalFile, uploadTranslatedFile } from "../steps/document-file-handling"
import { reviewTranslationWithLLM } from "../steps/llm-review"

const DEEPL_STATUS_POLL_INTERVAL = "5s"

export const documentTranslationJob = inngest.createFunction(
  { id: "document-translation", retries: 0 },
  { event: "document/translate" },
  async ({ event, step, logger }) => {
    const { taskId } = event.data
    let tempDir = ""

    try {
      logger.info(`Starting document translation for task: ${taskId}`)

      const task = await step.run("get-task-details", () => {
        return db.task.findUnique({ where: { id: taskId } })
      })

      if (!task) {
        throw new NonRetriableError(`Task with ID ${taskId} not found.`)
      }

      await step.run("update-task-status-processing", () => {
        return db.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.processing, trigger_id: event.id },
        })
      })

      const { originalFilePath, tempDir: newTempDir } = await step.run("download-original-file", () =>
        downloadOriginalFile(task.original_file_url, taskId)
      )
      tempDir = newTempDir

      const deeplService = getDeepLService()
      if (!deeplService) {
        throw new NonRetriableError("DeepL service is not available.")
      }

      const { document_id, document_key } = await step.run("translate-document", () =>
        deeplService.translateDocument(
          originalFilePath,
          task.source_language,
          task.target_language,
          task.formality as Formality
        )
      )

      let isTranslationComplete = false
      while (!isTranslationComplete) {
        const statusResponse = await step.run("get-translation-status", () =>
          deeplService.getDocumentStatus(document_id, document_key)
        )

        if (statusResponse.status === "done") {
          isTranslationComplete = true
        } else if (statusResponse.status === "error") {
          throw new Error(`Translation failed: ${statusResponse.error_message}`)
        } else {
          await step.sleep("wait-for-poll", DEEPL_STATUS_POLL_INTERVAL)
        }
      }

      const translatedFilePath = originalFilePath
      await step.run("download-translated-file", () =>
        deeplService.downloadTranslatedDocument(document_id, document_key, translatedFilePath)
      )

      const { translated_file_url, translated_file_key } = await step.run("upload-translated-file", () =>
        uploadTranslatedFile(translatedFilePath, taskId)
      )

      const { reviewed_file_url, reviewed_file_key } = await step.run("review-translation-with-llm", () =>
        reviewTranslationWithLLM(
          translatedFilePath,
          taskId,
          task.source_language,
          task.target_language,
          task.prompt
        )
      )

      await step.run("update-task-status-completed", () => {
        return db.task.update({
          where: { id: taskId },
          data: {
            status: TaskStatus.completed,
            translated_file_url,
            translated_file_key,
            reviewed_file_url,
            reviewed_file_key,
          },
        })
      })

      return { message: "Document translation completed successfully" }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      logger.error(`Document translation failed for task ${taskId}: ${errorMessage}`)

      await step.run("update-task-status-failed", () => {
        return db.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.failed, error_message: errorMessage },
        })
      })

      throw error
    } finally {
      if (tempDir) {
        await step.run("cleanup-temporary-files", () => cleanupTemporaryFiles(tempDir))
      }
    }
  }
)
