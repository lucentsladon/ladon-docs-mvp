import { memo } from "react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ActionCardProps {
  href: string
  title: string
  description: string
  details?: string
  icon: React.ReactNode
  iconBgColor?: string
  iconBorderColor?: string
}

export const ActionCard = memo(function ActionCard({
  href,
  title,
  description,
  details,
  icon,
  iconBgColor = "bg-primary",
  iconBorderColor = "border-transparent",
}: ActionCardProps) {
  return (
    <Link href={href} className="group block w-full">
      <Card className="hover:border-primary/80 h-full rounded-3xl transition-all duration-300 ease-in-out hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg text-slate-800 sm:text-xl">
            <div
              className={`text-primary-foreground rounded-sm border p-2 transition-colors ${iconBgColor} ${iconBorderColor}`}
            >
              {icon}
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base">{description}</CardDescription>
          {details && <p className="text-muted-foreground mt-2 text-sm">{details}</p>}
        </CardContent>
      </Card>
    </Link>
  )
})

ActionCard.displayName = "ActionCard"
