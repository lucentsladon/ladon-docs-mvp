import { EventSchemas, Inngest } from "inngest"
import winston from "winston"

import type { Events } from "./types"

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info
    const { job, taskId, component } = meta as { job?: string; taskId?: string; component?: string }

    let log = `${timestamp} ${level}:`
    if (job) log += ` [${job}]`
    if (taskId) log += ` [${taskId}]`
    if (component) log += ` [${component}]`

    log += ` ${message}`
    return log
  })
)

const logger = winston.createLogger({
  level: "info",
  exitOnError: false,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({ filename: "inngest.log" }),
  ],
})

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "document-translator",
  schemas: new EventSchemas().fromRecord<Events>(),
  logger,
})
