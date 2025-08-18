import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface TestimonialAuthor {
  name: string
  handle: string
  avatar: string // URL to the avatar image
}

interface TestimonialCardProps {
  author: TestimonialAuthor
  text: string
  href?: string
  className?: string
}

export function TestimonialCard({ author, text, href, className }: TestimonialCardProps) {
  const AuthorInfo = (
    <div className="group flex w-full items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={author.avatar} alt={author.name} />
        <AvatarFallback>{author.name.substring(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-gray-900 group-hover:underline group-hover:underline-offset-2">
          {author.name}
        </p>
        <p className="text-xs text-gray-500">{author.handle}</p>
      </div>
    </div>
  )

  return (
    <Card
      className={cn(
        "flex h-full w-[320px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl shadow-md",
        className
      )}
    >
      <CardContent>
        <p className="text-base text-gray-700 italic before:content-['\201C'] after:content-['\201D']">{text}</p>
      </CardContent>
      <CardFooter className="px-6 pt-4">
        {href ? (
          <Link href={href} target="_blank" rel="noopener noreferrer" className="w-full">
            {AuthorInfo}
          </Link>
        ) : (
          AuthorInfo
        )}
      </CardFooter>
    </Card>
  )
}
