"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { LogOut, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { APP_ROUTES } from "@/config/routes"

export function NavUser() {
  const { signOut } = useAuth()
  const { user, openSignIn } = useClerk()
  const fullName = `${user?.firstName} ${user?.lastName}`
  const userEmail = user?.emailAddresses?.[0]?.emailAddress
  const avatarFallback = `${user?.firstName?.charAt(0)} ${user?.lastName?.charAt(0)}`

  if (!user) {
    return (
      <Button
        variant="ghost"
        onClick={() =>
          openSignIn({
            fallbackRedirectUrl: APP_ROUTES.APP,
          })
        }
        className="flex size-8 items-center justify-center rounded-full bg-gray-100 sm:size-10 [&_svg]:size-4"
      >
        <User className="text-foreground/50" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.imageUrl} alt={fullName} />
          <AvatarFallback>{fullName?.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuItem className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-10">
              <AvatarImage src={user?.imageUrl} alt={fullName} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{fullName}</span>
              <span className="truncate text-xs">{userEmail}</span>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
