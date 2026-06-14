Add a new table to the Convex schema.

## Steps

1. Read `convex/_generated/ai/guidelines.md` — required before any Convex work.
2. Read `convex/schema.ts` to understand existing tables and naming conventions.
3. Ask the user (if not already specified):
   - Table name (snake_case)
   - Fields and their types
   - Which fields need indexes (single and composite)
   - Any foreign keys to existing tables
4. Add the table definition to `convex/schema.ts` following these rules:
   - Use `v.optional()` for nullable fields
   - Always add `createdAt: v.number()` for new entity tables
   - Index names must include all indexed fields: `by_field1_and_field2`
   - Never store unbounded arrays inside a document — create a child table instead
   - For file references use `v.id("_storage")`
   - Price fields: suffix with `Jod` (e.g. `priceJod`) — this platform uses JOD
5. Update the "Database Schema" section in `CLAUDE.md` to document the new table in one line.
6. Tell the user to run `npx convex dev` to push the schema change.
