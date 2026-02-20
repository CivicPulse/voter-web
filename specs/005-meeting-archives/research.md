# Research: Meeting Archives Browser

**Feature Branch**: `005-meeting-archives` | **Date**: 2026-02-20

## Research Tasks & Findings

### R-001: Backend API Status for Meeting Archives

**Decision**: The voter-api backend does **not** have meeting-related endpoints yet. The frontend must define API contracts that the backend will implement to match.

**Rationale**: Reviewed all API v1 routes in `CivicPulse/voter-api` — existing endpoints cover: analysis, auth, boundaries, datasets, elected_officials, elections, exports, geocoding, imports, voter_history, voters. No governing bodies, meetings, agenda items, or meeting search endpoints exist.

**Alternatives Considered**:
- Wait for backend to be built first — rejected because frontend contracts can drive backend implementation (contract-first approach)
- Use mock data only — partially adopted; E2E tests and development will use mocked API responses via `page.route()` interception (existing project pattern)

---

### R-002: Video Embed Approach (YouTube & Vimeo)

**Decision**: Use raw `<iframe>` embeds with YouTube/Vimeo oEmbed URL patterns rather than a third-party library like `react-player`.

**Rationale**:
- The spec only requires YouTube and Vimeo (2 providers) — `react-player` adds ~50KB+ for capabilities we don't need
- YouTube embed: `https://www.youtube.com/embed/{videoId}?start={seconds}`
- Vimeo embed: `https://player.vimeo.com/video/{videoId}#t={seconds}s`
- Both support timestamp seeking via URL parameters, which maps directly to FR-010 (agenda item video timestamps)
- For timestamp navigation from agenda items, we update the iframe `src` with the `?start=` or `#t=` parameter to seek
- Graceful degradation: if embed fails (blocked/removed), show a fallback link to watch directly on the platform

**Alternatives Considered**:
- `react-player` library — rejected due to bundle size overhead for only 2 providers
- YouTube/Vimeo JS APIs — rejected; adds complexity for seeking when URL params achieve the same result with zero JS API dependency

---

### R-003: PDF Inline Preview

**Decision**: Use browser-native PDF rendering via `<iframe>` with the attachment download URL.

**Rationale**:
- Spec assumption explicitly states: "PDF preview will use the browser's native PDF rendering capability (inline iframe or object tag)"
- All modern browsers (Chrome, Firefox, Edge, Safari) have built-in PDF viewers
- Zero additional bundle size
- Fallback: if the browser doesn't render inline, the `<iframe>` naturally degrades to a download prompt

**Alternatives Considered**:
- `pdf.js` / `react-pdf` — rejected per spec assumption; adds significant bundle size (~500KB+) for marginal benefit over native rendering
- `<object>` tag — `<iframe>` has better cross-browser consistency and simpler styling

---

### R-004: Breadcrumb Navigation Component

**Decision**: Install shadcn/ui `breadcrumb` component via `npx shadcn@latest add breadcrumb`.

**Rationale**:
- FR-015 requires breadcrumbs: Home → Governing Bodies → [Body Name] → [Meeting Date]
- shadcn/ui provides a `breadcrumb` component (not currently installed — checked `src/components/ui/`)
- Follows project convention of using shadcn/ui components from `src/components/ui/`
- Includes proper accessibility (aria-label, aria-current) out of the box

**Alternatives Considered**:
- Custom breadcrumb component — rejected; shadcn/ui version follows project conventions and handles accessibility

---

### R-005: Pagination Strategy

**Decision**: Use offset-based pagination (`page` + `page_size` query params) matching the existing election list API pattern.

**Rationale**:
- The existing `GET /elections` endpoint uses `{ items, pagination: { total, page, page_size, total_pages } }` — the meeting endpoints should follow the same pattern for consistency
- Frontend pagination UI pattern already established: Previous/Next buttons with "Page X of Y" display
- Offset-based is simpler and sufficient for the expected data scale (hundreds to low thousands of meetings per body)

**Alternatives Considered**:
- Cursor-based pagination — rejected; not needed at this scale, and would break consistency with existing API patterns

---

### R-006: Search Result Highlighting

**Decision**: The API will return search results with `<mark>` HTML tags wrapping matched terms in text snippets. The frontend will sanitize snippets using DOMPurify (allowing only `<mark>` tags) before rendering.

**Rationale**:
- Spec assumption: "The search endpoint on the API handles full-text indexing and returns results with highlighted snippets. The frontend renders these highlights."
- PostgreSQL full-text search's `ts_headline()` function natively produces custom tag-wrapped highlights
- Using `<mark>` tags is semantic HTML for highlighted text
- **Security**: All HTML snippets MUST be sanitized with DOMPurify (configured to allow only `<mark>` tags) before rendering to prevent XSS attacks. This is a defense-in-depth measure per constitution security requirements.

**Alternatives Considered**:
- Token-based highlighting (API returns match positions, frontend applies) — rejected; more complex, and the API can handle this more naturally
- Rendering without sanitization — rejected; defense-in-depth is required per constitution (Code Quality & Maintainability, security vulnerabilities)

---

### R-007: URL Routing Structure

**Decision**: Meeting archive routes use the following patterns, nested under `/meetings`:

| Route | Purpose |
|-------|---------|
| `/meetings` | Landing page (search + bodies directory) |
| `/meetings/bodies` | Governing bodies directory (filterable list) |
| `/meetings/bodies/$bodySlug` | Governing body detail + meeting history |
| `/meetings/bodies/$bodySlug/$date/$seq` | Meeting detail page |
| `/meetings/all` | All meetings across bodies |
| `/meetings/search` | Search results page |

**Rationale**:
- Groups all meeting archive routes under `/meetings` for clean separation from existing features
- Body detail uses slug per spec: `bibb-county-boe`, `macon-bibb-county-commission`
- Meeting URL uses `$date/$seq` pattern per FR-016 for human-readable URLs that handle multiple meetings per date
- Landing page at `/meetings` implements FR-023 (combined search + directory entry point)
- Separate `/meetings/all` for the cross-body meeting list (User Story 6, P3)

**Alternatives Considered**:
- Flat routes (`/bodies/$slug`, `/meetings/$id`) — rejected; loses the logical grouping under the "Meetings" nav item
- UUID-based meeting URLs — rejected per FR-016 requiring human-readable URLs with dates

---

### R-008: Collapsible Component for Agenda Items

**Decision**: Use the existing shadcn/ui `collapsible` component (already installed) for expandable agenda items.

**Rationale**:
- FR-006 requires agenda items to be "expandable inline" — collapsible is the natural fit
- `src/components/ui/collapsible.tsx` is already installed in the project
- Provides `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` with proper accessibility (aria-expanded)
- Handles the edge case of 50+ agenda items efficiently (all collapsed by default)

**Alternatives Considered**:
- Accordion component — rejected; collapsible allows multiple items open simultaneously, which is more useful for comparing agenda items
- Custom expand/collapse — rejected; shadcn/ui component already exists and follows project conventions

---

### R-009: New Dependencies Required

**Decision**: Minimal new dependencies needed.

| Dependency | Purpose | Status |
|-----------|---------|--------|
| `shadcn/ui breadcrumb` | Breadcrumb navigation (FR-015) | To install via `npx shadcn@latest add breadcrumb` |
| `dompurify` + `@types/dompurify` | Sanitize search result HTML snippets (XSS prevention) | To install via `npm install dompurify @types/dompurify` |

**Rationale**: The project already has all major dependencies needed (TanStack Router, TanStack Query, ky, shadcn/ui, Zod, Lucide React). Only `dompurify` is a new npm dependency for XSS-safe rendering of search highlight snippets. The breadcrumb is a shadcn/ui component addition (no separate npm install).

---

### R-010: Public Access Pattern (No Auth)

**Decision**: Meeting archive API calls will use the existing `ky` client instance. Routes will not have `beforeLoad` auth guards.

**Rationale**:
- FR-024 explicitly states all meeting archive pages are fully public
- The existing `api` client from `@/api/client.ts` includes JWT token if present in localStorage, but the backend will not require it for meeting endpoints
- No need for a separate unauthenticated client — the existing client works for both authenticated and unauthenticated requests (backend ignores the token for public endpoints)

**Alternatives Considered**:
- Separate unauthenticated API client — rejected; unnecessary complexity, existing client works fine for public endpoints
