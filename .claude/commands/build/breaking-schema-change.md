# Breaking Schema Change Migration

Use when changing a field shape in a Convex table that affects the full stack.

## Steps

1. Update `convex/schema.ts` — new field shape
2. Update `convex/programs.ts` — mutation args and insert/patch
3. Update TypeScript interface in the composable
4. Update composable function signature
5. Update the view — template and handler functions
6. Delete test data before running (no migration needed if no production data)

## Lessons learned

- Embed instance-specific data, don't normalize prematurely
- Flatten + deduplicate before sending arrays to AI payload
- Rest days must be explicit entries with exercises: []
- Small models (Gemma 3:4b) ignore strict JSON rules — use Qwen2.5:7b minimum
