# Research: Voter Search & Geocoding

**Feature Branch**: `003-voter-search-geocoding`
**Date**: 2026-02-18

## Research Summary

All NEEDS CLARIFICATION items have been resolved through codebase analysis and spec clarification sessions. No external research was required — the existing codebase provides clear patterns for every aspect of this feature.

---

## R-001: Voter Search API Endpoint Pattern

**Decision**: Use `GET /voters` with query parameters for search, filter, pagination, and sorting — matching the existing `GET /elections` pattern.

**Rationale**: The elections API already uses this exact pattern (`GET /elections?status=active&page=1&page_size=20`). Following the same conventions ensures consistency across the API and reuses established frontend pagination/filter patterns.

**Alternatives considered**:
- `POST /voters/search` with request body — rejected because the existing API consistently uses GET with query params for list/search endpoints
- Separate `/voters/search` and `/voters` endpoints — rejected as unnecessary; a single endpoint with optional `q` parameter serves both browse and search use cases

---

## R-002: Voter Detail API Endpoint

**Decision**: Use `GET /voters/{voterId}` returning a `VoterDetail` object with registration fields. District assignments are fetched separately via the existing `GET /geocoding/point-lookup` endpoint using the voter's official location coordinates.

**Rationale**: Separating voter detail from district lookup follows the existing pattern where geocoded locations are fetched via `GET /voters/{voterId}/geocoded-locations` (already implemented). District assignments are a computed view based on the official location's coordinates and can reuse the existing point-lookup infrastructure.

**Alternatives considered**:
- Single endpoint returning voter + locations + districts — rejected because it couples three independent data sources and makes caching/invalidation harder
- Dedicated `GET /voters/{voterId}/districts` endpoint — possible but unnecessary since `GET /geocoding/point-lookup` already provides this functionality and the frontend already has hooks for it

---

## R-003: Single-Voter Geocoding Trigger

**Decision**: Use `POST /voters/{voterId}/geocode` as a synchronous endpoint that triggers all geocoding providers and returns the updated list of `VoterGeocodedLocation[]`. The frontend shows a loading spinner during the request.

**Rationale**: The existing `geocodeAddress(address)` endpoint is synchronous. For a single voter with 2-3 providers, synchronous is simpler and avoids the polling complexity of batch geocoding. The "geocoding in progress" acceptance scenario refers to the in-flight request state (button disabled while awaiting response), not an async job.

**Alternatives considered**:
- Async job pattern (like batch geocoding) — rejected because single-voter geocoding should complete in seconds, and the async pattern adds unnecessary complexity (job status, polling) for this use case
- Client-side sequential calls to each provider — rejected because geocoding provider selection and execution is a backend concern

---

## R-004: Location Deletion Endpoint

**Decision**: Use `DELETE /voters/{voterId}/geocoded-locations/{locationId}` to remove a geocoded location. Returns 204 No Content on success.

**Rationale**: Standard REST convention for resource deletion. The existing codebase has GET (list) and POST (add) for this resource path — DELETE is the natural complement. The frontend already has the `VoterGeocodedLocation.id` needed for the path parameter.

**Alternatives considered**:
- Soft delete with status flag — rejected as over-engineering for geocoded locations that have no audit requirements
- Bulk delete — rejected as the spec only requires individual deletion

---

## R-005: Filter Options Source

**Decision**: Filter options (counties, statuses, district types/districts) are fetched from a dedicated `GET /voters/filters` endpoint that returns the distinct values available in the voter data. District options are structured hierarchically (type → values) to support the two-level cascade filter.

**Rationale**: A dedicated filter options endpoint is more efficient than extracting facets from search results (which would require scanning the full dataset). It also allows the frontend to populate filters before the user has typed a search query.

**Alternatives considered**:
- Facets embedded in search response — rejected because filters must be available before any search is performed
- Static lists — rejected because the spec requires dynamically populated filter options reflecting actual data
- Reuse existing boundary endpoints for district values — possible but doesn't provide voter-specific district coverage (only districts that have voters assigned)

---

## R-006: Map Component Pattern

**Decision**: Create a `GeocodedLocationMap` component using React-Leaflet (matching the existing `CountyDetailMap` pattern). Pins use Leaflet markers with distinct colors for official vs. non-official locations. The map auto-fits bounds to show all pins.

**Rationale**: The codebase already uses React-Leaflet with OpenStreetMap tiles for the county detail map. Reusing the same stack ensures consistency and leverages existing knowledge.

**Alternatives considered**:
- Mapbox GL JS — rejected because the project already uses Leaflet and adding a second map library increases bundle size
- Static map image — rejected because interactive pins are needed for staff to compare locations spatially

---

## R-007: Search State Management

**Decision**: Use TanStack Router's validated search params (Zod schema) to drive all search state (query, county, status, district_type, district_id, sort_by, sort_order, page). Components read state from `Route.useSearch()` and update via `navigate({ search: ... })`.

**Rationale**: This is the established pattern in the codebase (see `/lookup/results` route with Zod-validated search params). It provides URL-driven state for free — bookmarking, sharing, back/forward navigation — with type safety from Zod.

**Alternatives considered**:
- Zustand store for search state — rejected because URL params are the correct tool for shareable, bookmark-friendly page state; Zustand is for app-level state like auth
- React state with manual URL sync — rejected because TanStack Router already handles this declaratively

---

## R-008: Debounced Search Input

**Decision**: Implement debounced search with a 300ms delay. The search input updates local state immediately (for responsive typing), then after 300ms of inactivity, navigates with the updated `q` search param which triggers the TanStack Query fetch.

**Rationale**: 300ms is a standard debounce interval that balances responsiveness with avoiding excessive API calls. The local state + navigate pattern separates the typing experience from the search trigger, preventing input lag.

**Alternatives considered**:
- No debounce (search on every keystroke) — rejected due to excessive API calls and potential rate limiting
- 500ms debounce — rejected as too sluggish for a search experience
- Search on Enter/submit button — rejected per spec clarification (debounced as-you-type was confirmed)
