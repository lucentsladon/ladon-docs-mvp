import Link from "next/link"

import { Button } from "@/components/ui/button"
import { APP_ROUTES } from "@/config/routes"

export default function HomePage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <Button asChild>
        <Link href={APP_ROUTES.APP}>Open App</Link>
      </Button>
    </div>
  )
}
