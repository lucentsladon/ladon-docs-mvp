"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { UserButton, useUser } from "@clerk/nextjs"

import Logo from "@/components/logo/logo"
import { Button } from "@/components/ui/button"
import { APP_ROUTES } from "@/config/routes"

export default function AppNavigation() {
  const { isLoaded, isSignedIn } = useUser()

  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)
  const headerHeight = 96

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY.current && currentScrollY > headerHeight) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <header
        className={`navbar fixed top-0 left-0 z-50 w-full transition-transform duration-300 ease-in-out ${isVisible ? "translate-y-0" : "-translate-y-full"} bg-transparent`}
      >
        <div className="container mx-auto flex h-24 items-center justify-between px-4 text-sm font-medium text-gray-800 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="relative z-[60] flex-shrink-0">
            <Logo href={APP_ROUTES.APP} />
          </div>

          {/* Desktop CTAs - Moved to the right (implicitly by justify-between on parent) */}
          <div className="pointer-events-auto relative z-[60] hidden flex-shrink-0 items-center xl:flex">
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "size-12",
                      },
                    }}
                  />
                ) : (
                  <div className="flex flex-none items-center rounded-full border border-white/10 bg-white/80 bg-gradient-to-r from-pink-100/20 via-violet-100/20 to-indigo-100/20 px-3 text-sm font-medium text-gray-800 shadow-lg ring-1 shadow-gray-800/5 ring-gray-800/[.075] backdrop-blur-xl">
                    <Link
                      href={APP_ROUTES.SIGN_IN}
                      className="group relative my-1 -ml-2 inline-flex h-8 flex-none items-center rounded-l-[20px] rounded-r-[8px] border border-white/50 bg-white/40 bg-clip-padding pr-[10px] pl-3 text-base shadow transition-colors duration-300 hover:bg-violet-50/40 hover:text-violet-600 sm:text-sm"
                    >
                      Log In
                      <span className="absolute right-1 -bottom-[1px] left-4 h-px scale-x-0 bg-gradient-to-r from-violet-500/0 via-violet-400 to-violet-500/0 opacity-0 transition duration-300 group-hover:scale-x-100 group-hover:opacity-100"></span>
                      <span className="absolute inset-0 origin-bottom scale-0 overflow-hidden opacity-0 transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                        <span className="absolute inset-x-4 -bottom-2 h-full rounded-t-full bg-gradient-to-t from-violet-500/20 to-transparent blur"></span>
                      </span>
                    </Link>
                    <Button
                      variant="default"
                      size="sm"
                      className="group btn-xs bg-primary hover:bg-primary/90 text-primary-foreground relative my-1 -mr-2 ml-[5px] h-8 rounded-l-[8px] rounded-r-[20px] border-none px-3 text-base transition-colors duration-300 sm:text-sm"
                      asChild
                    >
                      <Link href={APP_ROUTES.APP}>Get Started</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Drawer - Placed after desktop elements but before closing container div */}
          <div className="relative z-[60] ml-auto flex items-center xl:hidden">
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "size-12",
                      },
                    }}
                  />
                ) : (
                  <div className="flex flex-none items-center rounded-full border border-white/10 bg-white/80 bg-gradient-to-r from-pink-100/20 via-violet-100/20 to-indigo-100/20 px-2 text-xs shadow-lg ring-1 shadow-gray-800/5 ring-gray-800/[.075] backdrop-blur-xl">
                    <Link
                      href={APP_ROUTES.SIGN_IN}
                      className="group relative my-1 -ml-1 inline-flex h-7 flex-none items-center rounded-l-[20px] rounded-r-[8px] border border-white/50 bg-white/40 bg-clip-padding px-2 py-1 text-xs shadow transition-colors duration-300 hover:bg-violet-50/40 hover:text-violet-600"
                    >
                      Log In
                    </Link>
                    <Button
                      variant="default"
                      size="sm"
                      className="group btn-xs bg-primary hover:bg-primary/90 text-primary-foreground relative my-1 -mr-1 ml-1 h-7 rounded-l-[8px] rounded-r-[20px] border-none px-2 text-xs transition-colors duration-300"
                      asChild
                    >
                      <Link href={APP_ROUTES.APP}>Get Started</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
