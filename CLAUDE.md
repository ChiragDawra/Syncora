# CLAUDE.md

Project memory for Claude Code in the Syncora repo. Put this file at the repo root next to `AGENTS.md`.

@AGENTS.md

## How to work in this repo

1. **Read first.** Before writing code for a feature, read its section in `docs/PRD.md`, then `docs/API_SPEC.md` and `docs/DATABASE.md` for the contract and schema. For UI work also read `docs/FRONTEND.md`.
2. **Plan, then build.** For anything touching more than two files, write a short plan (files to change, endpoints, tests) and wait for approval before editing.
3. **Follow the build order** in `docs/BUILD_PLAN.md`. Don't start a later phase while an earlier phase's "done when" check fails.
4. **One feature per change.** Model → validator → service → controller → route → test → Postman → docs.
5. **Verify before reporting done:**
   - `cd server && npm run lint && npm test`
   - `cd client && npm run lint && npm run build`
   - For a new endpoint, also show one example request and response.
6. **Keep docs true.** If you change an endpoint, schema, env var, permission or folder, update the matching doc in the same change, and the row in `docs/SYLLABUS_COVERAGE.md` if a syllabus topic moves.

## Context worth knowing

- This is a university course project (Back End Engineering-II, 24CSE0315). The evaluation has a live demo and a viva where students explain the code, so prefer clear, conventional code over clever abstractions. Add a one-line comment where a syllabus concept is used (for example `// compound index: equality (board, status) then sort (position)`).
- CE-2 covers MongoDB and Mongoose, React, and full-stack integration. Unit 8 (logging, Redis, Docker, CI/CD, deployment) is for the end-term exam; build it after the CE-2 scope works.
- Windows laptops may be used for the demo: keep scripts cross-platform (no bash-only npm scripts), and use `bcryptjs`, not native `bcrypt`.

## Ask before

- Adding or upgrading a dependency.
- Changing the response envelope, error codes, permission matrix or a schema field name.
- Deleting files or folders, or rewriting git history.
- Touching `.env` files (never print their contents).

## Handy prompts for this repo

- "Implement Phase 1 (auth) from docs/BUILD_PLAN.md, with tests."
- "Add the board stats endpoint from docs/API_SPEC.md §5.3 using the aggregation in docs/DATABASE.md §5.1."
- "Build BoardPage per docs/FRONTEND.md §8 with loading, empty and error states."
- "Write the Postman tests for the 401, 403, 400 and 413 cases in docs/TESTING.md §3."
- "Explain the request flow for PATCH /api/tasks/:taskId/move as I'd say it in a viva."
