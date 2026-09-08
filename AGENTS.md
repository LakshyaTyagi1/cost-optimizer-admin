<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Cost Optimizer Admin: Repository Guide

## Scope and priorities

- These instructions apply to the entire repository. A more deeply nested `AGENTS.md`, if added later, takes precedence for its subtree.
- Follow the user's request first. Keep changes narrowly scoped and avoid adjacent refactors unless they are required for correctness.
- Preserve existing working-tree changes. Never discard, overwrite, or reformat unrelated user work.
- Before editing, inspect the relevant route, feature API/model/query modules, affected consumers, and current `git diff`. Review the final diff before handoff.
- Treat current source code as authoritative when the scaffold README or historical files under `docs/` disagree with the implementation.

## Application overview

- This is a browser-based administration console built with Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, TanStack Query, TanStack Virtual, Recharts, and Lucide icons.
- The browser calls an external admin backend directly. `NEXT_PUBLIC_API_URL` is required and must be an absolute HTTP(S) URL.
- `/login` is guest-only. All routes in `src/app/(dashboard)` are wrapped by the client-side `ProtectedRoute`.
- Live workflows include dashboard analytics, assessment review, Data Dictionary management, archive restore/permanent deletion, currency configuration, and profile display.

## Routes and current capability status

- `/`: live dashboard metrics, pipeline views, portfolio signals, and recent assessments.
- `/assessments`: read-only assessment search, filtering, sorting, pagination, CSV export, and detail navigation.
- `/assessments/[assessmentId]`: read-only Overview, Activity, Processes, Due Diligence, Results, Strategy/RFP, Expert, and Notes tabs.
- `/data-dictionary`: the primary write surface for industries, domains, mappings, process libraries, technology tools, defaults, ordering, status, and currency settings.
- `/archive`: restore archived processes or permanently delete one/all archived process records.
- `/experts`: currently displays hard-coded experts; Add Expert is not connected.
- `/profile`: read-only identity and access-role information.
- `/settings`: mostly informational/planned; only linked Data Dictionary settings are live.
- Team navigation currently points to `#team`; there is no Team route.
- Assessment PDF export currently uses browser print. Assessment email, delete/archive, expert assignment, booking, and persistent notes are not connected.
- Do not present display-only or planned controls as completed workflows, and do not wire them to speculative endpoints.

## Repository ownership

- `src/app/`: thin App Router pages, layouts, metadata, and route-level error boundaries.
- `src/features/<feature>/`: authoritative feature models, APIs, queries, utilities, and extracted feature UI for `auth`, `dashboard`, `assessments`, and `data-dictionary`.
- `src/components/`: page coordinators, the admin shell, authentication UI, feature UI that has not yet migrated, and small shared UI atoms.
- `src/lib/api/`: canonical URL construction, request headers, response-envelope handling, and list/data helpers.
- `src/lib/auth/storage.ts`: canonical browser-session storage helpers and admin-user shape.
- `src/providers/app-provider.tsx`: global provider composition. Preserve the order React Query -> route progress -> authentication.
- `src/api/*.api.ts` and `src/providers/{auth,query}-provider.tsx`: compatibility re-exports. Do not add logic there or remove them without migrating every consumer.
- Keep route `page.tsx` files thin. Put domain rules and API mappings in feature modules rather than JSX-heavy page coordinators.
- Several coordinators remain large. Avoid expanding them with reusable logic; extract focused feature utilities/components without opportunistic rewrites.

## Commands and verification

```bash
npm install
npm run dev
npm run lint
npm run format:check
npm run build
```

- Local development runs at `http://localhost:3000`.
- There is currently no `test` script or automated test suite. Do not claim that `npm test` exists or that tests passed.
- For source changes, run `npm run lint`. Run `npm run build` for routes, layouts, server/client boundaries, configuration, environment handling, or broad integrations.
- Run `npm run format:check` or targeted Prettier checks when formatting is affected. The repository has existing format-check debt, so distinguish pre-existing failures from files changed by the task.
- Do not run the repository-wide write formatter (`npm run format`) unless explicitly requested. Format only files in scope.
- Manually smoke-test affected routes. For broad work, cover login, dashboard, assessments list/detail, Data Dictionary, Archive, Experts, Profile, and Settings.

## Code conventions

- Follow `prettier.config.mjs`: 2-space indentation, double quotes, semicolons, trailing commas, 100-character print width, and Tailwind class sorting.
- Prefer the `@/` alias for imports under `src`.
- Preserve App Router server/client boundaries. Add `"use client"` only where browser APIs, state, effects, event handlers, or client hooks require it.
- Follow the repository's Next.js 16 async `params` and `searchParams` patterns and confirm framework behavior in the bundled Next.js documentation before changing framework-sensitive code.
- Use TanStack Query for backend-owned state and local component state for transient UI state. Do not introduce a global store for server data.
- Reuse existing feature models, adapters, query keys, formatters, and normalizers instead of duplicating them in components.
- Preserve responsive desktop/mobile behavior, keyboard access, labels, focus handling, loading/error/empty states, lazy-loaded dialogs, and Archive virtualization.
- Avoid creating generic `services`, `store`, `src/app/api`, or global styles folders without a demonstrated need.

## API and authentication safety

- Use feature API modules with `src/lib/api/client.ts`; do not call the backend with ad hoc URLs or duplicate envelope parsing.
- Preserve the response contract `{ data, message, pagination, status, success }` and surface backend messages through safe user-facing fallbacks.
- Authenticated calls use `credentials: "include"` and both `Authorization: Bearer ...` and legacy `accesstoken: Bearer ...` headers. Do not remove either header without a coordinated backend migration.
- Login at `/adm/user/login` is the intentional unauthenticated call. Session restoration uses `/adm/user/get-user-info/:id`.
- Canonical sessionStorage keys are `access_token`, `user_id`, and `admin_user`; request lookup also supports legacy token fallbacks. Do not rename or remove them without a migration.
- `ProtectedRoute` is a client-side navigation guard, not authorization. The backend must enforce administrator authentication and permissions for every protected operation.
- Never log passwords, tokens, request headers, environment values, raw user records, or assessment personal data. Keep errors free of secrets and PII because route boundaries log errors.
- Do not edit or disclose `.env*` values. Do not hard-code environment-specific backend origins or introduce a silent API fallback.

## React Query and mutation discipline

- Preserve the feature-owned query-key families for dashboard, assessments/detail, Data Dictionary catalog/options/processes, Archive, and technology stack.
- Keep AbortSignal support, enabled gates, `keepPreviousData`, pagination parameters, and current stale/garbage-collection behavior on Data Dictionary reads.
- Every mutation must update or invalidate all affected caches. In particular:
  - process/catalog changes may affect catalog, process, Archive, dashboard, and assessment views;
  - Archive restore/delete operations must refresh Archive and relevant catalog/process queries;
  - currency-rate changes must refresh options, dashboard, and assessment data;
  - technology changes must refresh the applicable technology-stack and catalog views.
- Prefer targeted cache updates followed by authoritative invalidation when the existing feature already follows that pattern.

## Domain and destructive-operation invariants

- Assessment records are currently administrative read-only views. Do not mutate saved customer assessment/process data without an explicit product requirement and an implemented backend contract.
- Dashboard and assessment-list projections share the admin dashboard endpoint. Keep their models and mappings compatible.
- Data Dictionary entities are backend-owned: industries, stable domains, industry-domain libraries, processes, common technology tools, options, and currency settings.
- Preserve stable IDs/slugs/domain keys, display order, active/inactive/archive/deleted distinctions, and the process scopes `industry-default` and `industry-domain`.
- API adapters intentionally tolerate backend `id`/`_id` and nested entity variants. Normalize through the existing adapters instead of leaking backend variants into UI code.
- Use the existing currency and process-metric helpers. The canonical base is AED, USD is a display/input currency, and the configured backend conversion rate takes precedence over fallback values. Never inline a new exchange rate or double-convert normalized amounts.
- Technology benchmark prices are USD and non-negative. Preserve source metadata and validation; do not replace backend data with hard-coded `initial*` fixtures or expert/reference display data.
- Permanent deletion is irreversible. Preserve confirmation dialogs, busy guards, exact target identity, and all backend preconditions:
  - deactivate a domain before permanent deletion;
  - archive/soft-delete a process before permanent deletion unless it is already archived;
  - require explicit confirmation for single and bulk destructive actions.
- Never trigger live mutations during inspection, tests, or manual checks unless the user explicitly authorizes them.
- Formula or currency changes must be coordinated with the customer application and backend, then verified across dashboard, assessment list/detail, CSV, and browser-print output.

## Change discipline

- Do not edit `.env*`, generated `.next/` or `out/` content, `next-env.d.ts`, `*.tsbuildinfo`, or `package-lock.json` unless the task specifically requires it.
- Do not silently substitute live API data with mocks, seed arrays, or hard-coded production values.
- Keep compatibility re-exports until all imports are deliberately migrated and verified.
- Confirm `git status --short` at handoff and report changed files, checks run, manual verification, and any pre-existing or environment-blocked checks.
