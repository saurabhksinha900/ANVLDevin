# Connected Worker - JSA/JSO Platform: Requirements Draft

## 1. Problem Statement

Industrial organizations rely on paper-based or spreadsheet-driven Job Safety Assessments (JSAs) and Job Safety Observations (JSOs) to manage workplace hazards. This approach suffers from:

- **Delayed data availability**: Paper forms must be collected, transcribed, and tabulated before leadership can act.
- **Pencil-whipping**: Long checklists encourage superficial completion, causing hazards to be overlooked.
- **No real-time escalation**: Stop-job events and flags cannot be communicated instantly to supervisors/HSE.
- **Poor auditability**: Paper records are easily lost, altered, or incomplete.
- **No trend analysis**: Without structured digital data, identifying recurring hazards across sites/divisions is impractical.

## 2. Scope

### In-Scope (MVP)

- Digital JSA creation, submission, and review workflow (mobile-first, offline-capable).
- Hazard identification with mapped mitigations, PPE requirements, and evidence capture (photos, text notes).
- Flag system for technicians to request assistance or note concerns.
- Stop-Job escalation that auto-creates a mandatory JSO task for Supervisor/HSE.
- Supervisor/HSE dashboard with live queue, review/approve/reject, and JSA Strength Score.
- Rules engine (config-driven JSON) for hazard-mitigation mapping, LOTO enforcement, scoring.
- Email notifications (via dev SMTP) on flags and stop-job events.
- Basic reporting: counts by status, strength score trends, leading/lagging indicators.
- JWT authentication with role-based access (Technician, Supervisor, HSE, Admin).
- Full audit trail; immutable snapshots of approved records.
- CSV/JSON export of JSA/JSO records.

### Out-of-Scope (MVP)

- Real SMS/email providers (MailHog only).
- SSO/LDAP/OIDC integration (placeholder abstraction only).
- S3/Blob cloud storage (local disk with abstracted interface).
- Voice-to-text data capture.
- In-app two-way messaging (chat).
- Advanced analytics / ML-based predictions.
- Multi-language / i18n support.
- Native mobile apps (PWA only).

## 3. KPIs

| KPI | Target |
|-----|--------|
| JSA completion rate | Track % of started vs. submitted JSAs |
| Average JSA Strength Score | Track 1-5 score trend over time |
| Time to review | Avg time from JSA submission to supervisor action |
| Stop-job resolution time | Avg time from stop-job to JSO completion + closure |
| Flag response time | Avg time from flag raised to acknowledged |
| Leading indicators | Hazard identification counts, PPE compliance rate |
| Lagging indicators | Stop-job frequency, rejection rate |

## 4. Roles & Actors

| Role | Description | Permissions |
|------|-------------|-------------|
| **Technician** | Frontline worker performing jobs | Create/edit/submit JSA, raise flags, trigger stop-job, capture photos, sign off |
| **Supervisor** | Team lead overseeing technicians | View dashboard, review/approve/reject JSAs, complete JSOs, view reports |
| **HSE** | Health, Safety & Environment officer | Same as Supervisor + manage rules config, view all sites, export data |
| **Admin** | System administrator | User management, role assignment, system configuration, all permissions |

## 5. User Stories

### Technician

- **US-T01**: As a Technician, I want to create a new JSA before starting a job so that hazards are identified and mitigated.
- **US-T02**: As a Technician, I want to select my job type (e.g., Moving Vehicles, Work with Electricity, Lifting Operations) so that relevant hazard questions appear.
- **US-T03**: As a Technician, I want to identify hazards and select corresponding mitigations from a guided list.
- **US-T04**: As a Technician, I want to complete a PPE checklist to confirm I have the required protective equipment.
- **US-T05**: As a Technician, I want to capture photos as evidence of site conditions and PPE compliance.
- **US-T06**: As a Technician, I want to add my digital signature to confirm JSA completion.
- **US-T07**: As a Technician, I want to raise a Flag with notes when I need assistance or want to highlight a concern.
- **US-T08**: As a Technician, I want to trigger a Stop-Job with a reason and evidence when conditions are unsafe.
- **US-T09**: As a Technician, I want to fill out the JSA form offline and have it sync when connectivity returns.
- **US-T10**: As a Technician, I want to edit a draft JSA before submission.

### Supervisor / HSE

- **US-S01**: As a Supervisor, I want a dashboard showing new JSAs, flags, and stop-jobs requiring my attention.
- **US-S02**: As a Supervisor, I want to review a JSA and approve or reject it with comments.
- **US-S03**: As a Supervisor, I want to complete a JSO (Job Safety Observation) when a stop-job has been triggered, before the record can be closed.
- **US-S04**: As a Supervisor, I want to see the JSA Strength Score (1-5) for each submission to quickly assess quality.
- **US-S05**: As a Supervisor, I want to filter and sort JSAs by status, date, job type, score, and technician.
- **US-S06**: As a Supervisor, I want to receive email notifications when flags or stop-jobs are raised.
- **US-S07**: As an HSE officer, I want to view reports with counts by status, average strength scores, and trends.
- **US-S08**: As an HSE officer, I want to export JSA/JSO records as CSV or JSON.

### Admin

- **US-A01**: As an Admin, I want to manage user accounts and assign roles.
- **US-A02**: As an Admin, I want to configure job types, hazard catalogs, and mitigation mappings via JSON config.
- **US-A03**: As an Admin, I want to view the full audit trail for any JSA/JSO record.

## 6. End-to-End Flows

### Flow 1: JSA Creation & Submission

```
Technician opens app
  → Selects "New JSA"
  → Enters job info (job type, location, date, crew members, work order #)
  → System loads relevant hazard questions based on job type (from config)
  → Technician identifies hazards (multi-select from catalog)
  → For each hazard: selects mitigations, marks PPE requirements
  → If "Work with Electricity" or LOTO-triggering hazard selected:
      → LOTO verification section becomes visible (mandatory)
  → Technician captures photos (site conditions, PPE)
  → Technician completes PPE checklist
  → Technician adds digital signature
  → Submits JSA → status = "Submitted"
  → System calculates JSA Strength Score (1-5)
  → JSA appears on Supervisor dashboard
```

### Flow 2: Flag Escalation

```
Technician viewing active JSA
  → Taps "Raise Flag"
  → Enters flag notes / description
  → Optionally attaches photo evidence
  → Submits flag → flag status = "Open"
  → Email notification sent to assigned Supervisor/HSE
  → Flag appears on Supervisor dashboard
  → Supervisor acknowledges / responds
  → Flag status → "Acknowledged" / "Resolved"
```

### Flow 3: Stop-Job Escalation → JSO

```
Technician on active JSA
  → Taps "Stop Job"
  → Enters reason for stop (mandatory text)
  → Captures evidence photos (mandatory at least 1)
  → Submits → JSA status = "Stopped"
  → System auto-creates a JSO task assigned to Supervisor/HSE
  → Email notification sent to Supervisor/HSE with deep link
  → Supervisor opens JSO task
  → Completes observation form:
      - Root cause analysis
      - Corrective actions taken
      - Verification photos
      - Resolution notes
  → Marks JSO as complete → JSO status = "Completed"
  → JSA can now be closed by Supervisor
  → Supervisor reviews and closes → JSA status = "Closed"
```

### Flow 4: Supervisor Review & Approval

```
Supervisor opens dashboard
  → Views queue of submitted JSAs (sorted by date, flagged items prioritized)
  → Selects a JSA to review
  → Views all sections: job info, hazards, mitigations, PPE, photos, signature
  → Views auto-calculated Strength Score
  → Approves (status → "Approved") or Rejects with comments (status → "Rejected")
  → If rejected: Technician receives notification, can edit and resubmit
  → Approved JSA becomes immutable (snapshot stored)
```

## 7. Screen Inventory & Navigation

| Screen | Route | Role Access | Description |
|--------|-------|-------------|-------------|
| Login | `/login` | All | JWT authentication |
| Dashboard | `/dashboard` | Supervisor, HSE, Admin | Queue of JSAs, flags, stop-jobs; summary widgets |
| JSA List | `/jsas` | All | Filterable/sortable list of JSAs |
| New JSA | `/jsas/new` | Technician | Multi-step JSA creation form |
| Edit JSA | `/jsas/:id/edit` | Technician | Edit draft JSA |
| JSA Detail | `/jsas/:id` | All | Read-only view with review actions |
| JSO Form | `/jsos/:id` | Supervisor, HSE | Complete observation for stop-job |
| JSO List | `/jsos` | Supervisor, HSE, Admin | List of JSO records |
| Reports | `/reports` | Supervisor, HSE, Admin | Charts, exports |
| User Mgmt | `/admin/users` | Admin | CRUD users and roles |
| Config | `/admin/config` | Admin | Rules engine config viewer |
| Profile | `/profile` | All | User profile, password change |

## 8. Field-Level Specifications

### JSA - Job Information Section

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| job_type | Job Type | select | Yes | From config: Moving Vehicles, Work with Electricity, Lifting Operations, Moving Machinery, Work at Height, Fire/Explosions/Arc Flash, Restricted Work Space, Ascending/Descending, Below Deck/Ventilation, Adverse Weather |
| location | Location / Site | text | Yes | Free text or select from configured sites |
| business_unit | Business Unit | select | Yes | e.g., Marine, Field Service, In Shop, Power Gen |
| date | Date of Work | date | Yes | Defaults to today |
| work_order | Work Order # | text | No | Reference number |
| crew_members | Crew Members | text[] | Yes | At least 1 name |
| job_description | Job Description | textarea | Yes | Brief description of work to be performed |

### JSA - Hazard Identification Section

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| hazards | Identified Hazards | multi-select | Yes | From hazard catalog (config-driven per job type) |
| hazard_details | Hazard Details | textarea | No | Additional notes per hazard |
| risk_level | Risk Level | select | Yes | Low / Medium / High / Critical |

### JSA - Mitigation Section (per hazard)

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| mitigations | Control Measures | multi-select | Yes | Mapped from hazard catalog |
| mitigation_notes | Additional Controls | textarea | No | Free text for extra measures |
| loto_required | LOTO Required | boolean | Conditional | Auto-shown when hazard triggers LOTO (e.g., Work with Electricity, Moving Machinery) |
| loto_verified | LOTO Verified | boolean | Conditional | Must be checked if loto_required = true |
| loto_number | LOTO Lock Number | text | Conditional | Required if LOTO verified |

### JSA - PPE Checklist

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| hard_hat | Hard Hat | boolean | Yes | |
| safety_glasses | Safety Glasses | boolean | Yes | |
| hi_vis_vest | Hi-Vis Vest | boolean | Yes | |
| steel_toe_boots | Steel-Toe Boots | boolean | Yes | |
| gloves | Gloves | boolean | Yes | Type specified if checked |
| hearing_protection | Hearing Protection | boolean | Conditional | Required for certain job types |
| fall_protection | Fall Protection Harness | boolean | Conditional | Required for Work at Height |
| respiratory | Respiratory Protection | boolean | Conditional | Required for certain hazards |
| face_shield | Face Shield | boolean | Conditional | Required for arc flash/welding |
| ppe_other | Other PPE | text | No | Free text for additional PPE |

### JSA - Evidence & Signature

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| photos | Site Photos | file[] | No | Max 10 photos, JPEG/PNG, max 10MB each |
| additional_notes | Additional Notes | textarea | No | |
| signature | Digital Signature | signature | Yes | Canvas-based signature capture |

### Flag Fields

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| flag_type | Flag Type | select | Yes | Assistance Needed, Concern, Information |
| flag_notes | Notes | textarea | Yes | Description of the flag |
| flag_photo | Evidence Photo | file | No | Optional photo |

### Stop-Job Fields

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| stop_reason | Reason for Stopping | textarea | Yes | Detailed reason |
| stop_photos | Evidence Photos | file[] | Yes | At least 1 photo required |
| severity | Severity | select | Yes | Minor, Major, Critical |

### JSO (Job Safety Observation) Fields

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| root_cause | Root Cause | textarea | Yes | Analysis of what caused the stop |
| corrective_actions | Corrective Actions | textarea | Yes | Actions taken to resolve |
| preventive_actions | Preventive Actions | textarea | No | Actions to prevent recurrence |
| verification_photos | Verification Photos | file[] | No | Photos of corrective actions |
| resolution_notes | Resolution Notes | textarea | Yes | Summary of resolution |
| observer_signature | Observer Signature | signature | Yes | Supervisor/HSE signature |

## 9. Rules Catalog

### 9.1 Hazard-Mitigation Mapping (Config-Driven)

Hazards are categorized by job type. Each hazard maps to recommended mitigations:

| Hazard Category | Example Hazards | Recommended Mitigations |
|----------------|-----------------|------------------------|
| Moving Vehicles | Struck by vehicle, Backing hazard | Spotter required, Barricades, High-vis vest, Safe distance |
| Work with Electricity | Electrical shock, Arc flash | LOTO required, Insulated tools, Arc-rated PPE, Voltage testing |
| Lifting Operations | Dropped load, Rigging failure | Inspection of rigging, Tag lines, Exclusion zone, Certified operator |
| Moving Machinery | Entanglement, Pinch points | Machine guarding, LOTO, Safe distance, Emergency stop accessible |
| Work at Height | Falls, Dropped objects | Fall protection harness, Guardrails, Tool lanyards, Barricade below |
| Fire/Explosions/Arc Flash | Ignition sources, Flammable materials | Hot work permit, Fire watch, Extinguisher present, Gas testing |
| Restricted Work Space | Confined space, Limited egress | Permit required, Atmospheric testing, Rescue plan, Attendant |
| Ascending/Descending | Ladder falls, Stairway hazards | 3-point contact, Inspected ladder, Handrails |
| Below Deck/Ventilation | Oxygen deficiency, Toxic atmosphere | Ventilation verified, Gas monitor, Buddy system |
| Adverse Weather | Lightning, High winds, Rough seas | Weather check, Postpone criteria, Secure equipment |

### 9.2 LOTO Enforcement Rules

```
IF hazard IN ["Work with Electricity", "Moving Machinery", "Entanglement"]
  THEN loto_required = true
  AND loto_verified MUST be checked
  AND loto_number MUST be provided
```

### 9.3 PPE Conditional Rules

```
IF job_type = "Work at Height"
  THEN fall_protection = REQUIRED
IF hazard INCLUDES "Arc Flash"
  THEN face_shield = REQUIRED AND arc_rated_clothing = REQUIRED
IF hazard INCLUDES "Confined Space"
  THEN respiratory = REQUIRED
IF job_type = "Lifting Operations"
  THEN gloves = REQUIRED AND steel_toe_boots = REQUIRED
```

### 9.4 JSA Strength Score Rubric (1-5)

The Strength Score evaluates JSA completeness and quality:

| Score | Label | Criteria |
|-------|-------|----------|
| 1 | Poor | Fewer than 50% of required fields completed; no hazards identified; no photos |
| 2 | Below Average | 50-69% fields completed; generic hazards only; no mitigations detailed; no photos |
| 3 | Adequate | 70-84% fields completed; hazards identified with basic mitigations; PPE checklist done |
| 4 | Good | 85-94% fields completed; specific hazards with detailed mitigations; photos attached; LOTO verified where needed |
| 5 | Excellent | 95-100% fields completed; comprehensive hazard analysis; all mitigations detailed; multiple evidence photos; LOTO verified; all conditional fields addressed |

**Scoring formula** (config-driven weights):
- Field completeness: 30%
- Hazard specificity (not just generic selections): 20%
- Mitigation detail (notes provided, not just checkboxes): 20%
- Evidence quality (photos attached, count): 15%
- Compliance (LOTO, conditional PPE): 15%

### 9.5 Escalation Triggers

| Trigger | Action |
|---------|--------|
| Technician raises Flag | Email Supervisor + HSE; flag appears on dashboard |
| Technician triggers Stop-Job | Email Supervisor + HSE; auto-create JSO task; JSA frozen |
| JSA Strength Score <= 2 | Auto-flag for supervisor review with "Low Quality" tag |
| JSA rejected by Supervisor | Notification to Technician with rejection comments |
| JSO completed | Notification to original Technician; JSA eligible for closure |

## 10. Notifications

| Event | Channel | Recipients | Content |
|-------|---------|------------|---------|
| Flag raised | Email | Supervisor, HSE | Flag details + deep link to JSA |
| Stop-job triggered | Email | Supervisor, HSE | Stop reason + deep link to JSO task |
| JSA submitted | Email (optional) | Supervisor | New JSA notification + deep link |
| JSA approved | Email | Technician | Approval confirmation |
| JSA rejected | Email | Technician | Rejection with comments + deep link to edit |
| JSO completed | Email | Technician | Resolution summary |
| Low strength score | Email | Supervisor | Auto-flagged JSA + deep link |

## 11. Reporting Needs

### Dashboard Widgets (Supervisor/HSE)

1. **JSA Status Counts**: Pie/donut chart - Draft, Submitted, Approved, Rejected, Stopped, Closed
2. **JSA Strength Score Distribution**: Bar chart - count per score (1-5)
3. **Average Strength Score Trend**: Line chart - weekly/monthly average
4. **Hazard Frequency**: Bar chart - top hazards identified (as seen in video: Moving Vehicles most frequent)
5. **Stop-Job & Flag Counts**: Trend line - weekly/monthly
6. **Leading Indicators**: Hazard identification rate, PPE compliance %, proactive flags
7. **Lagging Indicators**: Stop-job frequency, rejection rate, overdue JSOs
8. **By Business Unit**: Breakdown by Marine, Field Service, In Shop, Power Gen (or configured units)

### Export

- CSV export of JSA records with all fields
- JSON export for integration
- Date range and filter support

## 12. Non-Functional Requirements

### 12.1 Auditability
- Every create, update, approve, reject, close action logged in AuditEntry table.
- Audit entries include: actor, action, timestamp, before/after snapshot, IP address.
- Approved JSAs stored as immutable JSON snapshots.

### 12.2 Security
- JWT-based authentication with token expiry (1h access, 7d refresh).
- Role-based access control on all API endpoints.
- Password hashing with bcrypt.
- OIDC-ready abstraction for future enterprise SSO.
- File upload validation: type whitelist (JPEG, PNG, PDF), size limit (10MB).
- Rate limiting on auth endpoints.

### 12.3 Performance
- API response time < 500ms for list endpoints (p95).
- JSA form load < 2s on 3G connection.
- Offline form capture with background sync within 30s of connectivity.
- Support 100 concurrent users for MVP.

### 12.4 Data Retention & Export
- All records retained indefinitely in MVP.
- Approved records immutable (no edit/delete).
- Export available as CSV and JSON.
- Future: Data Lake/Delta integration.

### 12.5 PWA / Offline
- Service worker caches JSA form, hazard catalogs, PPE lists.
- IndexedDB stores draft JSAs offline.
- Background sync on reconnection.
- Offline indicator in UI.
