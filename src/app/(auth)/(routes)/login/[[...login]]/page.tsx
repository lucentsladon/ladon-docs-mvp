"use client"

import { SignIn } from "@clerk/nextjs"

import { APP_ROUTES } from "@/config/routes"

export default function LoginPage() {
  return <SignIn fallbackRedirectUrl={APP_ROUTES.APP} />
}
