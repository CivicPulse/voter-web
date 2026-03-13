# Codebase Concerns

**Analysis Date:** 2026-03-13

## Tech Debt

**Root Layout Complexity:**
- Issue: `src/routes/__root.tsx` contains 597 lines of monolithic component logic. The component manages 15+ useMatch calls, 10+ route states, multiple data fetching hooks, and navigation context updates in a single file.
- Files: `src/routes/__root.tsx`
- Impact: Difficult to test, maintain, and debug. Changes to any route handling logic require touching this large file. High cognitive complexity makes it error-prone.
- Fix approach: Extract route detection logic into a custom hook (`useRouteDetection`), move navigation context updates to separate hook, create smaller sub-components for MobileNav and LayerBar rendering logic.

**Large Component Files:**
- Issue: Several feature components exceed 450+ lines without clear internal structure or component extraction:
  - `src/routes/voters/_components/GeocodedLocationsCard.tsx` - 466 lines
  - `src/routes/voters/_components/GeocodedLocationMap.tsx` - 457 lines
  - `src/routes/admin/elections/_components/election-table.tsx` - 430+ lines (estimated)
  - `src/components/elections/AdminCandidateDialog.tsx` - 445 lines
- Files: `src/routes/voters/_components/GeocodedLocationsCard.tsx`, `src/routes/voters/_components/GeocodedLocationMap.tsx`, `src/components/elections/AdminCandidateDialog.tsx`
- Impact: Difficult to test in isolation, high cognitive overhead, difficult to reuse logic, performance issues with re-renders.
- Fix approach: Extract internal UI logic into smaller sub-components, isolate state management hooks, move utilities to helper functions.

**Rate Limiter Lifecycle Management:**
- Issue: `src/lib/rate-limiter.ts` uses setInterval internally (ensureRefillTimer) but never explicitly checks for cleanup in SSR or dev server hot-reload scenarios.
- Files: `src/lib/rate-limiter.ts`, `src/api/rate-limited-fetch.ts`
- Impact: Potential memory leaks during dev server restarts or testing, multiple timers could accumulate if rate limiter is recreated.
- Fix approach: Add explicit cleanup in useEffect hooks, consider using AbortController pattern, ensure destroy() is called on cleanup.

## Known Bugs

**Token Refresh Race Condition:**
- Symptoms: If multiple requests fail with 401 simultaneously, the token refresh flow could execute multiple refresh cycles instead of single coordinated refresh.
- Files: `src/api/client.ts` (lines 38-62)
- Trigger: Multiple simultaneous API calls that all fail with 401 before first refresh completes
- Workaround: Current implementation uses `isRefreshing` flag, but doesn't guarantee single atomic refresh under extreme concurrency
- Fix approach: Replace flag-based approach with proper Promise-based queue or use TanStack Query's queryClient invalidation on 401.

**GeoJSON Redirect Pattern Incomplete:**
- Symptoms: `public/_redirects` file correctly excludes `/geojson/*` and `/sounds/*` from SPA redirect, but any new static asset additions could be forgotten, causing HTML served as file content.
- Files: `public/_redirects`
- Trigger: Developer adds new static files to `public/` without updating redirect rules
- Workaround: Add clear documentation in CLAUDE.md (already present) but rule ordering is fragile
- Fix approach: Implement build-time check that validates all non-html files in public/ are listed in redirects, or switch to explicit whitelist approach.

## Security Considerations

**localStorage Usage Without Validation:**
- Risk: Tokens stored in localStorage without integrity checks. If XSS occurs, tokens can be read and used by attacker.
- Files: `src/api/client.ts` (lines 17-19, 65-67), `src/stores/authStore.ts` (lines 33, 59-60)
- Current mitigation: App is strict TypeScript, no obvious XSS vectors in code, CSP headers should be on server
- Recommendations:
  - Implement token rotation strategy (already done with refresh token flow)
  - Consider storing access token in memory-only with refresh token in secure httpOnly cookie (backend change needed)
  - Add explicit origin validation before token use
  - Monitor localStorage for tampering (add checksum validation)

**Unvalidated File Uploads in Admin UI:**
- Risk: Admin features accept file uploads (voters CSV, boundary GeoJSON) without explicit file size or type validation on client side beyond form schema.
- Files: `src/routes/admin/elections/import-feed.tsx`, admin import hooks
- Current mitigation: Backend likely has size limits (100MB mentioned in CLAUDE.md), type validation via schema
- Recommendations:
  - Add explicit file size validation before upload with clear user messaging
  - Implement MIME type checking on client (not just extension)
  - Show upload progress with abort capability
  - Add hash-based integrity check after upload completes

**Error Messages Exposing Detail:**
- Risk: Delete dialog and error handlers catch and display backend error details that might expose system information.
- Files: `src/routes/admin/elections/_components/delete-election-dialog.tsx` (lines 50-54)
- Current mitigation: Only visible to authenticated admin/analyst users
- Recommendations: Sanitize backend error messages, provide generic user-facing messages, log detailed errors server-side only

## Performance Bottlenecks

**Rate Limiter Polling Interval Too Frequent:**
- Problem: Token bucket refill timer runs every 200ms (src/lib/rate-limiter.ts line 70), causing frequent refill checks even when queue is empty.
- Files: `src/lib/rate-limiter.ts` (line 70)
- Cause: Fixed 200ms interval regardless of refill interval (60 seconds), creates unnecessary CPU work
- Improvement path:
  - Calculate next required refill time and set timer only when queue needs processing
  - Use adaptive intervals based on queue length
  - Clear timer when queue empty (already partially done)
  - Consider using requestAnimationFrame for better synchronization

**Multiple Simultaneous Data Fetching in Root Layout:**
- Problem: `src/routes/__root.tsx` simultaneously fetches user role, available states, active elections, boundary types, overlays, and county/district data without dependency optimization.
- Files: `src/routes/__root.tsx` (lines 201-330)
- Cause: Multiple useQuery hooks fire independently, no request batching or dependency ordering
- Improvement path:
  - Structure fetches to depend on previous results (e.g., only fetch overlays after selecting boundary type)
  - Use TanStack Query's dependency arrays more explicitly
  - Consider prefetching on route transition, not during render
  - Add enabled guard to optional queries (already partially done)

**GeocodedLocationMap SVG Generation on Every Render:**
- Problem: `createPinSvgElement()` creates new DOM elements repeatedly without memoization (src/routes/voters/_components/GeocodedLocationMap.tsx lines 61-83).
- Files: `src/routes/voters/_components/GeocodedLocationMap.tsx`
- Cause: Called inside buildLegendDom which may be recreated on every map state change
- Improvement path: Memoize SVG elements, cache legend DOM elements, consider CSS/SVG sprite approach instead

## Fragile Areas

**Map Provider Color Palette Consistency:**
- Files: `src/lib/provider-colors.ts`, `src/components/elections/PrecinctMapView.tsx`, `src/routes/voters/_components/GeocodedLocationMap.tsx`
- Why fragile: Color definitions for map providers are scattered across multiple files. If color schemes need updating (e.g., accessibility improvements), changes must be made in multiple places.
- Safe modification: Centralize all color constants in single file with re-exports, add TypeScript validation that all providers have color mappings
- Test coverage: Likely minimal, no tests on color palette consistency

**District Slug Resolution Logic:**
- Files: `src/hooks/useDistrictSlugResolver.ts`, `src/hooks/useDistrictSlugResolverScoped.ts`, `src/lib/slugs.ts`
- Why fragile: Multiple slug resolution functions with similar logic but different implementations. If slug URL format changes, all three must be updated in sync.
- Safe modification:
  - Create single source of truth for slug-to-ID conversion logic
  - Add comprehensive tests for slug format variations
  - Consider using URL pattern matching library instead of manual parsing
- Test coverage: Critical path for navigation, should have 100% coverage but fragile due to duplication

**Admin Error Boundary Without Fallback UI:**
- Files: `src/components/admin-error-boundary.tsx`, admin route pages
- Why fragile: Error boundary catches exceptions but rendering error component might also fail, leaving user with blank screen
- Safe modification: Wrap error boundary fallback UI in try-catch, provide static HTML fallback
- Test coverage: Error boundaries are hard to test in development, likely untested

**Lake/Feature Toggle System Absent:**
- Files: Entire codebase
- Why fragile: No feature flags or config system means all admin features are always enabled if user is authenticated. Rolling back features requires code deployment.
- Safe modification: Implement simple feature flag system (even in-memory during dev, or via config endpoint)
- Test coverage: Can't test features in disabled state without code changes

## Scaling Limits

**Flat Array Processing in Data Tables:**
- Current capacity: No pagination observed in admin tables, TanStack Table used without visible virtualization
- Limit: Rendering 1000+ rows will degrade performance significantly
- Files: `src/routes/admin/elections/_components/election-table.tsx`, `src/routes/admin/users/index.tsx`
- Scaling path:
  - Implement server-side pagination via API params
  - Add client-side virtualization (React Window) for large result sets
  - Implement infinite scroll with TanStack Query integration

**GeoJSON Feature Count Unbounded:**
- Current capacity: Map overlays don't limit feature count, `src/routes/__root.tsx` line 342 shows feature.length without bounds check
- Limit: Large boundary overlays (statewide precincts) could render 10k+ features causing map lag
- Scaling path:
  - Implement vector tile serving (Mapbox/PMTiles) instead of GeoJSON
  - Add clustering for dense features
  - Implement feature simplification for zoomed-out views
  - Add render performance monitoring

**Refresh Token Polling Without Expiry Awareness:**
- Current capacity: Admin jobs poll every 3 seconds until complete, but no maximum polling duration
- Limit: Orphaned polling jobs could run indefinitely if backend response is stuck
- Files: `src/lib/hooks/use-import-jobs.ts`, `src/lib/hooks/use-export-jobs.ts`
- Scaling path: Add maximum polling duration, exponential backoff, server-sent events instead of polling

## Dependencies at Risk

**React 19.2.0 - Recent Major Version:**
- Risk: React 19 is recent (2024), ecosystem compatibility still stabilizing, experimental features present
- Impact: Plugins and integrations may have compatibility issues, types may be unstable
- Current usage: Core dependency, used throughout
- Migration plan: Monitor breaking changes in minor versions, consider staying on 19.x until 20.x is proven stable
- Action: Document React 19-specific patterns for future maintainers

**TanStack Router 1.159.5 - Rapidly Evolving:**
- Risk: Version numbers in 1.x.x ranges often indicate unstable API, rapid feature additions can introduce breaking changes
- Impact: Upgrade could require route definition changes, file structure changes
- Current usage: Core routing system, deeply integrated in file structure
- Migration plan:
  - Pin exact versions in package.json (use 1.159.5 not ^1.159.5)
  - Test thoroughly before upgrading
  - Monitor release notes for breaking changes

**Turf.js 7.3.4 - Deprecated for Some Use Cases:**
- Risk: Turf.js is being replaced by Mapbox's newer geospatial libraries in some contexts
- Impact: May not receive updates, alternatives should be evaluated
- Current usage: `@turf/bbox`, `@turf/boolean-intersects` in district/boundary logic
- Migration plan: Monitor for better-maintained alternatives, Mapbox Lib has similar functions
- Files: Any file importing @turf packages

## Missing Critical Features

**No Audit Logging for Admin Actions:**
- Problem: Admin deletions, user creation, import jobs have no audit trail. Cannot track who made what changes when.
- Blocks: Compliance requirements, forensics after data loss, regulatory requirements
- Files: All admin mutation endpoints lack logging hooks
- Priority: High - affects data governance and compliance

**No Graceful Degradation for Map Failures:**
- Problem: If Leaflet or tile layer fails to load, entire page showing map could become unusable.
- Blocks: Maps on offline connections, tile service downtime
- Files: `src/routes/voters/_components/GeocodedLocationMap.tsx`, `src/components/elections/PrecinctMapView.tsx`
- Priority: Medium - affects user experience on poor connections

**No Optimistic Updates in Admin Forms:**
- Problem: User sees loading spinner for entire request roundtrip, UX feels slow even with fast network.
- Blocks: Responsive admin UI, better perceived performance
- Files: All admin mutation hooks
- Priority: Low - functional but UX could improve

## Test Coverage Gaps

**E2E Tests Limited to Chromium:**
- What's not tested: Firefox and Safari rendering, browser-specific bugs, responsive design on real mobile devices
- Files: `playwright.config.ts`
- Risk: UI bugs in other browsers go undetected until production
- Priority: Medium - Chromium covers 65% of users but edge cases exist

**Admin Features Lack Integration Tests:**
- What's not tested: Full user creation workflow, permission denial flow, concurrent admin actions
- Files: Admin routes and hooks (minimal test coverage observed)
- Risk: Admin features could break without developer knowing
- Priority: High - admin features are business-critical

**Map Interaction Tests Missing:**
- What's not tested: Dragging marker on geocoded map, double-click district navigation, overlay toggle
- Files: `src/routes/voters/_components/GeocodedLocationMap.tsx`, map-related E2E tests
- Risk: Map interactions could break without developer knowing
- Priority: Medium - map is key user feature

**Error Handling Paths Untested:**
- What's not tested: Network error retry logic, token refresh on 401, permission error display
- Files: `src/api/client.ts`, error boundary components
- Risk: Error cases could behave unexpectedly in production
- Priority: High - error paths are critical for reliability

---

*Concerns audit: 2026-03-13*
