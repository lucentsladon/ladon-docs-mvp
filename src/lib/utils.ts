import { NextResponse } from "next/server"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a standardized error response.
 */
export function createErrorResponse(message: string, status: number, details?: string | object): NextResponse {
  console.error(message, details ? { details } : "")
  return NextResponse.json({ error: message, ...(details && { details }) }, { status })
}

export function formatBytes(bytes: number, decimals = 2, sizeType: "accurate" | "normal" = "normal") {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes =
    sizeType === "accurate"
      ? ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
      : ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
