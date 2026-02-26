# Quickstart: Elections Discovery and Details Redesign

**Feature**: 007-elections-discovery | **Branch**: `007-elections-discovery`

## Prerequisites

- Node.js LTS (use `nvm use`)
- voter-api backend running on `http://localhost:8000` with:
  - Candidates API endpoints deployed (010-election-info)
  - Extended election metadata fields available
- `.env` configured (copy from `.env.example`)

## Setup

```bash
git checkout 007-elections-discovery
nvm use
npm install
npm run dev
```

## Key Files to Work With

### Types (start here)

1. **`src/types/elections.ts`** — Extend `Election` interface with 9 new metadata fields, extend `ElectionFilters` (add `registration_open`, `early_voting_active`, `search`), extend `UpdateElectionRequest` with metadata fields
2. **`src/types/candidates.ts`** — New file: `CandidateSummary`, `CandidateDetail`, `CandidateLink`, `FilingStatus`, `CandidateLinkType`, `PaginatedCandidateListResponse`, `CreateCandidateRequest`, `UpdateCandidateRequest`, `CreateCandidateLinkRequest`

### API Client

3. **`src/lib/api/elections.ts`** — Add new filter params (`registration_open`, `early_voting_active`) to `getElections()`
4. **`src/lib/api/candidates.ts`** — New file: `getCandidates(electionId, params)`, `getCandidateDetail(candidateId)`, `createCandidate(electionId, data)`, `updateCandidate(candidateId, data)`, `deleteCandidate(candidateId)`, `createCandidateLink(candidateId, data)`, `deleteCandidateLink(candidateId, linkId)`

### Hooks

5. **`src/lib/hooks/use-candidates.ts`** — New hooks: `useCandidates(electionId)`, `useCandidateDetail(candidateId)`
6. **`src/lib/hooks/use-admin-candidates.ts`** — New hooks: `useCreateCandidate()`, `useUpdateCandidate()`, `useDeleteCandidate()`, `useCreateCandidateLink()`, `useDeleteCandidateLink()`
7. **`src/lib/hooks/use-elections.ts`** — Update to return flat election list (no `groupElectionsByDate`), page_size=25
8. **`src/lib/hooks/use-election-filters.ts`** — Extend filter state with `registration_open`, `early_voting_active`, `search`

### Components (Election Information Tab)

9. **`src/components/elections/ElectionInfoTab.tsx`** — Container: candidates, eligibility, geographic area, key dates, metadata
10. **`src/components/elections/CandidateList.tsx`** — Candidate list with admin controls (add/edit/delete buttons)
11. **`src/components/elections/CandidateCard.tsx`** — Individual candidate: Avatar (photo or initials fallback), name (linked), party, badges
12. **`src/components/elections/ElectionKeyDates.tsx`** — Registration, early voting, absentee, qualifying dates (hidden when all null)
13. **`src/components/elections/ElectionEligibility.tsx`** — Eligibility description with fallback chain
14. **`src/components/elections/ElectionGeographicArea.tsx`** — District and jurisdiction display
15. **`src/components/elections/ElectionMetadata.tsx`** — Date, type, status display

### Components (Admin Candidate CRUD)

16. **`src/components/elections/AdminCandidateDialog.tsx`** — shadcn Dialog for create/edit candidate form (React Hook Form + Zod)
17. **`src/components/elections/AdminCandidateLinkForm.tsx`** — Dynamic link management within candidate Dialog

### Routes

18. **`src/routes/elections/index.tsx`** — REWRITE: flat searchable list, 25/page, search bar, status/type/registration/early-voting filters, context banner
19. **`src/routes/elections/$electionId.tsx`** — NEW: direct election detail with 3 tabs (info, results, participation), tab defaulting logic
20. **`src/routes/elections/$electionDate.tsx`** — MODIFY: redirect to /elections/ or /elections/$id
21. **`src/routes/elections/$electionDate/index.tsx`** — MODIFY: redirect to /elections/
22. **`src/routes/elections/$electionDate/$electionId.tsx`** — MODIFY: redirect to /elections/$electionId preserving tab params
23. **`src/routes/candidates/$candidateId.tsx`** — NEW: candidate detail page with bio, links, results, back-navigation

## Implementation Order

### Phase 1: Foundation (Types + API + Hooks)
1. Extend `Election` type with 9 new metadata fields
2. Extend `ElectionFilters` with `registration_open`, `early_voting_active`, `search`
3. Extend `UpdateElectionRequest` with metadata fields
4. Create `src/types/candidates.ts` (all candidate types + admin request types)
5. Create `src/lib/api/candidates.ts` (all CRUD functions)
6. Update `src/lib/api/elections.ts` (new filter params)
7. Create `src/lib/hooks/use-candidates.ts` (read hooks)
8. Create `src/lib/hooks/use-admin-candidates.ts` (mutation hooks)
9. Update `src/lib/hooks/use-elections.ts` (flat list, page_size=25)
10. Update `src/lib/hooks/use-election-filters.ts` (new filter fields)
11. Create `src/test/mocks/candidates.ts` (mock factories)
12. Write unit tests for all of the above

### Phase 2: Election Information Tab Components
1. Create `ElectionInfoTab.tsx` container
2. Create `CandidateCard.tsx` (Avatar with initials fallback)
3. Create `CandidateList.tsx` (card list with admin controls)
4. Create `ElectionKeyDates.tsx`
5. Create `ElectionEligibility.tsx`
6. Create `ElectionGeographicArea.tsx`
7. Create `ElectionMetadata.tsx`
8. Write unit tests for all components

### Phase 3: Admin Candidate CRUD
1. Create `AdminCandidateLinkForm.tsx` (dynamic link form array)
2. Create `AdminCandidateDialog.tsx` (Dialog with form, validation, link management)
3. Integrate admin controls into `CandidateList.tsx` (role-gated)
4. Write unit tests for admin components

### Phase 4: Route Migration
1. Create `/elections/$electionId.tsx` with 3-tab layout + tab defaulting
2. Rewrite `/elections/index.tsx` as flat searchable list (25/page)
3. Create `/candidates/$candidateId.tsx` candidate detail page
4. Convert legacy routes to redirects
5. Write unit tests for route components

### Phase 5: E2E Tests & Polish
1. Update E2E mock data and fixtures
2. Write E2E specs for elections list, election information tab, candidate detail
3. Visual verification with Playwright MCP
4. Lint, typecheck, build

## Testing

```bash
# Run unit tests
npm test -- --run

# Run specific test file
npm test -- --run tests/lib/api/candidates.test.ts

# Run E2E tests (requires build first)
npm run build && npm run test:e2e

# Check coverage
npm test -- --run --coverage
```

## Key Patterns to Follow

- **API client**: Use `publicApi` (no auth) for read endpoints, `api` (JWT) for admin endpoints
- **Hooks**: Use `queryKey` arrays matching existing conventions (e.g., `["elections", "candidates", electionId]`)
- **Components**: Place in `src/components/elections/`, use shadcn/ui components, `cn()` for class merging
- **Admin CRUD**: shadcn Dialog for forms, AlertDialog for delete confirmation, `useUserRole()` for role checks
- **Avatar fallback**: shadcn `Avatar` → `AvatarImage` (photo_url) + `AvatarFallback` (initials from full_name)
- **Route search params**: Validate with Zod, navigate with `replace: true` for tab changes
- **Tab values**: `"info" | "results" | "participation"` — extend existing search schema
- **Mock factories**: Add to `src/test/mocks/candidates.ts`
- **E2E fixtures**: Add mock data to `e2e/fixtures/mock-data.ts`, intercepts to `e2e/fixtures/election-api.ts`

## API Verification

To verify the backend Candidates API is working:

```bash
# List candidates for an election
curl http://localhost:8000/api/v1/elections/{election_id}/candidates

# Get candidate detail
curl http://localhost:8000/api/v1/candidates/{candidate_id}

# Get election with new metadata fields
curl http://localhost:8000/api/v1/elections/{election_id}

# Filter elections by registration status
curl "http://localhost:8000/api/v1/elections?registration_open=true"

# Filter elections by early voting status
curl "http://localhost:8000/api/v1/elections?early_voting_active=true"
```
