import { NextResponse, type NextRequest } from "next/server"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

import { APP_ROUTES } from "@/config/routes"

const isPrivateRoute = createRouteMatcher([APP_ROUTES.UPLOAD, APP_ROUTES.YOUTUBE, APP_ROUTES.APP])
const isApiRoute = createRouteMatcher(["/api(.*)"])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, redirectToSignIn } = await auth()

  // For API routes, allow the request to proceed
  if (isApiRoute(req)) {
    return NextResponse.next()
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && isPrivateRoute(req)) return redirectToSignIn({ returnBackUrl: req.url })

  // If the user is logged in and the route is protected, let them view.
  if (userId && !isPrivateRoute(req)) return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
