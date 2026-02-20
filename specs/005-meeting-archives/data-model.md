# Data Model: Meeting Archives Browser

**Feature Branch**: `005-meeting-archives` | **Date**: 2026-02-20

## Entity Overview

```
GoverningBody 1──* Meeting 1──* AgendaItem
     │                │              │
     │                │              │
     │                ├──* Attachment (meeting-level)
     │                │
     │                └──* AgendaItem ──* Attachment (item-level)
     │
     └── slug (URL-friendly identifier)
```

## Entities

### GoverningBody

Represents a local government entity that holds meetings (e.g., school board, county commission, city council).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `name` | `string` | Yes | Display name (e.g., "Bibb County Board of Education") |
| `slug` | `string` | Yes | URL-friendly name (e.g., "bibb-county-boe") |
| `body_type` | `GoverningBodyType` | Yes | Type enum: `school_board`, `county_commission`, `city_council`, `planning_commission`, `other` |
| `jurisdiction_state` | `string` | Yes | State abbreviation (e.g., "GA") |
| `jurisdiction_county` | `string \| null` | No | County name if county-level body (null for state-level) |
| `website_url` | `string \| null` | No | Official website URL |
| `meeting_count` | `number` | Yes | Total number of archived meetings |
| `created_at` | `string` (ISO 8601) | Yes | Record creation timestamp |
| `updated_at` | `string` (ISO 8601) | Yes | Last update timestamp |

**Validation Rules**:
- `slug` must be unique across all governing bodies
- `slug` is lowercase, hyphenated, alphanumeric only
- `jurisdiction_state` must be a valid US state abbreviation
- `website_url` must be a valid URL when present

**Relationships**:
- Has many `Meeting` records

---

### Meeting

Represents a specific session held by a governing body.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `governing_body_id` | `string` (UUID) | Yes | Parent governing body reference |
| `governing_body` | `GoverningBodySummary` | Yes | Embedded summary (name, slug, body_type) |
| `date` | `string` (YYYY-MM-DD) | Yes | Meeting date |
| `time` | `string \| null` | No | Meeting start time (HH:MM format, local time) |
| `meeting_type` | `MeetingType` | Yes | Type enum: `regular`, `special`, `work_session`, `emergency`, `public_hearing`, `other` |
| `location` | `string \| null` | No | Physical meeting location |
| `status` | `MeetingStatus` | Yes | Status enum: `scheduled`, `completed`, `cancelled` |
| `video_url` | `string \| null` | No | YouTube or Vimeo video URL |
| `sequence` | `number` | Yes | 1-based sequence number per body per date (for URL uniqueness) |
| `agenda_item_count` | `number` | Yes | Number of agenda items |
| `attachments` | `Attachment[]` | Yes | Meeting-level file attachments |
| `created_at` | `string` (ISO 8601) | Yes | Record creation timestamp |
| `updated_at` | `string` (ISO 8601) | Yes | Last update timestamp |

**Validation Rules**:
- `date` must be a valid ISO date string
- `sequence` must be ≥ 1; unique within (governing_body_id, date) tuple
- `video_url` must be a valid YouTube or Vimeo URL when present
- `meeting_type` defaults to `regular`
- `status` defaults to `scheduled`

**State Transitions** (status):
```
scheduled → completed
scheduled → cancelled
```

**Relationships**:
- Belongs to `GoverningBody`
- Has many `AgendaItem` records
- Has many `Attachment` records (meeting-level)

---

### AgendaItem

Represents an individual topic or action item discussed during a meeting.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `meeting_id` | `string` (UUID) | Yes | Parent meeting reference |
| `order` | `number` | Yes | Display order / sequence number |
| `title` | `string` | Yes | Agenda item title |
| `description` | `string \| null` | No | Detailed description / content |
| `action_taken` | `string \| null` | No | Action taken on this item (e.g., "Approved 5-2") |
| `disposition` | `AgendaItemDisposition \| null` | No | Outcome enum: `approved`, `denied`, `tabled`, `withdrawn`, `no_action`, `informational` |
| `video_timestamp` | `number \| null` | No | Seconds into the video recording when this item was discussed |
| `attachments` | `Attachment[]` | Yes | Item-level file attachments |

**Validation Rules**:
- `order` must be ≥ 1; unique within a meeting
- `video_timestamp` must be ≥ 0 when present (seconds)
- `title` must not be empty

**Relationships**:
- Belongs to `Meeting`
- Has many `Attachment` records (item-level)

---

### Attachment

Represents a file associated with a meeting or agenda item.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `filename` | `string` | Yes | Original filename |
| `file_type` | `string` | Yes | MIME type (e.g., "application/pdf", "image/png") |
| `file_size` | `number` | Yes | File size in bytes |
| `download_url` | `string` | Yes | Direct download URL |

**Validation Rules**:
- `filename` must not be empty
- `file_size` must be > 0
- `download_url` must be a valid URL

---

### SearchResult

Represents a matched item from a search query. This is a read-only view type, not a persisted entity.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agenda_item_id` | `string` (UUID) | Yes | Matched agenda item ID |
| `agenda_item_title` | `string` | Yes | Agenda item title |
| `agenda_item_order` | `number` | Yes | Agenda item order in meeting |
| `meeting_id` | `string` (UUID) | Yes | Parent meeting ID |
| `meeting_date` | `string` | Yes | Meeting date |
| `meeting_sequence` | `number` | Yes | Meeting sequence number |
| `governing_body_id` | `string` (UUID) | Yes | Governing body ID |
| `governing_body_name` | `string` | Yes | Governing body display name |
| `governing_body_slug` | `string` | Yes | Governing body URL slug |
| `snippet` | `string` | Yes | Text snippet with `<mark>` highlighted matches |
| `relevance_score` | `number` | Yes | Search relevance score (higher = more relevant) |

---

## Enums

### GoverningBodyType
```typescript
type GoverningBodyType =
  | "school_board"
  | "county_commission"
  | "city_council"
  | "planning_commission"
  | "other"
```

### MeetingType
```typescript
type MeetingType =
  | "regular"
  | "special"
  | "work_session"
  | "emergency"
  | "public_hearing"
  | "other"
```

### MeetingStatus
```typescript
type MeetingStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
```

### AgendaItemDisposition
```typescript
type AgendaItemDisposition =
  | "approved"
  | "denied"
  | "tabled"
  | "withdrawn"
  | "no_action"
  | "informational"
```

## Summary Types

### GoverningBodySummary

Embedded in Meeting responses to avoid extra API calls.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Governing body ID |
| `name` | `string` | Display name |
| `slug` | `string` | URL slug |
| `body_type` | `GoverningBodyType` | Body type |

## Display Labels

The frontend will map enum values to human-readable labels:

```typescript
const bodyTypeLabels: Record<GoverningBodyType, string> = {
  school_board: "School Board",
  county_commission: "County Commission",
  city_council: "City Council",
  planning_commission: "Planning Commission",
  other: "Other",
}

const meetingTypeLabels: Record<MeetingType, string> = {
  regular: "Regular Meeting",
  special: "Special Meeting",
  work_session: "Work Session",
  emergency: "Emergency Meeting",
  public_hearing: "Public Hearing",
  other: "Other",
}

const meetingStatusLabels: Record<MeetingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
}

const dispositionLabels: Record<AgendaItemDisposition, string> = {
  approved: "Approved",
  denied: "Denied",
  tabled: "Tabled",
  withdrawn: "Withdrawn",
  no_action: "No Action",
  informational: "Informational",
}
```
