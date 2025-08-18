"use client"

import { Suspense, type ReactNode } from "react"
import { env } from "@/env"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Toaster } from "sonner"

import { TRPCReactProvider } from "@/trpc/react"

type GlobalProviderProps = {
  children: ReactNode
}

export function GlobalProvider({ children }: GlobalProviderProps) {
  return (
    <Suspense fallback={<div />}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
        enableColorScheme
      >
        <ClerkProvider
          localization={{}}
          signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
          signUpUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ClerkProvider>
        <Toaster closeButton position="top-center" />
      </NextThemesProvider>
    </Suspense>
  )
}
