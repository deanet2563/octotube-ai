# CLAUDE.md — OctoTube AI 🐙

## Project
OctoTube AI transforms YouTube videos into visual knowledge: summaries, key
takeaways, and a knowledge library (later phases add AI review, action plans, and
React Flow diagrams).

**Core differentiator — generate once, store forever, reuse for everyone.**
AI output is cached per video and shared across all users, so the Nth person to
analyze a given video costs nothing extra. Cache hit rate is the single biggest
lever on cost. The schema and Edge Function exist to enforce this.

## Tech stack
- Frontend: React 18, Vite 5, TypeScript 5, React Router 6, Tailwind CSS 3
- State: Zustand 4
- Backend: Supabase (Postgres + Auth + Edge Functions)
- AI: Gemini API — **Gemini-only for Phase 1**
- Diagrams (later phase): React Flow 11
- Hosting: Cloudflare Pages
- Repo: GitHub — deanet2563/octotube-ai

## Architecture rules (do not violate)
- **All Gemini calls go through a Supabase Edge Function — never from the browser.**
  This protects the API key and enables server-side caching.
- The Edge Function uses the Supabase **service-role key** (bypasses RLS) to write
  the cache. The browser uses the **anon key** and can only read.
- Secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) live only in Supabase
  Edge Function secrets — never in client code. The client may use only
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `src/types/database.ts` is generated via `supabase gen types typescript` —
  never hand-edit it.
- Keep `services/` (pure business logic, no React) separate from `hooks/`
  (thin React wrappers around services).

## Folder structure
```
src/
  components/   reusable UI
  pages/        route-level screens
  hooks/        React wrappers around services
  services/     pure business logic (no React)
  store/        Zustand stores
  lib/          supabase client, gemini helpers
  types/        database.ts (generated) + app types
  utils/        helpers
supabase/
  functions/    Edge Functions (e.g. analyze/)
  migrations/   SQL migrations
```

## Database schema (Phase 1)
Four tables, two zones.

**Shared cache — read-all, written only by the Edge Function:**
- `videos` — one row per YouTube video, keyed by unique `youtube_id`. Metadata only.
- `analyses` — one row per video (1:1): `summary` (text), `takeaways` (jsonb array),
  `status` (pending/processing/complete/failed), `model_used`, timestamps.

**Per-user — RLS: own rows only:**
- `profiles` — 1:1 with `auth.users`, auto-created on signup via trigger.
- `library_items` — user ↔ video join = the Knowledge Library. Unique(user_id, video_id).

RLS: `videos` and `analyses` are SELECT-only for authenticated users with **no client
write policies** (only the service-role Edge Function can write). `profiles` and
`library_items` are scoped to `auth.uid()`.

## Phase 1 scope (MVP)
Build only: **Summary, Key Takeaways, Knowledge Library.** Gemini-only.
Out of scope until later phases: AI Review, Action Plan, React Flow diagrams,
browser extension, native app, multi-model routing.

## Milestones — work in order, one at a time
1. [x] Architecture & folder structure
2. [x] Database schema & Supabase setup
3. [ ] Edge Function — analyze flow: check cache → on miss, fetch transcript +
       call Gemini → write `videos` + `analyses` → return result
4. [ ] Auth flow (Supabase Auth: Email + Google OAuth)
5. [ ] Analyze page: paste URL → render summary + takeaways → "Save to Library"
6. [ ] Knowledge Library page
7. [ ] Deploy to Cloudflare Pages + polish

## Working agreement
- Optimize for MVP speed; the developer works ~4 hrs/day. Avoid over-engineering,
  but keep the architecture production-ready.
- **Work milestone by milestone and stop for approval before starting the next one.**
  Do not jump ahead to future milestones or out-of-scope features.
- Prefer small, focused changes with complete files over sprawling rewrites.
- Ask before adding new dependencies or introducing new architectural patterns.
- Never commit secrets. Ensure `.gitignore` covers `.env*`, `node_modules`, and
  build output.
