import { env } from "@/env"
import { TZDate } from "@date-fns/tz"
import { TaskStatus, TaskType } from "@prisma/client"
import { format } from "date-fns"

interface AirtableRecord {
  id?: string
  fields: {
    "Request Id": string
    "Client Email": string
    "Source Language": string
    "Target Language": string
    "Video URL": string
    "AI Notes"?: string
    Status: string
    "Subtitle URL"?: string
    "Created At": string
    "Updated At": string
  }
}

interface AirtableResponse {
  records: AirtableRecord[]
}

interface AirtableError {
  type: string
  message: string
}

interface AirtableErrorResponse {
  error: AirtableError
}

interface TaskData {
  id: string
  userEmail: string
  sourceLanguage: string
  targetLanguage: string
  videoUrl: string
  status?: TaskStatus
  aiNotes?: string
  type: TaskType
  subtitleUrl?: string
  ytVideoUrl?: string
  createdAt: Date | string
  updatedAt: Date | string
}

interface UpdateData {
  status: TaskStatus
  subtitleUrl?: string
  aiNotes?: string
}

interface BatchUpdateItem {
  airtableId: string
  taskId: string
  updateData: UpdateData
}

interface BatchCreateResult {
  success: boolean
  createdRecords: Array<{
    taskId: string
    airtableId: string | null
  }>
  failedRecords: Array<{
    taskId: string
    error: string
  }>
}

interface BatchUpdateResult {
  success: boolean
  updatedRecords: Array<{
    taskId: string
    airtableId: string
  }>
  failedRecords: Array<{
    taskId: string
    airtableId: string
    error: string
  }>
}

const DEFAULT_TIME_ZONE = "Asia/Bangkok"

class AirtableService {
  private baseUrl: string
  private headers: Record<string, string>
  private lastRequestTime: number = 0
  private readonly REQUEST_INTERVAL = 200 // 200ms between requests (5 requests per second)
  private readonly BATCH_SIZE = 10 // Airtable allows up to 10 records per batch

  constructor() {
    if (!env.AIRTABLE_PERSONAL_ACCESS_TOKEN) {
      throw new Error("AIRTABLE_PERSONAL_ACCESS_TOKEN environment variable is required")
    }
    if (!env.AIRTABLE_BASE_ID) {
      throw new Error("AIRTABLE_BASE_ID environment variable is required")
    }
    if (!env.AIRTABLE_TABLE_ID) {
      throw new Error("AIRTABLE_TABLE_ID environment variable is required")
    }

    this.baseUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_ID}`
    this.headers = {
      Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    }
  }

  private async rateLimitDelay(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.REQUEST_INTERVAL) {
      const delayTime = this.REQUEST_INTERVAL - timeSinceLastRequest
      console.log(`[Airtable] Rate limit delay: ${delayTime}ms`)
      await new Promise((resolve) => setTimeout(resolve, delayTime))
    }

    this.lastRequestTime = Date.now()
  }

  private formatDate(date: Date | string | undefined | null): string {
    try {
      // Handle null/undefined cases
      if (!date) {
        return new Date().toISOString()
      }

      // Ensure we have a Date object
      const dateObj = typeof date === "string" ? new Date(date) : date

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn("[Airtable] Invalid date provided, using current date")
        return new Date().toISOString()
      }

      // Create TZDate with the specified timezone
      const tzDate = new TZDate(dateObj, DEFAULT_TIME_ZONE)

      // Format the date
      return format(tzDate, "dd-MM-yyyy HH:mm:ss")
    } catch (error) {
      console.error("[Airtable] Date formatting error:", error, "Input:", date)
      // Fallback to current date ISO string if formatting fails
      return new Date().toISOString()
    }
  }

  private async makeRequest<T>(url: string, options: RequestInit, operation: string): Promise<T | null> {
    try {
      await this.rateLimitDelay()

      console.log(`[Airtable] Starting ${operation}...`)
      const response = await fetch(url, options)

      if (response.status === 429) {
        console.warn(`[Airtable] Rate limit exceeded for ${operation}. Waiting 30 seconds...`)
        await new Promise((resolve) => setTimeout(resolve, 30000))

        // Retry once after rate limit
        await this.rateLimitDelay()
        const retryResponse = await fetch(url, options)

        if (!retryResponse.ok) {
          const errorData = (await retryResponse.json().catch(() => ({}))) as AirtableErrorResponse
          console.error(`[Airtable] ${operation} failed after retry:`, {
            status: retryResponse.status,
            statusText: retryResponse.statusText,
            error: errorData.error,
          })
          return null
        }

        const retryData = (await retryResponse.json()) as T
        console.log(`[Airtable] ${operation} succeeded after retry`)
        return retryData
      }

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as AirtableErrorResponse
        console.error(`[Airtable] ${operation} failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
        })
        return null
      }

      const data = (await response.json()) as T
      console.log(`[Airtable] ${operation} succeeded`)
      return data
    } catch (error) {
      console.error(`[Airtable] ${operation} error:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return null
    }
  }

  private createRecordFromTaskData(taskData: TaskData): AirtableRecord {
    const videoUrl = taskData.type === TaskType.youtube && taskData.ytVideoUrl ? taskData.ytVideoUrl : taskData.videoUrl

    return {
      fields: {
        "Request Id": taskData.id,
        "Client Email": taskData.userEmail,
        "Source Language": taskData.sourceLanguage,
        "Target Language": taskData.targetLanguage,
        "Video URL": videoUrl,
        "AI Notes": taskData.aiNotes || "",
        Status: taskData.status || "processing",
        "Subtitle URL": taskData.subtitleUrl || "",
        "Created At": this.formatDate(taskData.createdAt),
        "Updated At": this.formatDate(taskData.updatedAt),
      },
    }
  }

  private createUpdateRecord(airtableId: string, updateData: UpdateData): AirtableRecord {
    const statusMapping: Record<TaskStatus, string> = {
      [TaskStatus.pending]: "pending",
      [TaskStatus.processing]: "processing",
      [TaskStatus.completed]: "completed",
      [TaskStatus.failed]: "failed",
    }

    const updateFields: Partial<AirtableRecord["fields"]> = {
      Status: statusMapping[updateData.status],
      "Updated At": this.formatDate(new Date()),
    }

    if (updateData.subtitleUrl) {
      updateFields["Subtitle URL"] = updateData.subtitleUrl
    }

    if (updateData.aiNotes) {
      updateFields["AI Notes"] = updateData.aiNotes
    }

    return {
      id: airtableId,
      fields: updateFields as AirtableRecord["fields"],
    }
  }

  // Batch create multiple records
  async createRecordsBatch(taskDataArray: TaskData[]): Promise<BatchCreateResult> {
    const result: BatchCreateResult = {
      success: true,
      createdRecords: [],
      failedRecords: [],
    }

    console.log(`[Airtable] Starting batch create for ${taskDataArray.length} records`)

    // Split into batches of 10 (Airtable limit)
    for (let i = 0; i < taskDataArray.length; i += this.BATCH_SIZE) {
      const batch = taskDataArray.slice(i, i + this.BATCH_SIZE)
      const records = batch.map((taskData) => this.createRecordFromTaskData(taskData))

      try {
        const response = await this.makeRequest<AirtableResponse>(
          this.baseUrl,
          {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({ records }),
          },
          `create batch ${Math.floor(i / this.BATCH_SIZE) + 1} (${batch.length} records)`
        )

        if (response && response.records) {
          // Map successful creations
          response.records.forEach((record, index) => {
            const taskData = batch[index]
            if (record.id && taskData) {
              result.createdRecords.push({
                taskId: taskData.id,
                airtableId: record.id,
              })
            }
          })
        } else {
          // Mark entire batch as failed if response is null
          batch.forEach((taskData) => {
            result.failedRecords.push({
              taskId: taskData.id,
              error: "Failed to create record in Airtable",
            })
          })
          result.success = false
        }
      } catch (error) {
        // Mark entire batch as failed
        batch.forEach((taskData) => {
          result.failedRecords.push({
            taskId: taskData.id,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        })
        result.success = false
      }
    }

    console.log(
      `[Airtable] Batch create completed. Created: ${result.createdRecords.length}, Failed: ${result.failedRecords.length}`
    )
    return result
  }

  // Batch update multiple records
  async updateRecordsBatch(updates: BatchUpdateItem[]): Promise<BatchUpdateResult> {
    const result: BatchUpdateResult = {
      success: true,
      updatedRecords: [],
      failedRecords: [],
    }

    console.log(`[Airtable] Starting batch update for ${updates.length} records`)

    // Split into batches of 10 (Airtable limit)
    for (let i = 0; i < updates.length; i += this.BATCH_SIZE) {
      const batch = updates.slice(i, i + this.BATCH_SIZE)
      const records = batch.map((update) => this.createUpdateRecord(update.airtableId, update.updateData))

      try {
        const response = await this.makeRequest<AirtableResponse>(
          this.baseUrl,
          {
            method: "PATCH",
            headers: this.headers,
            body: JSON.stringify({ records }),
          },
          `update batch ${Math.floor(i / this.BATCH_SIZE) + 1} (${batch.length} records)`
        )

        if (response && response.records) {
          // Map successful updates
          response.records.forEach((record, index) => {
            const updateItem = batch[index]
            if (record.id && updateItem) {
              result.updatedRecords.push({
                taskId: updateItem.taskId,
                airtableId: record.id,
              })
            }
          })
        } else {
          // Mark entire batch as failed if response is null
          batch.forEach((updateItem) => {
            result.failedRecords.push({
              taskId: updateItem.taskId,
              airtableId: updateItem.airtableId,
              error: "Failed to update record in Airtable",
            })
          })
          result.success = false
        }
      } catch (error) {
        // Mark entire batch as failed
        batch.forEach((updateItem) => {
          result.failedRecords.push({
            taskId: updateItem.taskId,
            airtableId: updateItem.airtableId,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        })
        result.success = false
      }
    }

    console.log(
      `[Airtable] Batch update completed. Updated: ${result.updatedRecords.length}, Failed: ${result.failedRecords.length}`
    )
    return result
  }

  // Single record operations (existing functions)
  async createRecord(taskData: TaskData): Promise<string | null> {
    const record = this.createRecordFromTaskData(taskData)

    const response = await this.makeRequest<AirtableResponse>(
      this.baseUrl,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ records: [record] }),
      },
      `create record for task ${taskData.id}`
    )

    if (response && response.records.length > 0) {
      const airtableId = response.records[0].id
      console.log(`[Airtable] Created record with ID: ${airtableId} for task: ${taskData.id}`)
      return airtableId ?? null
    }

    return null
  }

  async updateRecord(airtableId: string, taskId: string, updateData: UpdateData): Promise<boolean> {
    const record = this.createUpdateRecord(airtableId, updateData)

    const response = await this.makeRequest<AirtableResponse>(
      `${this.baseUrl}/${airtableId}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({
          fields: record.fields,
        }),
      },
      `update record ${airtableId} for task ${taskId}`
    )

    return response !== null
  }

  async findRecordByTaskId(taskId: string): Promise<string | null> {
    const filterFormula = `{Request Id} = '${taskId}'`
    const encodedFormula = encodeURIComponent(filterFormula)

    const response = await this.makeRequest<AirtableResponse>(
      `${this.baseUrl}?filterByFormula=${encodedFormula}`,
      {
        method: "GET",
        headers: this.headers,
      },
      `Find record for task ${taskId}`
    )

    if (response && response.records.length > 0) {
      return response.records[0].id || null
    }

    return null
  }

  // Batch find records by task IDs
  async findRecordsByTaskIds(taskIds: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {}

    // Initialize all task IDs as null
    taskIds.forEach((taskId) => {
      result[taskId] = null
    })

    if (taskIds.length === 0) {
      return result
    }

    // Create filter formula for multiple task IDs
    const taskIdConditions = taskIds.map((id) => `{Request Id} = '${id}'`).join(", ")
    const filterFormula = `OR(${taskIdConditions})`
    const encodedFormula = encodeURIComponent(filterFormula)

    const response = await this.makeRequest<AirtableResponse>(
      `${this.baseUrl}?filterByFormula=${encodedFormula}`,
      {
        method: "GET",
        headers: this.headers,
      },
      `Find records for ${taskIds.length} tasks`
    )

    if (response && response.records) {
      response.records.forEach((record) => {
        const taskId = record.fields["Request Id"]
        if (taskId && record.id) {
          result[taskId] = record.id
        }
      })
    }

    return result
  }
}

// Singleton instance
let airtableService: AirtableService | null = null

export function getAirtableService(): AirtableService | null {
  try {
    if (!airtableService) {
      airtableService = new AirtableService()
    }
    return airtableService
  } catch (error) {
    console.error("[Airtable] Service initialization failed:", error)
    return null
  }
}

export async function createAirtableRecord(taskData: TaskData): Promise<string | null> {
  const service = getAirtableService()
  if (!service) {
    console.log("[Airtable] Service not available, skipping record creation")
    return null
  }

  return await service.createRecord(taskData)
}

export async function createAirtableRecordsBatch(taskDataArray: TaskData[]): Promise<BatchCreateResult> {
  const service = getAirtableService()
  if (!service) {
    console.log("[Airtable] Service not available, skipping batch record creation")
    return {
      success: false,
      createdRecords: [],
      failedRecords: taskDataArray.map((task) => ({
        taskId: task.id,
        error: "Airtable service not available",
      })),
    }
  }

  return await service.createRecordsBatch(taskDataArray)
}

export async function updateAirtableRecord(
  airtableId: string,
  taskId: string,
  updateData: UpdateData
): Promise<boolean> {
  const service = getAirtableService()
  if (!service) {
    console.log("[Airtable] Service not available, skipping record update")
    return false
  }

  return await service.updateRecord(airtableId, taskId, updateData)
}

export async function updateAirtableRecordsBatch(updates: BatchUpdateItem[]): Promise<BatchUpdateResult> {
  const service = getAirtableService()
  if (!service) {
    console.log("[Airtable] Service not available, skipping batch record update")
    return {
      success: false,
      updatedRecords: [],
      failedRecords: updates.map((update) => ({
        taskId: update.taskId,
        airtableId: update.airtableId,
        error: "Airtable service not available",
      })),
    }
  }

  return await service.updateRecordsBatch(updates)
}

export async function findAirtableRecordByTaskId(taskId: string): Promise<string | null> {
  const service = getAirtableService()
  if (!service) {
    console.log("[Airtable] Service not available, skipping record lookup")
    return null
  }

  return await service.findRecordByTaskId(taskId)
}

export async function findAirtableRecordsByTaskIds(taskIds: string[]): Promise<Record<string, string | null>> {
  const service = getAirtableService()
  if (!service) {
    console.log("[Airtable] Service not available, skipping batch record lookup")
    return {}
  }

  return await service.findRecordsByTaskIds(taskIds)
}

// Export types for use in other files
export type { BatchCreateResult, BatchUpdateItem, BatchUpdateResult, TaskData, UpdateData }
