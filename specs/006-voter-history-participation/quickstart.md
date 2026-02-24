# Quickstart: Voter History & Election Participation

**Feature Branch**: `006-voter-history-participation`
**Date**: 2026-02-23

## Prerequisites

- Node.js LTS (use `nvm use` — reads `.nvmrc`)
- `.env` configured with `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api/v1`)
- voter-api backend running with participation endpoints deployed:
  - `GET /voters/{voter_registration_number}/history`
  - `GET /elections/{election_id}/participation/stats`
  - `GET /elections/{election_id}/participation`

## Setup

```bash
# 1. Switch to the feature branch
git checkout 006-voter-history-participation

# 2. Install dependencies (including any new ones added during implementation)
npm install

# 3. Add the shadcn/ui Tabs component (if not already added)
npx shadcn@latest add tabs

# 4. Start the dev server
npm run dev
```

## New Component: Install shadcn/ui Tabs

This feature introduces the shadcn/ui Tabs component for the first time:

```bash
npx shadcn@latest add tabs
```

This installs:
- `src/components/ui/tabs.tsx` — Tabs, TabsList, TabsTrigger, TabsContent
- `radix-ui` dependency (peer — likely already present)

## Verify the Feature

### User Story 1: Voter Participation History

1. Navigate to any voter detail page: `http://localhost:5173/voters/{voterId}`
2. Scroll below the District Assignments card
3. Verify the **"Election History"** card appears with:
   - Chronological list of elections (most recent first)
   - Each entry shows: election date, election type badge, voting method
   - Election type filter dropdown
   - Date range filter
   - Clickable entries navigate to election detail page
4. If the voter has no history, verify the empty state message appears

### User Story 2: Election Participation Statistics

1. Navigate to an election detail page: `http://localhost:5173/elections/{date}/{electionId}`
2. Verify tab bar appears with **"Results"** and **"Participation"** tabs
3. Click **"Participation"** tab
4. Verify headline stats: total eligible voters, total votes cast, turnout %
5. Verify party affiliation donut chart with legend
6. Verify voting method horizontal bar chart with labels
7. If the election is active, verify "Preliminary" badge appears

### User Story 3: Election Participant Voter List

1. Log in as an **admin** or **analyst** user
2. Navigate to election detail → Participation tab
3. Verify the paginated voter table appears below the statistics
4. Verify columns: Name, Registration #, County, Voting Method
5. Use the search field to filter by voter name or registration number
6. Click pagination controls to advance pages
7. Click a voter name to navigate to their detail page
8. Log in as a **viewer** user and verify the voter list section is **not visible**

## Key Files

| Area | File | Change |
|------|------|--------|
| Types | `src/types/voter.ts` | Add `VoterParticipationRecord` |
| Types | `src/types/elections.ts` | Add `ParticipationStats`, `ElectionParticipant`, breakdown types |
| API | `src/api/voters.ts` | Add `getVoterHistory()` |
| API | `src/lib/api/elections.ts` | Add `getParticipationStats()`, `getElectionParticipants()` |
| Hook | `src/hooks/useVoters.ts` | Add `useVoterHistory()` |
| Hook | `src/lib/hooks/use-participation-stats.ts` | New file |
| Hook | `src/lib/hooks/use-election-participants.ts` | New file |
| UI | `src/components/ui/tabs.tsx` | New (via `npx shadcn@latest add tabs`) |
| Component | `src/routes/voters/_components/VoterHistoryCard.tsx` | New |
| Component | `src/components/elections/ParticipationTab.tsx` | New |
| Component | `src/components/elections/ParticipationStatsCard.tsx` | New |
| Component | `src/components/elections/ElectionParticipantList.tsx` | New |
| Route | `src/routes/voters/$voterId.tsx` | Add VoterHistoryCard |
| Route | `src/routes/elections/$electionDate/$electionId.tsx` | Add tabbed interface |

## Run Tests

```bash
# Unit tests (watch mode)
npm test

# Unit tests (CI mode, single run)
npm test -- --run

# Lint
npm run lint

# Type check + build
npm run build

# E2E tests (requires build first)
npm run test:e2e
```

## Architecture Notes

- **Recharts**: Used for the first time in this project. Donut chart for party breakdown, horizontal bar chart for voting method. Imported from `"recharts"`.
- **Tabs**: shadcn/ui Tabs component (Radix primitives). URL-synced via TanStack Router search params (`?tab=results|participation`).
- **Role gating**: `useUserRole()` hook checks `role === "admin" || role === "analyst"` to show/hide the voter list section. Stats are visible to all authenticated users.
- **Client-side filtering**: Voter history loads all records in one API call; election type and date range filters are applied client-side.
- **Server-side pagination**: Election participant list uses standard `page`/`page_size` params with server-side search (`q` param).
