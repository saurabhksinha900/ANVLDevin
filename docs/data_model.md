# Connected Worker - JSA/JSO Platform: Data Model

## Entity Relationship Overview

```
User ──────┐
  │        │
  │ created_by / assigned_to
  │        │
  ▼        ▼
 JSA ◄──── JSO
  │         │
  ├── Hazard ──── Mitigation
  │
  ├── PPEChecklistItem
  │
  ├── Attachment
  │
  ├── Event (Flag / StopJob)
  │
  ├── AuditEntry
  │
  └── Notification
```

## Entities

### 1. User

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login identifier |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hashed |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| role | ENUM | NOT NULL | TECHNICIAN, SUPERVISOR, HSE, ADMIN |
| business_unit | VARCHAR(100) | NULL | Marine, Field Service, In Shop, Power Gen |
| site | VARCHAR(100) | NULL | Assigned site/location |
| is_active | BOOLEAN | DEFAULT true | Soft deactivation |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| last_login_at | TIMESTAMPTZ | NULL | |

### 2. JSA (Job Safety Assessment)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| reference_number | VARCHAR(20) | UNIQUE, NOT NULL | Auto-generated: JSA-YYYYMMDD-XXXX |
| status | ENUM | NOT NULL | DRAFT, SUBMITTED, APPROVED, REJECTED, STOPPED, CLOSED |
| job_type | VARCHAR(100) | NOT NULL | From config catalog |
| location | VARCHAR(255) | NOT NULL | |
| business_unit | VARCHAR(100) | NOT NULL | |
| date_of_work | DATE | NOT NULL | |
| work_order | VARCHAR(50) | NULL | |
| crew_members | TEXT[] | NOT NULL | Array of names |
| job_description | TEXT | NOT NULL | |
| additional_notes | TEXT | NULL | |
| signature_data | TEXT | NULL | Base64 signature image |
| strength_score | INTEGER | NULL | 1-5, calculated after submit |
| score_breakdown | JSONB | NULL | Detailed scoring per category |
| approved_snapshot | JSONB | NULL | Immutable copy on approval |
| created_by | UUID | FK -> User.id | Technician |
| reviewed_by | UUID | FK -> User.id, NULL | Supervisor/HSE |
| review_comments | TEXT | NULL | |
| reviewed_at | TIMESTAMPTZ | NULL | |
| submitted_at | TIMESTAMPTZ | NULL | |
| closed_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

### 3. Hazard

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| jsa_id | UUID | FK -> JSA.id, NOT NULL | |
| category | VARCHAR(100) | NOT NULL | e.g., "Work with Electricity" |
| description | TEXT | NOT NULL | Specific hazard from catalog |
| risk_level | ENUM | NOT NULL | LOW, MEDIUM, HIGH, CRITICAL |
| details | TEXT | NULL | Additional technician notes |
| loto_required | BOOLEAN | DEFAULT false | |
| loto_verified | BOOLEAN | DEFAULT false | |
| loto_number | VARCHAR(50) | NULL | Lock number if LOTO |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 4. Mitigation

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| hazard_id | UUID | FK -> Hazard.id, NOT NULL | |
| description | TEXT | NOT NULL | Control measure from catalog |
| is_custom | BOOLEAN | DEFAULT false | True if manually added |
| notes | TEXT | NULL | Additional details |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 5. PPEChecklistItem

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| jsa_id | UUID | FK -> JSA.id, NOT NULL | |
| ppe_type | VARCHAR(100) | NOT NULL | e.g., "hard_hat", "safety_glasses" |
| label | VARCHAR(100) | NOT NULL | Display label |
| is_checked | BOOLEAN | DEFAULT false | |
| is_required | BOOLEAN | DEFAULT false | Determined by rules engine |
| notes | TEXT | NULL | e.g., glove type |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 6. Attachment

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| entity_type | ENUM | NOT NULL | JSA, JSO, FLAG, STOP_JOB |
| entity_id | UUID | NOT NULL | Polymorphic FK |
| file_name | VARCHAR(255) | NOT NULL | Original filename |
| file_path | VARCHAR(500) | NOT NULL | Storage path |
| file_size | INTEGER | NOT NULL | Bytes |
| mime_type | VARCHAR(100) | NOT NULL | e.g., image/jpeg |
| category | VARCHAR(50) | NULL | site_photo, ppe_photo, evidence, verification |
| uploaded_by | UUID | FK -> User.id | |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 7. Event (Flag / Stop-Job)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| jsa_id | UUID | FK -> JSA.id, NOT NULL | |
| event_type | ENUM | NOT NULL | FLAG, STOP_JOB |
| status | ENUM | NOT NULL | OPEN, ACKNOWLEDGED, RESOLVED, CLOSED |
| flag_type | VARCHAR(50) | NULL | For flags: ASSISTANCE, CONCERN, INFORMATION |
| reason | TEXT | NOT NULL | Description/reason |
| severity | ENUM | NULL | For stop-jobs: MINOR, MAJOR, CRITICAL |
| resolved_by | UUID | FK -> User.id, NULL | |
| resolved_at | TIMESTAMPTZ | NULL | |
| resolution_notes | TEXT | NULL | |
| created_by | UUID | FK -> User.id | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

### 8. JSO (Job Safety Observation)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| reference_number | VARCHAR(20) | UNIQUE, NOT NULL | Auto-generated: JSO-YYYYMMDD-XXXX |
| jsa_id | UUID | FK -> JSA.id, NOT NULL | Linked JSA |
| event_id | UUID | FK -> Event.id, NOT NULL | The stop-job event |
| status | ENUM | NOT NULL | PENDING, IN_PROGRESS, COMPLETED |
| root_cause | TEXT | NULL | |
| corrective_actions | TEXT | NULL | |
| preventive_actions | TEXT | NULL | |
| resolution_notes | TEXT | NULL | |
| observer_signature | TEXT | NULL | Base64 signature |
| assigned_to | UUID | FK -> User.id | Supervisor/HSE |
| completed_by | UUID | FK -> User.id, NULL | |
| completed_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

### 9. AuditEntry

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| entity_type | VARCHAR(50) | NOT NULL | JSA, JSO, EVENT, USER |
| entity_id | UUID | NOT NULL | |
| action | ENUM | NOT NULL | CREATE, UPDATE, SUBMIT, APPROVE, REJECT, CLOSE, FLAG, STOP_JOB |
| actor_id | UUID | FK -> User.id | Who performed the action |
| before_snapshot | JSONB | NULL | State before change |
| after_snapshot | JSONB | NULL | State after change |
| ip_address | VARCHAR(45) | NULL | |
| user_agent | VARCHAR(500) | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | Immutable |

### 10. Notification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| recipient_id | UUID | FK -> User.id | |
| type | ENUM | NOT NULL | FLAG_RAISED, STOP_JOB, JSA_SUBMITTED, JSA_APPROVED, JSA_REJECTED, JSO_COMPLETED, LOW_SCORE |
| title | VARCHAR(255) | NOT NULL | |
| body | TEXT | NOT NULL | |
| deep_link | VARCHAR(500) | NULL | Frontend URL to relevant record |
| channel | ENUM | NOT NULL | EMAIL, SMS, IN_APP |
| status | ENUM | NOT NULL | PENDING, SENT, FAILED |
| sent_at | TIMESTAMPTZ | NULL | |
| read_at | TIMESTAMPTZ | NULL | |
| related_entity_type | VARCHAR(50) | NULL | |
| related_entity_id | UUID | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 11. RulesConfig (for config-driven rules engine)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| config_type | VARCHAR(50) | NOT NULL | JOB_TYPES, HAZARD_CATALOG, PPE_RULES, SCORING, LOTO_RULES |
| config_key | VARCHAR(100) | NOT NULL | Unique key per type |
| config_value | JSONB | NOT NULL | JSON configuration |
| version | INTEGER | DEFAULT 1 | For versioning config changes |
| is_active | BOOLEAN | DEFAULT true | |
| updated_by | UUID | FK -> User.id | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UNIQUE constraint**: (config_type, config_key, version)

## Indexes

```sql
-- JSA lookups
CREATE INDEX idx_jsa_status ON jsa(status);
CREATE INDEX idx_jsa_created_by ON jsa(created_by);
CREATE INDEX idx_jsa_business_unit ON jsa(business_unit);
CREATE INDEX idx_jsa_job_type ON jsa(job_type);
CREATE INDEX idx_jsa_date_of_work ON jsa(date_of_work);
CREATE INDEX idx_jsa_strength_score ON jsa(strength_score);

-- Hazard lookups
CREATE INDEX idx_hazard_jsa_id ON hazard(jsa_id);
CREATE INDEX idx_hazard_category ON hazard(category);

-- Mitigation lookups
CREATE INDEX idx_mitigation_hazard_id ON mitigation(hazard_id);

-- Event lookups
CREATE INDEX idx_event_jsa_id ON event(jsa_id);
CREATE INDEX idx_event_type ON event(event_type);
CREATE INDEX idx_event_status ON event(status);

-- JSO lookups
CREATE INDEX idx_jso_jsa_id ON jso(jsa_id);
CREATE INDEX idx_jso_status ON jso(status);
CREATE INDEX idx_jso_assigned_to ON jso(assigned_to);

-- Audit lookups
CREATE INDEX idx_audit_entity ON audit_entry(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_entry(actor_id);
CREATE INDEX idx_audit_created ON audit_entry(created_at);

-- Notification lookups
CREATE INDEX idx_notification_recipient ON notification(recipient_id);
CREATE INDEX idx_notification_status ON notification(status);

-- Attachment lookups
CREATE INDEX idx_attachment_entity ON attachment(entity_type, entity_id);
```
