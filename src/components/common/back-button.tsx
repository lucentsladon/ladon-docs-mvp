import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  href: string
  title?: string
  className?: string
  onClick?: () => void
}

export function BackButton({ href, onClick, title, className }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onClick) {
      onClick()
      return
    }

    try {
      router.back()
      // Add fallback in case user navigated directly to this page
      setTimeout(() => {
        router.push(href)
      }, 100)
    } catch {
      router.push(href)
    }
  }

  return (
    <div className={cn("mb-4 flex items-center gap-2.5", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="size-8 rounded-[6px]" variant="outline" onClick={handleBack}>
              <ArrowLeft />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {title && <h3 className="mt-0.5 font-medium">{title}</h3>}
    </div>
  )
}
