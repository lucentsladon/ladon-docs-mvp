import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { type LanguageModel } from "ai"
import { createFallback } from "ai-fallback"

// Collect all Google AI API keys from environment variables.
const apiKeys = Object.keys(process.env)
  .filter((key) => key.startsWith("GOOGLE_GENERATIVE_AI_API_KEY_"))
  .sort() // Ensure consistent order.
  .map((key) => process.env[key]!)
  .filter(Boolean) // Filter out any undefined/empty keys.

if (apiKeys.length === 0) {
  throw new Error("No GOOGLE_GENERATIVE_AI_API_KEY_n environment variables found.")
}

// Create a list of Google AI models, each with a different API key.
const googleModels: LanguageModel[] = apiKeys.map((apiKey, index) => {
  const googleAI = createGoogleGenerativeAI({
    apiKey,
    headers: { "X-Model-Index": `${index}` },
  })

  return googleAI("gemini-2.0-flash")
})

// Create a fallback model that cycles through the available API keys.
const model = createFallback({
  models: googleModels,
  onError: (error: Error, modelId: string) => {
    // The modelId can be complex, so let's not log it unless we can make it meaningful
    console.error(`Error with a Google AI model (${modelId}):`, error)
  },
  modelResetInterval: 60000, // Reset to the first model after 1 minute of inactivity.
  retryAfterOutput: true, // Retry with the next model if an error occurs mid-stream.
})

export default model
