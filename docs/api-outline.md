# Connected Worker - JSA/JSO Platform: API Outline

Base URL: `/api/v1`

## Authentication

### POST /auth/login
Login and receive JWT tokens.
- **Request**: `{ email: string, password: string }`
- **Response**: `{ accessToken: string, refreshToken: string, user: UserDTO }`

### POST /auth/refresh
Refresh access token.
- **Request**: `{ refreshToken: string }`
- **Response**: `{ accessToken: string }`

### POST /auth/logout
Invalidate refresh token.
- **Headers**: `Authorization: Bearer <token>`

### GET /auth/me
Get current user profile.
- **Response**: `UserDTO`

---

## Users (Admin only)

### GET /users
List users with pagination and filtering.
- **Query**: `?page=1&limit=20&role=TECHNICIAN&business_unit=Marine&search=john`
- **Response**: `{ data: UserDTO[], total: number, page: number, limit: number }`

### POST /users
Create a new user.
- **Request**: `{ email, password, firstName, lastName, role, businessUnit?, site? }`
- **Response**: `UserDTO` (201)

### GET /users/:id
Get user by ID.

### PATCH /users/:id
Update user.
- **Request**: Partial `{ firstName?, lastName?, role?, businessUnit?, site?, isActive? }`

### DELETE /users/:id
Soft-delete (deactivate) user.

---

## JSAs

### GET /jsas
List JSAs with filtering, sorting, pagination.
- **Query**: `?page=1&limit=20&status=SUBMITTED&job_type=Work+at+Height&business_unit=Marine&created_by=uuid&strength_score_min=3&date_from=2024-01-01&date_to=2024-12-31&sort=created_at&order=desc`
- **Response**: `{ data: JSASummaryDTO[], total, page, limit }`
- **Access**: All authenticated (Technicians see own, Supervisors/HSE/Admin see all)

### POST /jsas
Create a new JSA (draft).
- **Request**:
```json
{
  "jobType": "Work with Electricity",
  "location": "Site A - Building 3",
  "businessUnit": "Field Service",
  "dateOfWork": "2024-03-15",
  "workOrder": "WO-12345",
  "crewMembers": ["John Doe", "Jane Smith"],
  "jobDescription": "Electrical panel maintenance",
  "hazards": [
    {
      "category": "Work with Electricity",
      "description": "Electrical shock from live panel",
      "riskLevel": "HIGH",
      "details": "Panel rated at 480V",
      "lotoRequired": true,
      "lotoVerified": true,
      "lotoNumber": "L-4521",
      "mitigations": [
        { "description": "LOTO applied and verified", "notes": "Lock #L-4521" },
        { "description": "Insulated tools used" },
        { "description": "Voltage testing before work" }
      ]
    }
  ],
  "ppeChecklist": [
    { "ppeType": "hard_hat", "label": "Hard Hat", "isChecked": true, "isRequired": true },
    { "ppeType": "safety_glasses", "label": "Safety Glasses", "isChecked": true, "isRequired": true },
    { "ppeType": "face_shield", "label": "Face Shield", "isChecked": true, "isRequired": true }
  ],
  "additionalNotes": "Panel last serviced 6 months ago"
}
```
- **Response**: `JSADetailDTO` (201)
- **Access**: Technician

### GET /jsas/:id
Get full JSA detail including hazards, mitigations, PPE, attachments, events.
- **Response**: `JSADetailDTO`

### PATCH /jsas/:id
Update a draft JSA.
- **Access**: Technician (own, status=DRAFT only)

### POST /jsas/:id/submit
Submit JSA for review. Triggers strength score calculation.
- **Response**: `JSADetailDTO` with calculated `strengthScore`
- **Access**: Technician (own, status=DRAFT)

### POST /jsas/:id/approve
Approve a submitted JSA. Creates immutable snapshot.
- **Request**: `{ comments?: string }`
- **Access**: Supervisor, HSE

### POST /jsas/:id/reject
Reject a submitted JSA.
- **Request**: `{ comments: string }` (comments required)
- **Access**: Supervisor, HSE

### POST /jsas/:id/close
Close an approved JSA or a stopped JSA (after JSO completed).
- **Access**: Supervisor, HSE

### POST /jsas/:id/signature
Upload digital signature for JSA.
- **Request**: `{ signatureData: string }` (base64)
- **Access**: Technician (own)

---

## Events (Flags & Stop-Jobs)

### GET /jsas/:jsaId/events
List events for a JSA.
- **Response**: `EventDTO[]`

### POST /jsas/:jsaId/flags
Create a flag on a JSA.
- **Request**: `{ flagType: "ASSISTANCE"|"CONCERN"|"INFORMATION", reason: string }`
- **Response**: `EventDTO` (201)
- **Side effects**: Email notification to Supervisor/HSE
- **Access**: Technician

### POST /jsas/:jsaId/stop-job
Trigger a stop-job on a JSA.
- **Request**: `{ reason: string, severity: "MINOR"|"MAJOR"|"CRITICAL" }`
- **Response**: `{ event: EventDTO, jso: JSODetailDTO }` (201)
- **Side effects**: JSA status -> STOPPED, auto-create JSO, email notification
- **Access**: Technician

### PATCH /events/:id/acknowledge
Acknowledge a flag.
- **Access**: Supervisor, HSE

### PATCH /events/:id/resolve
Resolve a flag or stop-job event.
- **Request**: `{ resolutionNotes: string }`
- **Access**: Supervisor, HSE

---

## JSOs (Job Safety Observations)

### GET /jsos
List JSOs with filtering.
- **Query**: `?status=PENDING&assigned_to=uuid&page=1&limit=20`
- **Response**: `{ data: JSOSummaryDTO[], total, page, limit }`
- **Access**: Supervisor, HSE, Admin

### GET /jsos/:id
Get JSO detail.

### PATCH /jsos/:id
Update JSO (fill in observation).
- **Request**:
```json
{
  "rootCause": "Frayed wiring discovered behind panel",
  "correctiveActions": "Replaced damaged wiring, re-tested circuit",
  "preventiveActions": "Added quarterly inspection to maintenance schedule",
  "resolutionNotes": "Area safe to resume work"
}
```
- **Access**: Supervisor, HSE (assigned)

### POST /jsos/:id/complete
Mark JSO as completed.
- **Request**: `{ observerSignature: string }` (base64)
- **Side effects**: Linked JSA eligible for closure, notification to Technician
- **Access**: Supervisor, HSE

---

## Attachments

### POST /attachments
Upload a file (multipart/form-data).
- **Request**: `file` (multipart), `entityType` (JSA|JSO|FLAG|STOP_JOB), `entityId`, `category?`
- **Validation**: JPEG/PNG/PDF only, max 10MB
- **Response**: `AttachmentDTO` (201)

### GET /attachments/:id
Download a file.

### DELETE /attachments/:id
Delete an attachment (own uploads, draft status only).

---

## Reports & Dashboard

### GET /dashboard/summary
Dashboard summary counts.
- **Response**:
```json
{
  "jsaCounts": { "draft": 5, "submitted": 12, "approved": 45, "rejected": 3, "stopped": 2, "closed": 30 },
  "openFlags": 4,
  "pendingJSOs": 2,
  "avgStrengthScore": 3.7,
  "todaySubmissions": 8
}
```
- **Access**: Supervisor, HSE, Admin

### GET /reports/strength-score-trend
Strength score trend over time.
- **Query**: `?period=weekly|monthly&from=2024-01-01&to=2024-12-31&business_unit=Marine`
- **Response**: `{ data: [{ period: string, avgScore: number, count: number }] }`

### GET /reports/hazard-frequency
Hazard frequency breakdown.
- **Query**: `?from=2024-01-01&to=2024-12-31&business_unit=Marine`
- **Response**: `{ data: [{ category: string, count: number, byUnit: { [unit]: number } }] }`

### GET /reports/status-distribution
JSA status distribution.
- **Query**: `?from=&to=&business_unit=`
- **Response**: `{ data: [{ status: string, count: number }] }`

### GET /reports/leading-indicators
Leading safety indicators.
- **Response**: `{ hazardIdentificationRate, ppeComplianceRate, proactiveFlagCount, avgTimeToReview }`

### GET /reports/lagging-indicators
Lagging safety indicators.
- **Response**: `{ stopJobFrequency, rejectionRate, overdueJSOCount, avgResolutionTime }`

---

## Exports

### GET /exports/jsas
Export JSA records as CSV or JSON.
- **Query**: `?format=csv|json&from=&to=&status=&business_unit=`
- **Response**: File download (CSV) or JSON array

### GET /exports/jsos
Export JSO records.
- **Query**: `?format=csv|json&from=&to=`

---

## Config (Admin)

### GET /config/:configType
Get rules configuration.
- **Params**: configType = `job_types | hazard_catalog | ppe_rules | scoring | loto_rules`

### PUT /config/:configType
Update rules configuration.
- **Request**: `{ configValue: object }`
- **Access**: Admin

---

## Audit

### GET /audit
Query audit trail.
- **Query**: `?entity_type=JSA&entity_id=uuid&actor_id=uuid&action=APPROVE&from=&to=&page=1&limit=50`
- **Response**: `{ data: AuditEntryDTO[], total, page, limit }`
- **Access**: Admin, HSE

---

## DTOs

### UserDTO
```json
{ "id", "email", "firstName", "lastName", "role", "businessUnit", "site", "isActive", "createdAt" }
```

### JSASummaryDTO
```json
{ "id", "referenceNumber", "status", "jobType", "location", "businessUnit", "dateOfWork", "strengthScore", "createdBy": UserDTO, "createdAt", "submittedAt", "flagCount", "hasStopJob" }
```

### JSADetailDTO
```json
{ ...JSASummaryDTO, "workOrder", "crewMembers", "jobDescription", "additionalNotes", "signatureData", "scoreBreakdown", "hazards": HazardDTO[], "ppeChecklist": PPEItemDTO[], "attachments": AttachmentDTO[], "events": EventDTO[], "reviewedBy", "reviewComments", "reviewedAt" }
```

### EventDTO
```json
{ "id", "jsaId", "eventType", "status", "flagType", "reason", "severity", "createdBy": UserDTO, "resolvedBy", "resolvedAt", "resolutionNotes", "attachments": AttachmentDTO[], "createdAt" }
```

### JSODetailDTO
```json
{ "id", "referenceNumber", "jsaId", "eventId", "status", "rootCause", "correctiveActions", "preventiveActions", "resolutionNotes", "observerSignature", "assignedTo": UserDTO, "completedBy", "completedAt", "attachments": AttachmentDTO[], "createdAt" }
```
