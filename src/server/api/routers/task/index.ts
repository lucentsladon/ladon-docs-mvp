// src/server/api/routers/task/index.ts
import { env } from "@/env"
import { inngest } from "@/inngest/client"
import { z, ZodError } from "zod"

import { authedProcedure } from "@/server/api/procedures"
import { createTRPCRouter } from "@/server/api/trpc"

import { ZGetTasksInputSchema, ZTriggerTranslationInputSchema } from "./index.schema"

export const taskRouter = createTRPCRouter({
  // Get all tasks for the current user
  list: authedProcedure.input(ZGetTasksInputSchema).query(async ({ ctx, input }) => {
    const { limit, page, status } = input
    const where = {
      user_id: ctx.auth.userId,
      ...(status ? { status } : {}),
    }

    const [items, total] = await Promise.all([
      ctx.db.task.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where,
        orderBy: {
          created_at: "desc",
        },
      }),
      ctx.db.task.count({ where }),
    ])

    return {
      items,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    }
  }),

  // Get a single task by ID
  byId: authedProcedure.input(z.string()).query(async ({ ctx, input: id }) => {
    const task = await ctx.db.task.findUnique({
      where: { id, user_id: ctx.auth.userId },
      include: {
        user: {
          select: {
            username: true,
            image_url: true,
          },
        },
      },
    })

    if (!task) {
      throw new Error("Task not found")
    }

    return task
  }),

  // Get task status and progress by event ID
  runStatus: authedProcedure.input(z.string()).query(async ({ input: eventId }) => {
    if (!env.INNGEST_SIGNING_KEY) {
      throw new Error("Inngest signing key is not configured.")
    }
    const url = `https://api.inngest.com/v1/runs?event_id=${eventId}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.INNGEST_SIGNING_KEY}`,
        "Content-Type": "application/json",
      },
    })
    if (response.status === 404) {
      // It's possible the run hasn't been created yet, so we treat "Not Found" as a pending state.
      return null
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch run status from Inngest API: ${response.statusText}`)
    }
    const data = await response.json()
    // The API returns runs sorted by creation date, descending. We want the latest run.
    return data.data?.[0] ?? null
  }),

  // Delete a task
  delete: authedProcedure.input(z.string()).mutation(async ({ ctx, input: id }) => {
    const task = await ctx.db.task.findUnique({
      where: { id, user_id: ctx.auth.userId },
    })

    if (!task) {
      throw new Error("Task not found")
    }

    return ctx.db.task.delete({
      where: { id },
    })
  }),

  // Trigger a translation task
  triggerTranslation: authedProcedure.input(ZTriggerTranslationInputSchema).mutation(async ({ ctx, input }) => {
    try {
      const { original_file_url, original_file_key, file_name, inputLanguage, outputLanguage, prompt, formality } =
        input

      // 1. Create a new task in the database
      const task = await ctx.db.task.create({
        data: {
          user_id: ctx.auth.userId,
          source_language: inputLanguage,
          target_language: outputLanguage,
          prompt,
          original_file_url,
          original_file_key,
          file_name,
          formality,
        },
      })

      // 2. Trigger the background translation task
      const { ids } = await inngest.send({
        name: "document/translate",
        data: {
          taskId: task.id,
        },
      })

      const eventId = ids[0]

      // 3. Update the task with the event id
      if (eventId) {
        await ctx.db.task.update({
          where: { id: task.id },
          data: { trigger_id: eventId },
        })
      }

      // 4. Return the result
      return {
        message: "Translation task successfully queued",
        eventId: eventId,
        taskId: task.id,
      }
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.issues.map((e) => e.message).join(", ")}`)
      }
      throw new Error(error instanceof Error ? error.message : "Failed to trigger translation task.")
    }
  }),
})
