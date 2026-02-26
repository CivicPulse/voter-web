# Research: Elections Discovery and Details Redesign

**Feature**: 007-elections-discovery | **Date**: 2026-02-25

## R1: Spec Assumptions vs. New API Capabilities

**Decision**: The new Candidates API supersedes several spec assumptions. Update implementation to use the real API rather than deriving data from results.

**Rationale**: The spec was written before the API changes were finalized. The user has now provided a complete Candidates API (`GET /elections/{id}/candidates`, `GET /candidates/{id}`) and extended election detail fields (description, purpose, eligibility_description, key dates). These replace the need for client-side synthesis.

**Impact on spec assumptions**:

| Spec Assumption | Status | New Approach |
|----------------|--------|-------------|
| "Short description synthesized from election type + district" (FR-003) | **Superseded** | Use `purpose` field from API when available; fall back to client-side synthesis |
| "Candidates come from existing results data only" (FR-011, Assumptions) | **Superseded** | Use `GET /elections/{id}/candidates` endpoint; show actual candidates with party, photo, incumbent status |
| "Eligibility derived from district name" (FR-012, Assumptions) | **Superseded** | Use `eligibility_description` field from API when available; fall back to district-derived text |
| "No new backend API change required" (Clarification) | **Superseded** | API has full candidate CRUD + extended election fields |

**Alternatives considered**: Sticking with spec's results-only approach was rejected because the API now provides richer data that directly serves the feature's goals.

## R2: Route Structure Migration Strategy

**Decision**: Move election detail from `/elections/$electionDate/$electionId` to `/elections/$electionId`. Add redirect routes for legacy URLs. Add new `/candidates/$candidateId` route.

**Rationale**: The spec requires removing the date-based drill-down (FR-020). TanStack Router's file-based routing means we create new route files and convert old route files into redirect-only routes.

**Implementation approach**:
1. Create `/elections/$electionId.tsx` — new direct detail route with 3 tabs
2. Modify `/elections/$electionDate.tsx` — detect whether param is a UUID or date; redirect accordingly
3. Modify `/elections/$electionDate/$electionId.tsx` — redirect to `/elections/$electionId` preserving tab search params
4. Modify `/elections/$electionDate/index.tsx` — redirect to `/elections/`
5. Create `/candidates/$candidateId.tsx` — new candidate detail page (FR-028)

**Route disambiguation**: Since both `$electionId` (UUID) and `$electionDate` (YYYY-MM-DD) are dynamic params at the same route level, `$electionId.tsx` MUST use TanStack Router's `params.parse` validation to only match UUID-shaped strings. When `params.parse` throws, the router skips the route and falls through to `$electionDate.tsx` for date-shaped params.

```typescript
// src/routes/elections/$electionId.tsx
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const Route = createFileRoute('/elections/$electionId')({
  params: {
    parse: (params) => {
      if (!UUID_RE.test(params.electionId)) throw new Error('Not a UUID')
      return params
    },
    stringify: (params) => params,
  },
  // ...
})
```

`$electionDate.tsx` acts as the fallback catch-all for non-UUID params (date strings) and redirects them appropriately.

**Alternatives considered**:
- Deleting old route files: Rejected because it breaks existing bookmarks/shared links (violates FR-020)
- Using a single catch-all route: Rejected due to TanStack Router file-based routing constraints
- Relying on file naming order for route matching: Rejected — non-deterministic and fragile

## R3: Tab Defaulting Logic

**Decision**: Determine default tab based on whether the election has results data, not just the election status field.

**Rationale**: An election can have status "active" or "finalized" but may not have actual results data loaded yet. The spec says "when no results data exists" → Election Information tab (FR-015). This means we need to check for the presence of results, not just status.

**Implementation approach**:
1. Fetch election detail to get `status` (always needed)
2. Attempt to fetch results — if 404 or empty candidates array, treat as "no results"
3. Default tab: `hasResults ? "results" : "info"`
4. URL `?tab=` param overrides the default (FR-018)

**Decision on tab values**: Extend the search schema from `["results", "participation"]` to `["info", "results", "participation"]`.

**Alternatives considered**:
- Defaulting based on status alone: Rejected because status doesn't guarantee results data exists
- Fetching results for every page load to determine default: Accepted — the results are needed anyway when the Results tab is shown, and the query is cached by TanStack Query

## R4: Client-Side Search vs. Server-Side Search

**Decision**: Client-side search filtering over the paginated election list (25 items/page). The API supports structured filters but not free-text search. Server-side search tracked as CivicPulse/voter-api#89.

**Rationale**: 25 items per page provides a good balance between search coverage and load performance. Client-side filtering over the current page provides instant feedback. Debounced search input (300ms) avoids excessive re-filtering.

**Implementation approach**:
1. Use API filters: `status`, `election_type`, `registration_open`, `early_voting_active`
2. Client-side: filter the current page's results by search text matching name, district, or purpose/description
3. Debounce search input (300ms) to avoid excessive re-filtering

**Alternatives considered**:
- Request all elections and filter client-side: Rejected for scalability; pagination exists for a reason
- Wait for API search parameter: Rejected; feature is needed now and client-side search is sufficient for current scale

## R5: Election List Item Display

**Decision**: Each list item shows election name, formatted date, and description (from API `purpose` field, falling back to synthesized type + district).

**Rationale**: The API now provides `purpose` ("Short statement of what the election decides"). This is nullable — not all elections will have it populated. A fallback to client-side synthesis (`"General — U.S. Senate"` style) ensures every election has a description.

**Implementation approach**:
1. Display (list view): `election.purpose ?? synthesizeDescription(election)` (per FR-003)
2. `synthesizeDescription(election)`: `"${capitalize(election_type)} — ${election.district}"`
3. Additional badges: status, election type, "Registration Open" / "Early Voting Now" if applicable

**Sort order assumption**: The API does not expose a `sort` or `order_by` query parameter. FR-008 requires "sorted by date (newest first)" and edge case EC-006 requires secondary sort by election name (alphabetical). This implementation assumes the API's default sort order is `election_date DESC, name ASC`. If the API does not sort this way by default, a `sort` param will need to be added to voter-api. **Verify with backend before implementation.**

## R6: Candidates Display on Election Information Tab

**Decision**: Use the Candidates API `GET /elections/{id}/candidates` as primary source. Show all candidates (all filing statuses) with status badges and visual dimming for non-qualified. Fall back to results data when candidates endpoint returns empty. Link candidate names to `/candidates/{id}` detail page.

**Rationale**: FR-011 requires showing all candidates with status badges. Non-qualified candidates (withdrawn, disqualified) are shown dimmed with a badge. Write-in candidates get a "Write-In" badge. The fallback to results data ensures elections imported from SOS feeds still show candidate names even before admin enrichment.

**Implementation approach**:
1. `useCandidates(electionId)` hook calls `GET /elections/{id}/candidates` (no status filter — show all)
2. Display as card list: photo or initials avatar (shadcn Avatar with fallback), name (linked to `/candidates/{id}`), party badge, incumbent badge, filing status badge for non-qualified
3. When `items` is empty: fall back to `useRaceResults(electionId)` candidate data
4. When neither source has candidates: "Candidates not yet announced"
5. Candidates sorted by `ballot_order` (nulls last), then alphabetically by name
6. Admin users see "Add Candidate", "Edit", and "Delete" controls

**Photo fallback**: Use shadcn `Avatar` component. `AvatarImage` for photo URL, `AvatarFallback` with initials derived from `full_name` (first letter of first and last name).

## R7: Geographic Context Banner

**Decision**: When navigation context (state/county) is set, show a banner above the election list indicating the context, with a "Show all elections" button to clear it.

**Rationale**: The spec (FR-019, edge case) requires that geographic context highlights relevant elections rather than filtering. The banner makes the context transparent.

**Implementation approach**:
1. Read `useNavigationContext()` for state/county
2. Show banner: "Showing elections for {County}, {State}" with "Show all" button
3. Elections matching the context get a visual indicator (subtle border highlight or badge)
4. Matching heuristic: compare election district name against county/state context

## R8: Key Dates Display

**Decision**: Show a "Key Dates" card on the Election Information tab using the election metadata fields.

**Rationale**: The new fields (registration_deadline, early_voting_start/end, absentee_request_deadline, qualifying_start/end) are highly valuable for voters planning to participate.

**Implementation approach**:
1. Read fields from the election detail response
2. Display as a card with labeled date rows
3. Highlight dates that are upcoming (within 30 days) or past
4. If all date fields are null, hide the section entirely (FR-021)

## R9: Existing Functionality Preservation

**Decision**: The Results tab and Participation tab remain unchanged in functionality. Only the route structure and tab container change.

**Rationale**: SC-004 requires all existing election results, participation data, and map visualizations remain fully functional. The existing component code will be extracted and reused in the new `$electionId.tsx` route.

**Implementation approach**:
1. Move Results tab content (map, results section, controls) from `$electionDate/$electionId.tsx` to new `$electionId.tsx`
2. Move Participation tab content similarly
3. Add new "Election Information" tab as the first tab
4. Preserve all state management (selected county, map view, district outline, etc.)
5. Preserve auto-polling behavior for active elections

## R10: Admin Candidate Management

**Decision**: Admin CRUD for candidates uses shadcn Dialog (modal) overlays rendered inline on the Election Information tab. Only visible to users with `admin` role.

**Rationale**: The two-step confirmation pattern with Dialog modals is consistent with existing admin patterns in the codebase (user creation, import uploads). The Dialog keeps the tab layout clean and avoids scroll disruption. Role-based visibility uses the existing `useUserRole()` hook.

**Implementation approach**:
1. "Add Candidate" button above candidates list (admin only) opens Dialog with form
2. "Edit" button on each candidate card opens Dialog pre-populated with candidate data
3. "Delete" button uses AlertDialog with confirmation
4. Form uses React Hook Form + Zod validation
5. Fields: full_name (required), party, bio, photo_url, ballot_order, filing_status (select), is_incumbent (checkbox), links (dynamic list)
6. Handle 409 conflict (duplicate name) with inline form error
7. Invalidate candidates query on successful mutation

**Link management**: Links are managed within the candidate Dialog as a dynamic form array. Each link has type (select), URL, and label fields. On create, links are included in the POST body. On edit, links are added/removed via separate API calls.

## R11: Candidate Detail Page

**Decision**: Dedicated page at `/candidates/$candidateId` showing full candidate information with back-navigation to parent election.

**Rationale**: FR-028/029/030 require a dedicated candidate detail page. This provides a richer view with bio, all external links, and election results data that doesn't fit in the compact Election Information tab card layout.

**Implementation approach**:
1. New route: `src/routes/candidates/$candidateId.tsx`
2. Fetch `GET /candidates/{id}` for full detail including bio, links, result data
3. Display: Avatar (photo or initials), name, party, filing status badge, incumbent badge
4. Sections: Bio, External Links (grouped by type with icons), Election Results (vote count, party if available)
5. Back-navigation: "← Back to {election name}" link using `election_id` from candidate detail
6. 404 handling: show error page with link to elections list
