"use client"

import { SignUp } from "@clerk/nextjs"

import { APP_ROUTES } from "@/config/routes"

export default function SignupPage() {
  return <SignUp fallbackRedirectUrl={APP_ROUTES.APP} />
}
