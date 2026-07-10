# Cost Optimizer Admin Scalable Structure Task Plan

## Purpose

This document defines the safe, phased refactor plan for the `cost-optimizer-admin` Next.js App Router application.

The target is a maintainable feature-first structure that improves scalability without changing current behavior, routes, API contracts, authentication flow, UI layout, or user-facing functionality.

## Verification Result

Status: Verified against the current `G:\cost-optimizer-admin` codebase on July 9, 2026.

Result: The plan is correct for the current application, with two important clarifications:

- The target feature structure must include the existing `experts` route.
- The migration should include explicit performance work for repeated dashboard queries and large data dictionary screens.

Validation commands:

```bash
npm.cmd run lint
npm.cmd run build
```

Current validation result:

- Lint passed.
- Production build passed.
- Next.js build detected these App Router routes:
  - `/`
  - `/login`
  - `/assessments`
  - `/assessments/[assessmentId]`
  - `/data-dictionary`
  - `/archive`
  - `/experts`

## Recommended Structure

Use a simplified feature-first structure for the current application:

```txt
src/
  app/
    (auth)/
    (dashboard)/
    layout.tsx
    globals.css

  features/
    auth/
    dashboard/
    assessments/
    data-dictionary/
    archive/
    experts/

  components/
    layout/
      admin-shell/
      route-progress/
      sidebar/
      navbar/
    ui/
      button/
      input/
      modal/
      table/
      badge/
      spinner/
    shared/

  lib/
    api/
      client.ts
      api-url.ts
      request-headers.ts
    auth/
    env.ts
    format.ts

  providers/
    app-provider.tsx
    auth-provider.tsx
    query-provider.tsx
```

Avoid creating empty enterprise folders such as `schemas`, `actions`, `services`, `store`, `app/api`, or `instrumentation.ts` until the application has a real need for them.

## Current Codebase Findings

- The app already uses Next.js App Router.
- Most feature logic currently lives under `src/components/*`.
- API clients currently live under `src/api`.
- Large page components need to be split gradually.
- Server state should stay in API/query layers instead of being moved into a global store.
- Global stores should only be added for true client-only UI state.
- The admin shell/sidebar has already been moved toward semantic layout and accessible navigation.
- `src/lib/auth/storage.ts` already exists and should be reused instead of duplicating token lookup logic.

Largest cleanup targets:

- `src/components/data-dictionary/data-dictionary-page.tsx`
- `src/components/assessments/assessments-page.tsx`
- `src/components/admin-dashboard/admin-dashboard.tsx`
- `src/api/data-dictionary.api.ts`

Current route ownership:

- `/` currently renders `src/components/admin-dashboard/admin-dashboard.tsx`.
- `/login` currently renders `src/components/auth/login-page.tsx` inside `GuestRoute`.
- `/assessments` currently renders `src/components/assessments/assessments-page.tsx`.
- `/assessments/[assessmentId]` currently renders `AssessmentDetailPage` from the same assessment page module.
- `/data-dictionary` currently renders `src/components/data-dictionary/data-dictionary-page.tsx`.
- `/archive` currently renders `src/components/archive/archive-page.tsx`.
- `/experts` currently renders `src/components/experts/experts-page.tsx`.

## Performance And Optimization Findings

- Dashboard sections call `useQuery` multiple times with the same `["admin-dashboard"]` key and `fetchDashboardData` function. React Query deduplicates the network request, but the component still has repeated query subscription and data-selection code. A feature-level dashboard query hook or one top-level query passed to child sections will be cleaner.
- `src/api/dashboard.api.ts`, `src/api/assessments.api.ts`, and `src/api/data-dictionary.api.ts` duplicate auth header creation, token lookup, response parsing, and error handling.
- `src/api/data-dictionary.api.ts` fetches all process pages for some views. This is acceptable for the current data size, but server-side pagination/filtering should be planned before the library grows significantly.
- The data dictionary page already uses dynamic imports for heavy modals. Preserve this pattern while splitting the page.
- The archive page already uses virtualization. Preserve this pattern for large lists.
- Avoid adding a global client store for server data. React Query is already installed and configured for this purpose.
- Keep route-level code splitting through App Router pages. Do not centralize all feature components into one shared layout bundle.

## Migration Rules

- Do not change existing routes.
- Do not change API request or response contracts.
- Do not change authentication behavior.
- Do not change visual UI unless required by the refactor.
- Keep existing exports working during migration.
- Move code in small phases.
- Run lint and build after each phase.
- Do not introduce duplicate responsibility between `features/*/api` and global `services`.
- Keep `credentials: "include"` and current auth headers unless the backend contract is intentionally changed.
- Preserve React Query cache keys or add compatibility invalidation when query keys are moved.

## Phase 0: Baseline And Safety

Status: Verified

Goal: Confirm the current app state before changing structure.

Tasks:

- Check current git status.
- Identify user-made or unrelated changes and avoid reverting them.
- Run baseline validation.
- Document current important routes and feature areas.

Commands:

```bash
git status --short
npm.cmd run lint
npm.cmd run build
```

Acceptance Criteria:

- Existing dirty files are known.
- Lint result is recorded.
- Build result is recorded.
- No app code is changed in this phase.

Current Result:

- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- No admin app files were changed during this verification.

## Phase 1: Shared API Foundation

Status: Implemented on July 9, 2026

Goal: Centralize repeated API behavior without changing API method names used by components.

Target files:

```txt
src/lib/api/client.ts
src/lib/api/api-url.ts
src/lib/api/request-headers.ts
```

Tasks:

- Create a shared API client wrapper.
- Centralize base URL resolution.
- Centralize JSON parsing and error handling.
- Preserve existing auth header behavior.
- Centralize admin auth headers, including both `Authorization` and `accesstoken`.
- Reuse `src/lib/auth/storage.ts` for session token access.
- Keep old `src/api/*.api.ts` exports working.
- Update one low-risk API file first before migrating all API clients.

Recommended first candidates:

- `src/api/dashboard.api.ts`
- Then `src/api/assessments.api.ts`
- Then `src/api/data-dictionary.api.ts`

Acceptance Criteria:

- Existing imports still compile.
- Network request URLs remain unchanged.
- Error behavior remains compatible with current UI.
- Lint and build pass.

Verification:

```bash
npm.cmd run lint
npm.cmd run build
```

Current Result:

- Added `src/lib/api/api-url.ts`.
- Added `src/lib/api/request-headers.ts`.
- Added `src/lib/api/client.ts`.
- Kept `src/api/api-url.ts` as a compatibility re-export.
- Updated current admin API clients to use the shared API client behavior.
- Preserved existing request URLs, auth headers, `credentials: "include"`, and exported API function names.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.

## Phase 1B: Query Hooks And Dashboard Performance

Status: Implemented on July 9, 2026

Goal: Reduce repeated dashboard query wiring and create a clean query pattern for future features.

Target structure:

```txt
src/features/dashboard/queries.ts
src/features/assessments/queries.ts
src/features/data-dictionary/queries.ts
```

Tasks:

- Create feature-owned query hooks only where they reduce repeated code.
- Start with `useDashboardData`.
- Use one dashboard query source and pass selected data into child cards.
- Keep the existing `["admin-dashboard"]` cache key or invalidate both old and new keys during transition.
- Do not add a global store for server data.

Acceptance Criteria:

- Dashboard still makes one logical dashboard data request.
- Dashboard child cards no longer repeat the same `useQuery` setup.
- Loading and error states remain equivalent.
- Lint and build pass.

Verification:

```bash
npm.cmd run lint
npm.cmd run build
```

Current Result:

- Added `src/features/dashboard/queries.ts`.
- Moved the dashboard React Query key and hook into the dashboard feature layer.
- Updated the dashboard page to use one top-level dashboard query result instead of repeated `useQuery` calls in each card.
- Preserved the existing dashboard UI, loading states, error states, and data transformation helpers.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.

## Phase 2: Move Domain Models Into Features

Status: Implemented on July 9, 2026

Goal: Move types, static domain data, and feature models out of component folders.

Target structure:

```txt
src/features/dashboard/model.ts
src/features/assessments/model.ts
src/features/data-dictionary/model.ts
src/features/experts/model.ts
```

Tasks:

- Move dashboard data models from component folders into `features/dashboard`.
- Move assessment types/models into `features/assessments`.
- Move data dictionary types/models into `features/data-dictionary`.
- Move experts types/models only if the experts page gains real domain data.
- Update imports only.
- Keep component behavior unchanged.

Acceptance Criteria:

- No UI behavior changes.
- No API changes.
- No duplicate model definitions remain in component folders.
- Lint and build pass.

Verification:

```bash
npm.cmd run lint
npm.cmd run build
```

Current Result:

- Added `src/features/dashboard/model.ts`.
- Added `src/features/data-dictionary/model.ts`.
- Added `src/features/assessments/model.ts`.
- Changed old component-owned model files into compatibility re-exports:
  - `src/components/admin-dashboard/dashboard-data.ts`
  - `src/components/data-dictionary/data-dictionary-data.ts`
- Updated API and component imports to use the new feature model files where practical.
- Kept compatibility exports so existing imports do not break during the migration.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.

## Phase 3: Move API Clients Into Feature Folders

Status: Implemented on July 9, 2026

Goal: Place feature API logic beside the feature that owns it.

Target structure:

```txt
src/features/dashboard/api.ts
src/features/assessments/api.ts
src/features/data-dictionary/api.ts
src/features/auth/api.ts
```

Tasks:

- Move dashboard API functions into `features/dashboard/api.ts`.
- Move assessment API functions into `features/assessments/api.ts`.
- Move data dictionary API functions into `features/data-dictionary/api.ts`.
- Move admin auth API functions into `features/auth/api.ts` only after shared API client behavior is stable.
- Keep compatibility re-exports from old `src/api/*.api.ts` files if needed.
- Remove compatibility files only after all imports are migrated.

Acceptance Criteria:

- Existing screens continue to load data.
- All feature API logic has a clear owner.
- No duplicate API implementations exist.
- Lint and build pass.

Verification:

```bash
npm.cmd run lint
npm.cmd run build
```

Current Result:

- Added `src/features/auth/api.ts`.
- Added `src/features/dashboard/api.ts`.
- Added `src/features/assessments/api.ts`.
- Added `src/features/data-dictionary/api.ts`.
- Changed old global API files into compatibility re-exports:
  - `src/api/admin-auth.api.ts`
  - `src/api/dashboard.api.ts`
  - `src/api/assessments.api.ts`
  - `src/api/data-dictionary.api.ts`
- Updated active app imports to use feature-owned API modules where practical.
- Preserved old `src/api/*.api.ts` imports for compatibility during migration.
- Preserved current API function names, request URLs, auth behavior, query keys, and UI behavior.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.

## Phase 4: Split Data Dictionary Page

Status: Partially implemented on July 9, 2026

Goal: Reduce the large data dictionary page into maintainable components and hooks.

Target structure:

```txt
src/features/data-dictionary/
  data-dictionary-page.tsx
  components/
    data-dictionary-header.tsx
    data-dictionary-table.tsx
    data-dictionary-filters.tsx
    data-dictionary-detail-panel.tsx
    data-dictionary-empty-state.tsx
  hooks/
    use-data-dictionary.ts
  utils/
    filters.ts
```

Tasks:

- Extract presentational sections first.
- Extract table rendering.
- Extract filter logic.
- Extract form/modal logic only after rendering is stable.
- Keep existing UI text, layout, and behavior unchanged.

Acceptance Criteria:

- Page file is significantly smaller.
- Components have single responsibilities.
- No route changes.
- Data dictionary workflows still work.
- Lint and build pass.

Verification:

```bash
npm.cmd run lint
npm.cmd run build
```

Manual checks:

- Data dictionary list loads.
- Filters work.
- Create/edit flows still work.
- Loading and error states still render.

Current Result:

- Added `src/features/data-dictionary/components/page-header.tsx`.
- Added `src/features/data-dictionary/components/benchmark-card.tsx`.
- Added `src/features/data-dictionary/components/lazy-viewport-section.tsx`.
- Added `src/features/data-dictionary/components/industry-domain-manager.tsx`.
- Added `src/features/data-dictionary/components/process-library-card.tsx`.
- Added `src/features/data-dictionary/components/technology-stack-card.tsx`.
- Added shared data dictionary components:
  - `src/features/data-dictionary/components/panel.tsx`
  - `src/features/data-dictionary/components/pagination-summary.tsx`
  - `src/features/data-dictionary/components/reference-scale-cards.tsx`
  - `src/features/data-dictionary/components/tier-pill.tsx`
- Added shared data dictionary UI components:
  - `src/features/data-dictionary/components/empty-state.tsx`
  - `src/features/data-dictionary/components/reorder-toast-stack.tsx`
  - `src/features/data-dictionary/components/search-input.tsx`
- Added shared data dictionary utilities:
  - `src/features/data-dictionary/utils/amount.ts`
  - `src/features/data-dictionary/utils/domain-mapping.ts`
  - `src/features/data-dictionary/utils/error.ts`
  - `src/features/data-dictionary/utils/form-state.ts`
  - `src/features/data-dictionary/utils/pagination.ts`
- Updated `src/components/data-dictionary/data-dictionary-page.tsx` to import these extracted components.
- Preserved all editable data dictionary behavior, API calls, modals, filters, and mutation logic.
- Moved the industry/domain mapping view, relation table, reorder controls, and mapping-specific skeleton into the feature component.
- Moved the process library view, desktop/mobile rows, process skeletons, process pagination, and lazy process modal ownership into the feature component.
- Moved the technology stack library view, tool modal ownership, tool skeleton, pagination display, and tool scope label into the feature component.
- Moved reusable empty state, search input, toast stack, and domain mapping helpers into feature-owned modules.
- Moved the reference scale cards and shared panel wrapper into feature-owned components.
- Moved reusable pagination and tier badge rendering into feature-owned components.
- Moved amount/currency formatting helpers and process/tool form-state builders into feature-owned utilities.
- Reused the feature-owned amount and domain helpers in the process and tool modals to remove duplicate helper definitions.
- Reduced the main data dictionary page from about 3,987 lines to about 1,062 lines.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.

Remaining Phase 4 Work:

- Move query/mutation wiring into feature hooks only after the visual components are stable.

## Phase 5: Split Assessments Page

Status: Phase 5E implemented on July 9, 2026

Goal: Reduce assessment page complexity and isolate assessment-specific UI.

Target structure:

```txt
src/features/assessments/
  assessments-page.tsx
  components/
    assessments-table.tsx
    assessment-tabs.tsx
    assessment-processes-panel.tsx
    selected-processes-preview.tsx
    custom-processes-preview.tsx
  hooks/
    use-assessment-detail.ts
  utils/
    assessment-formatters.ts
```

Tasks:

- Extract assessment list/table UI.
- Extract tab rendering.
- Extract selected processes preview.
- Extract custom processes preview.
- Preserve admin read-only behavior for selected processes.
- Preserve custom process preview behavior.

Acceptance Criteria:

- Admin can preview selected processes.
- Admin cannot update selected process data.
- Admin cannot update process names.
- Existing assessment routes continue working.
- Lint and build pass.

Verification:

```bash
npm.cmd run lint
npm.cmd run build
```

Manual checks:

- `/assessments`
- `/assessments/[assessmentId]?tab=processes`
- Selected processes preview.
- Custom processes preview.

Current Result:

- Added feature-owned assessment list/table components:
  - `src/features/assessments/components/assessments-table.tsx`
  - `src/features/assessments/components/assessment-status-pill.tsx`
  - `src/features/assessments/components/assessment-mobile-metric.tsx`
- Added assessment view-model and status helper modules:
  - `src/features/assessments/view-model.ts`
  - `src/features/assessments/utils/status.ts`
- Updated `src/components/assessments/assessments-page.tsx` to import the extracted table, status pill, mobile metric, sort types, and assessment summary type.
- Preserved assessment query loading, filtering, sorting, pagination, CSV export, route highlighting, route navigation, and detail-page data behavior.
- Preserved the selected/custom process preview behavior and kept selected process data read-only.
- Reduced the main assessments page from about 2,630 lines to about 1,926 lines.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- Added feature-owned assessment detail shell components:
  - `src/features/assessments/components/assessment-detail-view.tsx`
  - `src/features/assessments/components/assessment-tabs.tsx`
  - `src/features/assessments/components/assessment-detail-metric.tsx`
- Moved the `DetailTab` type into `src/features/assessments/view-model.ts` and kept the legacy page export for current route imports.
- Updated `src/components/assessments/assessments-page.tsx` to render the extracted detail shell with the existing overview/process/tab content as children.
- Preserved detail loading, missing-assessment, back navigation, tab routing, print action, metrics, overview content, selected/custom process previews, and all read-only selected process behavior.
- Reduced the main assessments page further from about 1,926 lines to about 1,788 lines.
- `npm.cmd run lint` passed after Phase 5B.
- `npm.cmd run build` passed after Phase 5B.
- Added `src/features/assessments/components/assessment-processes-panel.tsx`.
- Moved the selected/custom process sections, desktop process rows, mobile process cards, and read-only process preview details into the feature-owned process panel.
- Kept the existing process metric/formatting helper implementations in the legacy page for this phase and passed them into the extracted process panel unchanged.
- Preserved selected process read-only preview behavior, custom process preview behavior, expansion/collapse behavior, keyboard row toggling, process grouping, process labels, audit labels, and empty states.
- Reduced the main assessments page further from about 1,788 lines to about 1,401 lines.
- `npm.cmd run lint` passed after Phase 5C.
- `npm.cmd run build` passed after Phase 5C.
- Added assessment utility modules:
  - `src/features/assessments/utils/currency.ts`
  - `src/features/assessments/utils/formatters.ts`
  - `src/features/assessments/utils/process-metrics.ts`
- Moved reusable date, metric parsing, AED currency, compact metric, nullable count, potential DI, number input, percent, sum, process audit, process cost, process saving, process FTE, process software, and automation label helpers into feature-owned utilities.
- Updated `src/components/assessments/assessments-page.tsx` to import those helpers instead of defining them locally.
- Kept helper implementations behavior-equivalent and preserved all assessment list, detail, selected/custom process preview, routing, filtering, sorting, and export behavior.
- Reduced the main assessments page further from about 1,401 lines to about 1,192 lines.
- `npm.cmd run lint` passed after Phase 5D.
- `npm.cmd run build` passed after Phase 5D.
- Added `src/features/assessments/utils/assessment-summary.ts`.
- Moved assessment grouping, summary creation, highlight matching, contact parsing, route slug creation, process identity, custom-process detection, unique value, and summary-only date/currency aggregation helpers into the feature utility module.
- Kept page-owned route parameter parsing, filter date range helpers, list-row sorting, filter option building, CSV export, and error formatting inside `src/components/assessments/assessments-page.tsx`.
- Preserved assessment list/detail behavior, route highlighting, readable detail route slugs, selected/custom process preview behavior, filters, sorting, pagination, CSV export, and read-only selected process preview behavior.
- Reduced the main assessments page further from about 1,192 lines to about 956 lines.
- `npm.cmd run lint` passed after Phase 5E.
- `npm.cmd run build` passed after Phase 5E.

Remaining Phase 5 Work:

- Optional manual browser checks for `/assessments` and `/assessments/[assessmentId]?tab=processes`.
- Phase 5 is otherwise complete enough to proceed to Phase 6.

## Phase 6: Shared UI Cleanup

Status: Phase 6B implemented on July 9, 2026

Goal: Move only repeated, stable UI patterns into shared components.

Target structure:

```txt
src/components/ui/
  button/
  input/
  modal/
  table/
  badge/
  spinner/
  empty-state/
  skeleton/
```

Tasks:

- Extract only repeated UI patterns.
- Avoid moving one-off feature UI into shared components.
- Keep feature-specific components inside `src/features/*/components`.
- Keep styling compatible with existing design.

Acceptance Criteria:

- Shared UI components are reusable and not feature-coupled.
- Feature components remain easy to understand.
- No unnecessary wrapper components are introduced.
- Lint and build pass.

Verification:

```bash
npm.cmd run lint
npm.cmd run build
```

Current Result:

- Added `src/components/ui/skeleton/skeleton-block.tsx`.
- Replaced the local `SkeletonBlock` definition in `src/components/assessments/assessments-page.tsx` with the shared UI component.
- Preserved all loading skeleton layouts, class names, animation styling, dimensions, and route behavior.
- Kept feature-specific loading layouts in their existing files and moved only the reusable skeleton atom.
- Reduced the main assessments page further from about 956 lines to about 942 lines.
- `npm.cmd run lint` passed after Phase 6A.
- `npm.cmd run build` passed after Phase 6A.
- Added `src/components/ui/empty-state/empty-state.tsx`.
- Updated data dictionary empty-state consumers to import the shared UI empty-state atom directly:
  - `src/features/data-dictionary/components/industry-domain-manager.tsx`
  - `src/features/data-dictionary/components/technology-stack-card.tsx`
- Changed `src/features/data-dictionary/components/empty-state.tsx` into a compatibility re-export to avoid breaking any remaining feature-level imports.
- Preserved empty-state class names, spacing, border, background, typography, messages, and all data dictionary behavior.
- `npm.cmd run lint` passed after Phase 6B.
- `npm.cmd run build` passed after Phase 6B.

Remaining Phase 6 Work:

- Extract only additional repeated, stable UI atoms after confirming duplication across features.
- Avoid moving feature-specific cards, panels, or table layouts into shared UI.

## Phase 7: Provider And App Shell Cleanup

Status: Phase 7B implemented on July 9, 2026

Goal: Keep root layout clean and make global providers easier to maintain.

Target structure:

```txt
src/providers/
  app-provider.tsx
  query-provider.tsx
  auth-provider.tsx
```

Tasks:

- Group global providers into `AppProvider`.
- Keep route protection behavior unchanged.
- Keep admin shell layout behavior unchanged.
- Keep sidebar and navigation behavior unchanged.

Acceptance Criteria:

- Root `layout.tsx` is simpler.
- Provider order remains correct.
- Auth-protected pages still work.
- Guest-only pages still work.
- Lint and build pass.

Verification:

```bash
npm.cmd run lint
npm.cmd run build
```

Current Result:

- Added `src/providers/app-provider.tsx`.
- Updated `src/app/layout.tsx` to render the new `AppProvider`.
- Preserved the existing provider order:
  - `ReactQueryProvider`
  - `RouteProgressBar`
  - `AuthProvider`
- Kept the existing auth provider, React Query provider, route progress behavior, route protection behavior, admin shell behavior, sidebar behavior, and navigation behavior unchanged.
- `npm.cmd run lint` passed after Phase 7A.
- `npm.cmd run build` passed after Phase 7A.
- Added provider namespace compatibility modules:
  - `src/providers/auth-provider.tsx`
  - `src/providers/query-provider.tsx`
- Updated `src/providers/app-provider.tsx` to import `AuthProvider` and `ReactQueryProvider` from `src/providers`.
- Kept the existing auth provider and React Query provider implementations in their original files to avoid import churn or behavior risk.
- Preserved provider order, route progress behavior, auth restoration behavior, route protection behavior, admin shell behavior, sidebar behavior, and navigation behavior.
- `npm.cmd run lint` passed after Phase 7B.
- `npm.cmd run build` passed after Phase 7B.

Remaining Phase 7 Work:

- No required Phase 7 work remains.
- Only move original provider implementation files into `src/providers` later if the app first migrates all imports and the move has a clear maintenance benefit.

## Phase 8: Performance Hardening

Status: Complete after Phase 8D final verification on July 9, 2026

Goal: Improve runtime performance after structural ownership is stable.

Tasks:

- Keep expensive transformation logic outside JSX-heavy render blocks.
- Move pure formatting, grouping, sorting, and filtering helpers into feature `utils` files.
- Memoize transformations based on stable query data and filter state.
- Preserve dynamic imports for modals and other rarely opened UI.
- Keep virtualization for archive lists and consider the same pattern for any future large process tables.
- Add server-side pagination/filtering for data dictionary processes before datasets become large enough to affect load time.
- Avoid adding dependencies for bundle analysis until there is a measurable bundle-size problem.

Acceptance Criteria:

- Large pages remain responsive while filtering, sorting, and paginating.
- No new global state layer is introduced for server data.
- Data dictionary and assessments remain behaviorally unchanged.
- Lint and build pass.

Verification:

```bash
npm.cmd run lint
npm.cmd run build
```

Current Result:

- Added `src/features/assessments/utils/assessment-list.ts`.
- Moved assessment-list row metadata creation, filter matching, row sorting, industry option derivation, status option derivation, date-bound parsing, and row updated-time parsing into the assessment feature utility layer.
- Updated `src/components/assessments/assessments-page.tsx` to precompute assessment row search metadata once per fetched dataset with `useMemo`.
- Updated assessment filtering to reuse precomputed industries, normalized searchable text, and updated timestamps while preserving existing search, industry, status, minimum DI score, date range, sorting, CSV export, and pagination behavior.
- Memoized paged assessment summaries and assessment-detail metric data.
- Stabilized assessment page callback props for filter changes, sorting, reset, export, and row opening.
- Preserved assessment routes, UI layout, selected process read-only behavior, custom process preview behavior, detail tabs, CSV output format, and API contracts.
- `npm.cmd run lint` passed after Phase 8A.
- `npm.cmd run build` passed after Phase 8A.
- Added `src/features/data-dictionary/utils/process-library.ts`.
- Moved process-library domain identity map creation, selected domain filter key derivation, searchable process row metadata creation, and process filter matching into the data dictionary feature utility layer.
- Updated `src/components/data-dictionary/data-dictionary-page.tsx` to precompute process row search/domain metadata once per fetched process dataset and domain mapping state.
- Memoized data dictionary category/tier option fallbacks while preserving the existing dictionary-provided options.
- Stabilized data dictionary page callback props for process filters, tool filters, new process modal opening, tool modal open/close, and lazy technology-stack activation.
- Memoized process card visible-page slices and pagination arrays in `src/features/data-dictionary/components/process-library-card.tsx`.
- Memoized technology stack modal domain options and pagination arrays in `src/features/data-dictionary/components/technology-stack-card.tsx`.
- Preserved dynamic modal imports, create/edit/delete flows, reorder behavior, filters, pagination, technology stack server pagination, currency conversion behavior, UI layout, and API contracts.
- `npm.cmd run lint` passed after Phase 8B.
- `npm.cmd run build` passed after Phase 8B.
- Added `src/features/dashboard/utils/dashboard-view-data.ts`.
- Moved dashboard status merging, stat creation, count/value/trend normalization, weighted pipeline derivation, conversion data, chart axis/tick data, recent-assessment route formatting, compact AED formatting, and updated-at formatting into the dashboard feature utility layer.
- Updated `src/components/admin-dashboard/admin-dashboard.tsx` to compute one memoized dashboard view-data object per query data change.
- Updated dashboard cards to consume the shared view data instead of recomputing the same status/value/trend projections independently.
- Preserved the existing dashboard query key, query hook, loading states, error states, card layout, chart behavior, recently updated links, and API contracts.
- `npm.cmd run lint` passed after Phase 8C.
- `npm.cmd run build` passed after Phase 8C.
- Phase 8D made no application code changes.
- Final `npm.cmd run lint` passed for the admin application.
- Final `npm.cmd run build` passed for the admin application.
- Final production build compiled the expected App Router routes: `/`, `/_not-found`, `/archive`, `/assessments`, `/assessments/[assessmentId]`, `/data-dictionary`, `/experts`, and `/login`.

Manual performance checks:

- Dashboard loads without repeated visible loading flicker.
- Data dictionary initial load remains acceptable.
- Data dictionary filters remain responsive.
- Assessment list filters and pagination remain responsive.
- Archive scrolling remains smooth.

## Folders To Avoid Until Needed

Do not add these globally unless there is a clear reason:

- `src/services`
- `src/store`
- `src/app/api`
- `src/styles`
- `src/instrumentation.ts`

Do not add these inside every feature by default:

- `schemas`
- `actions`
- `constants`
- `services`
- `store`

Add them only when the feature actually needs them.

## Final Target Outcome

After all phases, the app should have:

- Clear feature ownership.
- Smaller page components.
- Centralized API behavior.
- No duplicate service/API layers.
- Reusable shared UI components.
- Cleaner app layout and provider setup.
- Stable existing routes and behavior.
- Easier onboarding for future developers.

## Release Checklist

Before merging each phase:

- Run lint.
- Run build.
- Check affected routes manually.
- Check browser console for runtime errors.
- Confirm no unrelated files were changed.
- Confirm no backend contract changes were introduced.

Final verification:

```bash
npm.cmd run lint
npm.cmd run build
```

Manual smoke test:

- Login flow.
- Dashboard page.
- Assessments list.
- Assessment details page.
- Processes tab.
- Data dictionary page.
- Archive page if currently enabled.
- Experts page.
