import type { Metadata } from "next"
import { Geist, Geist_Mono, Lora } from "next/font/google"
import { GlobalProvider } from "@/context/providers"

import { ReactScan } from "@/components/dev/react-scan"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "DocumentTranslator",
  description:
    "DocumentTranslator is a document translation platform that uses AI to translate documents into multiple languages.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ReactScan />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} relative min-h-screen font-sans antialiased`}
      >
        <GlobalProvider>{children}</GlobalProvider>
      </body>
    </html>
  )
}
