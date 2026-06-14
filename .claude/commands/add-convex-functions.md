Add Convex query/mutation functions for an existing table.

## Steps

1. Read `convex/_generated/ai/guidelines.md` — required before any Convex work.
2. Read `convex/schema.ts` to confirm the target table's fields and indexes.
3. Read an existing functions file (e.g. `convex/clients.ts`) to follow auth and error patterns.
4. Ask the user (if not already specified):
   - Which table to add functions for
   - Which functions are needed (list, get by id, create, update, delete)
   - Which roles are allowed to call each function
5. Create or edit the functions file at `convex/<tableName>.ts`:
   - Always call `ctx.auth.getUserIdentity()` first and throw if null
   - Look up the caller via `withIndex("by_token", ...)` — never accept userId as an argument
   - Use `internalQuery` / `internalMutation` for functions not called from the client
   - Always include argument validators (`v.*`) for every argument
   - Use `withIndex` for all queries — never use `.filter()`
   - Use `.take(N)` not `.collect()` for bounded reads
6. Update `CLAUDE.md` if the new functions introduce a new access pattern worth documenting.
