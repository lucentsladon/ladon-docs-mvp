import { env } from "@/env"

export const APP_ROUTES = {
  HOME: "/",
  APP: "/app",
  UPLOAD: "/app/upload",

  SIGN_UP: env.NEXT_PUBLIC_CLERK_SIGN_UP_URL!,
  SIGN_IN: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL!,
}
