import { authedProcedure } from "@/server/api/procedures"
import { createTRPCRouter } from "@/server/api/trpc"

export const userRouter = createTRPCRouter({
  auth: authedProcedure.query(async ({ ctx }) => {
    return ctx.auth
  }),
})
