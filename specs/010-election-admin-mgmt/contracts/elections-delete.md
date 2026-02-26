# API Contract: Delete Election

**Endpoint**: `DELETE /api/v1/elections/{election_id}`
**Auth**: Bearer token required; admin role required
**New endpoint** — must be added to voter-api

---

## Request

```
DELETE /api/v1/elections/{election_id}
Authorization: Bearer {access_token}
```

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `election_id` | path | UUID string | Yes | ID of the election to delete |

No request body.

---

## Responses

### 204 No Content — Success

The election was deleted successfully.

```
HTTP/1.1 204 No Content
```

No response body.

---

### 404 Not Found

The election does not exist.

```json
{
  "detail": "Election not found"
}
```

---

### 409 Conflict — Cannot Delete

The election has associated data (results, participants, etc.) that prevents deletion, or another business rule was violated.

```json
{
  "detail": "Cannot delete election with associated results. Finalize the election instead."
}
```

The frontend displays this message inline in the confirmation dialog (FR-007).

---

### 403 Forbidden

The authenticated user does not have the admin role.

```json
{
  "detail": "Insufficient permissions"
}
```

---

### 401 Unauthorized

Token missing or expired.

```json
{
  "detail": "Not authenticated"
}
```

---

## Frontend Usage

```typescript
// src/lib/api/elections.ts
export async function deleteElection(electionId: string): Promise<void> {
  await api.delete(`elections/${electionId}`)
  // 204 → no body to parse; void return
}
```

The `useDeleteElection` mutation hook:
- On 204 success → invalidate `["admin", "elections"]` and `["elections"]` queries → success toast
- On 409 → extract `detail` message → pass to dialog for inline display (no toast)
- On 401/403 → toast error (consistent with other admin hooks)
- On network error → toast warning
