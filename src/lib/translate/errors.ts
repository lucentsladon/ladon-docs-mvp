import { NextResponse } from 'next/server';

/**
 * Creates a standardized error response.
 */
export function createErrorResponse(message: string, status: number, details?: string | object): NextResponse {
  console.error(message, details ? { details } : '');
  return NextResponse.json({ error: message, ...(details && { details }) }, { status });
} 