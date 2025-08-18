import { TRPCError } from "@trpc/server"

import { middleware, type TRPCContext } from "./trpc"

const getAuth = async (ctx: TRPCContext) => {
  const userId = ctx.auth.userId
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return { ...ctx.auth, userId: ctx.auth.userId }
}

export type AuthObject = Awaited<ReturnType<typeof getAuth>>

// check if the user is signed in, otherwise throw an UNAUTHORIZED code
export const enforceUserIsAuthed = middleware(async ({ next, ctx }) => {
  const auth = await getAuth(ctx)
  return next({
    ctx: {
      ...ctx,
      auth,
    },
  })
})
