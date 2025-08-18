import { enforceUserIsAuthed } from "./middlewares"
import { procedure } from "./trpc"

export const publicProcedure = procedure
export const authedProcedure = procedure.use(enforceUserIsAuthed)
