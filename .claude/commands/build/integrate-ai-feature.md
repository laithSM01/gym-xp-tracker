# integrate-ai-feature.md

## Purpose

Integrate an existing AI composable into a view using real Convex data.

## What to provide

- Composable name and location
- FastAPI endpoint and payload shape
- Target view to integrate into

## Steps

1. Read the target composable to understand what data it already exposes
2. Read the Convex schema to find where missing payload fields live
3. Map real Convex data to the AI payload shape
4. Add to the view:
   - A trigger button
   - Loading state
   - Result display
   - Error handling
5. Follow existing patterns in the codebase for styling and structure
   - Result display
   - Error handling

6. Follow existing patterns in the codebase for styling and structure
