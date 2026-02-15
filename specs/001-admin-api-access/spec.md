# Feature Specification: Admin API Access

**Feature Branch**: `001-admin-api-access`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "logged in admins need a way to make use of admin endpoints in the API"

## Clarifications

### Session 2026-02-14

- Q: Which admin operation categories should be included in the initial implementation? → A: User management (list users, create users) AND Import + Export operations (trigger/monitor voter imports, boundary imports, and data exports)
- Q: Should the UI support multiple admin role levels with different capabilities, or focus on a single admin role? → A: The UI should follow the API's role system - user roles and access permissions are determined by the API, and the UI should dynamically adapt to whatever role information the API provides
- Q: Should the UI require confirmation before executing sensitive admin operations? → A: Confirm before triggering import jobs and creating users with elevated roles (admin/analyst), but not for viewing lists or monitoring jobs
- Q: How should the UI update job status information to keep it current? → A: Auto-polling every 3-5 seconds when viewing active jobs (pending/processing), stop polling when jobs complete or fail
- Q: Should the UI validate uploaded files before sending them to the API? → A: Basic validation only - check file type (CSV for voters, GeoJSON/shapefile for boundaries) and file size limits, rely on API for content validation
- Q: What maximum file size should the UI enforce before allowing an upload? → A: 100MB maximum - accommodates large voter/boundary files while preventing excessive uploads
- Q: Should users be able to retry failed import or export jobs? → A: Allow retry for imports only (requires re-uploading file), not for exports (just create new export request)
- Q: How should the UI handle empty states (no users, no jobs) in admin pages? → A: Helpful empty state - display descriptive message with guidance and primary action button (e.g., "No users yet. Create your first user to get started" with Create User button)
- Q: How should admin features be organized in the application's navigation? → A: Dedicated "Admin" section in main navigation with submenu for User Management, Imports, and Exports
- Q: What information should be displayed for each job in the imports and exports lists? → A: Standard - job ID, filename/type, status, start time, completion/error time, error message (if failed), and action buttons (retry/download)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Admin Dashboard (Priority: P1)

An admin user logs in and needs to access administrative functions that are not available to regular users. The system should recognize their admin role and provide access to admin-specific features.

**Why this priority**: This is the foundation for all admin functionality. Without the ability to access admin features, no admin operations can be performed. This delivers immediate value by exposing admin capabilities.

**Independent Test**: Can be fully tested by logging in as an admin user and verifying that admin-specific navigation, pages, or UI elements are visible and accessible. Delivers value by confirming role-based access control is working.

**Acceptance Scenarios**:

1. **Given** an admin user is logged in, **When** they navigate to the application, **Then** they see an "Admin" section in the main navigation
2. **Given** an admin user clicks on the Admin section, **When** the submenu opens, **Then** they see User Management, Imports, and Exports menu items
3. **Given** a non-admin user is logged in, **When** they navigate to the application, **Then** they do not see the Admin section in the main navigation
4. **Given** an admin user clicks on a submenu item (e.g., User Management), **When** the page loads, **Then** they are taken to the corresponding admin page without errors

---

### User Story 2 - Perform Admin Operations (Priority: P2)

An admin user needs to perform administrative operations through the UI, specifically: (1) user management - listing all users and creating new users with role assignments, and (2) data operations - triggering and monitoring voter imports, boundary imports, and data exports.

**Why this priority**: This builds on P1 by enabling the core admin workflows. User management allows admins to onboard new team members and manage access. Import/export operations enable the primary data ingestion and extraction workflows. Together, these deliver immediate operational value.

**Independent Test**: Can be tested by navigating to the user management page and creating a new user, then navigating to the imports page and triggering a voter import. Delivers value by confirming both user management and data pipeline admin endpoints are accessible through the UI.

**Acceptance Scenarios**:

1. **Given** an admin user is on the user management page with no users in the system, **When** they view the page, **Then** they see a helpful empty state with guidance text and a Create User button
2. **Given** an admin user is on the user management page, **When** they view the user list, **Then** they see all system users with their roles and status (no confirmation required)
3. **Given** an admin user is on the user creation page, **When** they submit a new user form with an elevated role (admin/analyst), **Then** they see a confirmation dialog showing the role being assigned
4. **Given** an admin user confirms the user creation, **When** the confirmation is accepted, **Then** the user is created and they receive confirmation
5. **Given** an admin user is on the imports page with no import jobs, **When** they view the page, **Then** they see a helpful empty state explaining imports with an Upload Import button
6. **Given** an admin user is on the imports page, **When** they upload a voter CSV file, **Then** they see a confirmation dialog showing file details before the import is triggered
7. **Given** an admin user confirms the import, **When** the confirmation is accepted, **Then** the import job is created and they can monitor its progress
8. **Given** an admin user is on the exports page with no export jobs, **When** they view the page, **Then** they see a helpful empty state explaining exports with a Create Export button
9. **Given** an admin user is on the exports page, **When** they request a data export, **Then** the export job is created and they can monitor its status and download the completed file (no confirmation required for export requests)
10. **Given** an import job has failed, **When** the admin user views the failed job, **Then** they see detailed error information and a retry option to upload a corrected file
11. **Given** an export job has failed, **When** the admin user views the failed job, **Then** they see error information but no retry option (they can create a new export request)
12. **Given** a non-admin user attempts to access any admin operation page directly via URL, **When** the page loads, **Then** they are redirected or shown an access denied message

---

### User Story 3 - Handle Permission Errors Gracefully (Priority: P3)

An admin user's session may expire, or their role may change during their session. The system should handle permission errors clearly and guide the user appropriately.

**Why this priority**: This improves the user experience by handling edge cases gracefully. It's lower priority because it doesn't block core admin functionality but enhances the robustness of the feature.

**Independent Test**: Can be tested by simulating permission errors (expired token, role change) and verifying that the UI provides clear feedback and appropriate actions.

**Acceptance Scenarios**:

1. **Given** an admin user's session expires, **When** they attempt an admin operation, **Then** they see a clear message indicating their session has expired and are prompted to log in again
2. **Given** an admin user's role is changed to non-admin, **When** they attempt to access admin features, **Then** they see an access denied message and admin UI elements are hidden
3. **Given** an admin operation fails due to permissions, **When** the error is returned, **Then** the user sees a clear, actionable error message

---

### Edge Cases

- What happens when an admin user's session expires during an admin operation?
- How does the system handle an admin user whose role is changed from admin to non-admin while they are logged in?
- What happens if the API returns a permission denied error for an admin user?
- How does the system behave if an admin user attempts to access an admin page by directly entering the URL?
- What happens if concurrent admin operations conflict with each other?
- How does the system handle network errors during admin operations?
- What happens if a user cancels a confirmation dialog after selecting a file for import?
- How does the system handle file uploads that pass client-side validation but fail API content validation?
- What happens if job status polling fails due to network issues or API errors?
- How does the system behave if a user navigates away from the jobs page while an import is in progress?
- How does the system handle files larger than 100MB when a user attempts to upload them?
- What information is displayed when a file is rejected for exceeding the size limit?
- What happens when a user retries a failed import - is the old job updated or a new job created?
- How are failed job details displayed to help users diagnose and fix issues?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST retrieve the logged-in user's role from the API and dynamically show or hide UI elements based on API-provided permissions
- **FR-002**: System MUST provide a dedicated "Admin" section in the main navigation with submenu items for User Management, Imports, and Exports (visible only to users with appropriate permissions)
- **FR-003**: System MUST prevent non-admin users from accessing admin pages or features through navigation or direct URL entry, redirecting to home page or showing an access denied message
- **FR-004**: System MUST include the user's authentication token when calling admin API endpoints
- **FR-005**: System MUST provide UI for user management operations: listing all users and creating new users with role assignments
- **FR-006**: System MUST provide UI for import operations: uploading voter CSV files, uploading boundary files (shapefile or GeoJSON), and monitoring import job status and progress. Import job lists MUST display: job ID, filename/import type, status, start time, completion/error time (if applicable), error message (if failed), and retry button (if failed)
- **FR-007**: System MUST provide UI for export operations: requesting data exports, monitoring export job status, and downloading completed export files. Export job lists MUST display: job ID, export type, status, start time, completion/error time (if applicable), error message (if failed), and download button (if completed)
- **FR-008**: System MUST display import and export job states clearly (pending, processing, completed, failed)
- **FR-009**: System MUST allow admin users to upload files for import operations through the UI
- **FR-010**: System MUST display clear error messages when admin operations fail due to permission errors
- **FR-011**: System MUST hide or disable UI elements when the user's API-provided role does not grant access to those features
- **FR-012**: System MUST handle authentication token expiration gracefully during admin operations
- **FR-013**: ~~System MUST redirect or show access denied when non-admin users attempt to access admin URLs directly~~ *[MERGED INTO FR-003]*
- **FR-014**: System MUST provide progress indicators or status updates for long-running import and export jobs
- **FR-015**: System MUST display a confirmation dialog before triggering voter or boundary import jobs, showing file details and expected impact
- **FR-016**: System MUST display a confirmation dialog when creating users with elevated roles (admin or analyst), clearly showing the role being assigned
- **FR-017**: System MUST NOT require confirmation for read-only operations (viewing user lists, viewing job status, downloading completed exports)
- **FR-018**: System MUST automatically poll for job status updates every 4 seconds when viewing active import or export jobs (pending or processing state)
- **FR-019**: System MUST stop polling when all displayed jobs reach a terminal state (completed or failed)
- **FR-020**: System MUST handle polling failures gracefully without disrupting the user experience
- **FR-021**: System MUST validate file type before upload: CSV files for voter imports, GeoJSON or ZIP archives (containing shapefiles) for boundary imports. Shapefile ZIP archives MUST contain at minimum a .shp file. File type validation MUST accept .csv, .geojson, and .zip extensions
- **FR-022**: System MUST validate file size before upload and reject files exceeding 100MB with a clear error message indicating the size limit
- **FR-023**: System MUST display validation errors immediately when a user selects an invalid file (wrong type or too large)
- **FR-024**: System MUST rely on API for content validation (CSV structure, GeoJSON validity, data integrity) and display API validation errors clearly
- **FR-025**: System MUST provide a retry option for failed import jobs that allows the user to upload a corrected file
- **FR-026**: System MUST NOT provide a retry option for failed export jobs - users should create a new export request instead
- **FR-027**: System MUST display detailed error information for failed jobs to help users understand what went wrong and how to fix it
- **FR-028**: System MUST display a helpful empty state when no users exist, including a descriptive message, guidance text, and a prominent Create User action button
- **FR-029**: System MUST display a helpful empty state when no import jobs exist, including a message explaining imports and a prominent Upload Import action button
- **FR-030**: System MUST display a helpful empty state when no export jobs exist, including a message explaining exports and a prominent Create Export action button

### Key Entities

- **Admin User**: A user with admin role/permissions who is authenticated and authorized to access admin endpoints
- **Admin Operation**: An action performed through the UI that calls an admin-specific API endpoint. Specifically includes: (1) User Management - listing users (GET /users), creating users (POST /users); (2) Import Operations - uploading voter data (POST /imports/voters), uploading boundary files (POST /imports/boundaries), monitoring import jobs (GET /imports, GET /imports/{job_id}); (3) Export Operations - requesting data exports (POST /exports), monitoring export jobs (GET /exports, GET /exports/{job_id}), downloading completed exports (GET /exports/{job_id}/download)
- **Permission Error**: An error response from the API indicating insufficient permissions or expired authentication
- **Import Job**: An asynchronous background task that processes uploaded voter or boundary data files. Jobs have states (pending, processing, completed, failed) and can be monitored for progress. Displayed attributes include: job ID, filename, import type (voter/boundary), status, start time, completion/error time, error message (if failed)
- **Export Job**: An asynchronous background task that generates a bulk data export file. Jobs have states (pending, processing, completed, failed) and provide a download link when completed. Displayed attributes include: job ID, export type, status, start time, completion/error time, error message (if failed), download link (if completed)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin users can successfully access all admin features (user management, imports, exports) within 2 clicks from the main navigation (click Admin → click specific feature)
- **SC-002**: 100% of specified admin API endpoints (user list/create, voter/boundary imports, data exports) are accessible through the UI for users with admin role
- **SC-003**: Non-admin users receive clear access denied messages within 1 second when attempting to access admin features
- **SC-004**: Admin operations (user creation, import/export job creation) complete successfully 95% of the time when the user has valid permissions
- **SC-005**: Users receive actionable error messages within 2 seconds when admin operations fail due to permission errors
- **SC-006**: Admin UI elements are hidden or disabled within 1 second when user role changes from admin to non-admin
- **SC-007**: Import and export job status updates automatically within 3-5 seconds of state changes when viewing the jobs page
- **SC-008**: Admins can successfully create a new user and see them in the user list within 3 seconds of form submission
- **SC-009**: Polling stops automatically when all visible jobs reach terminal states (completed/failed), reducing unnecessary API calls
- **SC-010**: File validation errors (wrong type, exceeds 100MB) are displayed within 1 second of file selection, before any upload attempt
- **SC-011**: Failed import jobs display actionable error information and a retry option within the job details view
- **SC-012**: Empty states for user list, imports list, and exports list provide clear guidance and action buttons to help users get started
- **SC-013**: Job lists (imports and exports) display all essential job information (ID, filename/type, status, timestamps, errors) to enable effective monitoring without requiring users to click into job details

## Assumptions

- The voter-api backend already has admin-specific endpoints implemented and secured with role-based access control
- The authentication system (JWT) includes user role information in the access token or provides a user profile endpoint that returns the authenticated user's role
- The API enforces all permission checks on the backend - the UI role-based display is for user experience only, not security
- User roles and their associated permissions are defined and managed entirely by the API backend
- The existing `ky` HTTP client configuration in `src/api/client.ts` automatically includes the JWT token from localStorage for API requests
- The API returns consistent permission error responses (e.g., 403 Forbidden) when a user attempts an operation they don't have permission for
