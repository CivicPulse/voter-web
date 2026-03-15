# Administrator Guide

A guide for administrators and analysts managing CivicPulse Voter Data Explorer.

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access: user management, elections, imports, exports, geocoding, analysis |
| **Analyst** | Data operations: elections, imports, exports, geocoding, analysis; can view users |
| **Viewer** | Read-only access to voter data; no admin panel |

Role changes take effect immediately — the admin navigation appears or disappears without page refresh.

---

## Admin Dashboard

Access the admin panel via the **Admin** menu in the navigation bar (visible only to admin and analyst roles).

Admin sections:
- `/admin` — Dashboard overview
- `/admin/users` — User management
- `/admin/elections` — Election management
- `/admin/imports` — Data imports
- `/admin/exports` — Data exports
- `/admin/geocoding` — Batch geocoding
- `/admin/analysis` — District mismatch analysis

---

## User Management

> Admin role required for creating users.

### Viewing Users

Navigate to **Admin > Users** to see all registered users with their roles, email addresses, and account status.

### Creating Users

1. Click **Create User**
2. Fill in username, email, password, and role
3. For **admin** or **analyst** roles: a confirmation dialog appears to verify the elevated access
4. For **viewer** role: the user is created immediately (no confirmation needed)

### Inviting Users

Administrators can send email invitations that allow new users to create their own accounts:

1. Navigate to **Admin > Users**
2. Click **Invite User**
3. Enter the invitee's email address and select their role
4. The system sends an invitation link

Pending invitations are listed in a separate table on the users page. Invited users complete registration at `/invite/accept`.

---

## Election Management

### Viewing Elections

Navigate to **Admin > Elections** to see all elections with their dates, types, status, and data source.

The table supports sorting and filtering. A source badge indicates whether each election was manually created or imported from the SOS feed.

### Creating Elections

1. Click **Create Election**
2. Fill in the election form:
   - Election date
   - Election type (General, Primary, Runoff, Special)
   - Name/description
   - Boundary scope (state or specific county)
3. Review the confirmation dialog
4. Click **Confirm** to create

### Editing Elections

Click an election row to open its detail page where you can modify fields and save changes.

### Importing from SOS Feed

To import elections from the Georgia Secretary of State results feed:

1. Navigate to **Admin > Elections**
2. Click **Import from SOS Feed**
3. The system fetches available elections from `results.sos.ga.gov`
4. Select which elections to import
5. Imported elections include candidate data and county/precinct-level results

### Deleting Elections

1. Open the election detail page
2. Click **Delete Election**
3. Confirm the deletion in the dialog

---

## Data Imports

### Supported Import Types

| Type | Format | Description |
|------|--------|-------------|
| Voter Data | CSV | Voter registration records |
| Boundaries | GeoJSON or ZIP | Geographic boundary data (counties, districts) |

### Uploading Files

1. Navigate to **Admin > Imports**
2. Click the appropriate upload button (Voter CSV or Boundary GeoJSON/ZIP)
3. Select a file from your computer
4. The system validates the file:
   - **File type:** Must match expected format (CSV for voters, GeoJSON/JSON/ZIP for boundaries)
   - **File size:** Maximum 100 MB
5. Review the confirmation dialog showing file name, size, and type
6. Click **Upload** to start the import

### Monitoring Import Jobs

After upload, the import appears in the job list with a status indicator:

| Status | Description |
|--------|-------------|
| **Pending** | Queued for processing |
| **Processing** | Currently being imported |
| **Completed** | Successfully imported |
| **Failed** | Import failed (check error message) |

The job list **automatically refreshes every 3 seconds** while any job is pending or processing. Polling stops automatically when all jobs reach a terminal state (completed or failed).

### Retrying Failed Imports

If an import fails, click the **Retry** button on the failed job row to re-attempt the import with the same file.

---

## Data Exports

### Requesting an Export

1. Navigate to **Admin > Exports**
2. Click **Request Export**
3. Choose the export type:
   - **Voter Data** — voter registration records
   - **Boundary Data** — geographic boundaries
   - **Full Database** — complete data dump
4. Configure any filters (date range, county, etc.)
5. Submit the request

### Monitoring Export Jobs

Export jobs follow the same status pattern as imports (Pending → Processing → Completed/Failed) with automatic polling.

### Downloading Exports

Once an export job reaches **Completed** status, a **Download** button appears. Click it to download the exported file.

---

## Batch Geocoding

Navigate to **Admin > Geocoding** to manage address geocoding operations.

### Dashboard

The geocoding page shows:
- **Provider List** — available geocoding services with their status and request counts
- **Cache Statistics** — hit rate, total cached addresses, cache size
- **Job History** — list of past and current geocoding jobs with filters

### Triggering a Geocoding Job

1. Click **Trigger Geocode**
2. Configure the job:
   - Scope (all ungeocoded voters, specific county, etc.)
   - Provider preference
3. Confirm and start the job

### Monitoring Progress

Active geocoding jobs show a progress card with:
- Total addresses to process
- Addresses completed
- Success/failure counts
- Estimated time remaining

---

## District Mismatch Analysis

Navigate to **Admin > Analysis** to identify voters whose registered address doesn't match their assigned district.

### Running an Analysis

1. Click **Trigger Analysis**
2. The system compares voter addresses against district boundary data
3. A new analysis run appears in the list

### Reviewing Results

Click a completed analysis run to see:
- **Summary Cards** — total voters analyzed, mismatches found, match rate
- **Results Table** — individual voter records with mismatch details, sortable and filterable

---

## Job Monitoring

All long-running operations (imports, exports, geocoding, analysis) use the same job monitoring pattern:

- **Auto-polling:** The job list refreshes every 3 seconds while any job is active
- **Auto-stop:** Polling stops when all visible jobs are completed or failed
- **Resilient:** If a network error occurs during polling, a warning appears but the page continues to show the last known data and retries

### Session Handling During Jobs

- If your session expires while monitoring a job, a toast notification appears with a login button
- The job continues processing on the server regardless of your session state
- After re-authenticating, the job list resumes with current status

---

## Troubleshooting

### "Session expired" during admin operations

Your JWT token has expired. Click **Log in** in the notification to re-authenticate. Any in-progress server-side jobs (imports, exports, geocoding) continue running.

### "Access denied" error

Your role may have been changed by another admin. The admin navigation will disappear automatically. Contact another administrator to verify your role.

### Import fails immediately

- Check that the file format matches the expected type (CSV for voters, GeoJSON/ZIP for boundaries)
- Verify the file is under 100 MB
- Ensure the file isn't corrupted (try opening it locally)

### Import completes but data is missing

- Check the import job's detail/error message for row-level errors
- Verify the CSV column headers match the expected schema
- For boundary imports, ensure the GeoJSON contains valid geometry

### Export stays in "Pending" state

- The server may be processing a large backlog — exports are queued
- Check the API server status
- If stuck for more than 30 minutes, contact your system administrator

### Geocoding shows low success rate

- Check the provider status on the geocoding dashboard
- Some providers may have rate limits or be temporarily unavailable
- Verify that voter addresses are properly formatted
