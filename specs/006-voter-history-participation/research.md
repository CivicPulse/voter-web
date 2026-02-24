# Research: Voter History & Election Participation

**Feature Branch**: `006-voter-history-participation`
**Date**: 2026-02-23

## Research Tasks

### 1. Recharts Chart Patterns (First Use in Codebase)

**Decision**: Use Recharts 3.7 (already installed) with `PieChart` (donut) for party affiliation and `BarChart` (horizontal) for voting method breakdowns.

**Rationale**: Recharts is already a project dependency (v3.7.0) but has not been used yet. Using it avoids adding a new dependency. Recharts 3.x provides built-in responsive containers, accessible tooltips, and works well with React 19.

**Alternatives Considered**:
- **Chart.js / react-chartjs-2**: Would add a new dependency when Recharts is already installed.
- **shadcn/ui Charts (built on Recharts)**: The shadcn chart components add extra abstraction; using Recharts directly is simpler for two chart types.
- **D3.js**: Overkill for bar/donut charts; no React integration without additional wrapper.

**Key Implementation Details**:
- `Cell` is deprecated in Recharts 3.x (removed in 4.0). Use the `shape` prop with `<Sector>` (Pie) or embed `fill` in data objects.
- `layout="vertical"` on `BarChart` creates horizontal bars.
- `LabelList` is a child of `<Bar>` or `<Pie>` for inline labels.
- `ResponsiveContainer` requires its parent to have a defined height.
- Empty data: guard with early return before rendering chart components.
- Existing `PARTY_COLORS` mapping in `src/types/elections.ts` provides Dem/Rep/Lib/Grn/Ind colors.

### 2. shadcn/ui Tabs Component

**Decision**: Install shadcn/ui Tabs (`npx shadcn@latest add tabs`) for the election detail page's Results/Participation tab interface.

**Rationale**: The spec requires a "tabbed interface" (FR-017). shadcn/ui Tabs is the canonical choice — it builds on Radix UI primitives with full ARIA/keyboard support and matches the project's existing shadcn/ui component library.

**Alternatives Considered**:
- **ToggleGroup** (already in codebase): Used for County/Precinct map toggle. Semantically a "view switcher" not a "tab panel", and doesn't provide `TabsContent` panel management.
- **Custom tabs**: Would duplicate Radix functionality and miss accessibility features.

**Key Implementation Details**:
- Components: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — all from `@/components/ui/tabs`.
- Two variants: `variant="default"` (pill background) and `variant="line"` (underline). Use `"default"` to match shadcn style.
- URL-synced tabs via TanStack Router: `validateSearch` with Zod schema for `tab` param, `onValueChange` calls `navigate({ search, replace: true })`.
- Lazy rendering: use conditional `{tab === "participation" && <Component />}` inside `TabsContent` to avoid mounting heavy content until selected.
- `forceMount` on `TabsContent` + `hidden` attribute preserves state across tab switches if needed.
- Default `activationMode="automatic"` activates tab on arrow key focus.

### 3. API Contract Shapes (Assumed Backend Endpoints)

**Decision**: Define three API endpoints with TypeScript types matching REST conventions used by the existing voter-api backend.

**Rationale**: The spec assumes endpoints exist (see Assumptions section). The frontend needs typed contracts to build against. Shapes follow existing backend patterns (paginated responses with `items`/`pagination`, consistent field naming).

**Endpoints**:
1. `GET /voters/{voter_registration_number}/history` → `VoterParticipationRecord[]`
2. `GET /elections/{election_id}/participation/stats` → `ParticipationStats`
3. `GET /elections/{election_id}/participation` → Paginated `ElectionParticipant[]`

**Alternatives Considered**:
- **GraphQL**: Not used in this project; all existing endpoints are REST.
- **Single combined endpoint**: Would couple voter history with election stats; separate endpoints allow independent caching and lazy loading.

**Key Implementation Details**:
- Voter history uses `voter_registration_number` (not UUID) as path param, matching spec assumption.
- Election participants use standard pagination pattern (`page`, `page_size`, `items`, `pagination`).
- Search filter (`q` param) follows existing voter search pattern.
- Stats endpoint returns pre-aggregated data (total_eligible, total_voted, turnout_percentage, party_breakdown, method_breakdown).

### 4. Role-Based Access for Voter List

**Decision**: Use the existing `useUserRole()` hook to conditionally render the election participant voter list. Stats are visible to all authenticated users; the voter list is wrapped in `{isAdmin && <Component />}`.

**Rationale**: This matches the established pattern in the codebase — the root layout, admin layout, and user management pages all use `useUserRole()` with `role === "admin" || role === "analyst"` checks. No new RBAC infrastructure needed.

**Alternatives Considered**:
- **Route-level protection** (like `/admin/*`): Overkill since the voter list is a section within the public election detail page, not a separate route.
- **useApiCapabilities()**: This hook detects API endpoint availability, not user roles. Wrong tool for role gating.
- **Server-side only**: The API should also enforce 403 for viewer-role users, but the frontend must still hide the UI section.

**Key Implementation Details**:
- `useUserRole()` returns `{ data: UserProfile | undefined }` from TanStack Query (cached 5 min).
- Check: `const isAdmin = userProfile?.role === "admin" || userProfile?.role === "analyst"`.
- The voter list component is completely unmounted for viewer-role users (not just hidden/disabled).
- The participation stats API call runs regardless of role; the voter list API call should only run when `isAdmin` is true (use `enabled: isAdmin` on the query).

### 5. Election Detail Page Tab Structure

**Decision**: Wrap the election detail page content in a `Tabs` component with "Results" (default) and "Participation" tabs. Sync active tab to URL search params.

**Rationale**: FR-017 requires a tabbed interface. The existing election detail page has substantial content (results section + map views + controls) that maps cleanly to a "Results" tab. The new participation content (stats + voter list) goes in a "Participation" tab. URL syncing preserves state on refresh and allows deep linking.

**Alternatives Considered**:
- **Vertical sections** (no tabs): Would make the page very long and load all data upfront.
- **Separate route**: Would break the conceptual "one page per election" mental model.
- **Accordion/collapsible**: Doesn't match the spec requirement for a "tabbed interface".

**Key Implementation Details**:
- Add `tab` search param to the election detail route's `validateSearch`.
- Default tab: `"results"` (existing content loads by default).
- Participation tab lazily mounts components only when selected.
- The breadcrumb, header, and status indicators remain above the tabs (shared context).
- Map state (selected county, view mode, overlays) resets when switching tabs (no `forceMount`).
