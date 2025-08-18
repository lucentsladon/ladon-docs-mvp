import Link from "next/link"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  isDark?: boolean
  href?: string
}

// export default function Logo({ width = 100, height = 34, className }: LogoProps) {
//   return (
//     <Link href="/" aria-label="DocumentTranslator Logo" className={cn("flex items-center", className)}>
//       <Image src="/logo.png" alt="DocumentTranslator Logo" width={width} height={height} className="invert filter" priority />
//     </Link>
//   )
// }

export default function Logo({ className, isDark = false, href = "/" }: LogoProps) {
  return (
    <Link href={href} aria-label="DocumentTranslator Logo" className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(`font-lora text-xl font-bold tracking-tight italic`, isDark ? "text-white" : "text-gray-800")}
      >
        DocumentTranslator
      </span>
    </Link>
  )
}
