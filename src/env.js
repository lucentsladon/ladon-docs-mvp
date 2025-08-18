import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    // # Environment
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // # Database
    DATABASE_URL: z.string().url(),
    SHADOW_DATABASE_URL: z.string().url(),

    // # Storage
    S3_ACCESS_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    S3_REGION: z.string(),
    S3_BUCKET_NAME: z.string(),
    S3_ENDPOINT: z.string().min(1),
    S3_FORCE_PATH_STYLE: z.string().min(1),
    S3_PUBLIC_HOSTNAME: z.string().min(1),

    // # Authentication (Clerk)
    CLERK_SECRET_KEY: z.string(),
    CLERK_WEBHOOK_SECRET: z.string().min(1),

    // # Google AI
    GOOGLE_GENERATIVE_AI_API_KEY_1: z.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY_2: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY_3: z.string().optional(),

    // # Ingest Signing Key
    INNGEST_SIGNING_KEY: z.string(),

    // DeepL API Key
    DEEPL_API_KEY: z.string().min(1),
    DEEPL_API_URL: z.string().url().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // # Authentication (Clerk)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1),

    // # Use Limited Languages
    NEXT_PUBLIC_USE_LIMITED_LANGUAGES: z.string().min(1).default("true"),

    // Enable same language translation
    NEXT_PUBLIC_ENABLE_SAME_LANGUAGE_TRANSLATION: z.string().default("false"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    // # Environment
    NODE_ENV: process.env.NODE_ENV,

    // # Database
    DATABASE_URL: process.env.DATABASE_URL,
    SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL,

    // # Storage
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
    S3_PUBLIC_HOSTNAME: process.env.S3_PUBLIC_HOSTNAME,

    // # Authentication (Clerk)
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,

    // # Google AI
    GOOGLE_GENERATIVE_AI_API_KEY_1: process.env.GOOGLE_GENERATIVE_AI_API_KEY_1,
    GOOGLE_GENERATIVE_AI_API_KEY_2: process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    GOOGLE_GENERATIVE_AI_API_KEY_3: process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,

    // # Ingest Signing Key
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,

    // DeepL API Key
    DEEPL_API_KEY: process.env.DEEPL_API_KEY,
    DEEPL_API_URL: process.env.DEEPL_API_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
})
