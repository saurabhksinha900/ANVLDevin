# Connected Worker - JSA/JSO Platform: Fit-Gap Analysis

## Overview

This document maps features observed in the ANVL demo video and website against what the MVP will deliver, what will be extended beyond the demo, and what is deferred to future releases.

## Feature Matrix

| # | Feature | Demo/ANVL | MVP Status | Notes |
|---|---------|-----------|------------|-------|
| **Core JSA Workflow** | | | |
| 1 | JSA creation with job info | Yes | **Match** | Job type, location, business unit, crew, date |
| 2 | Hazard identification (multi-select catalog) | Yes | **Match** | Config-driven per job type |
| 3 | Mitigation selection per hazard | Yes | **Match** | Mapped from hazard catalog |
| 4 | PPE checklist | Yes | **Match** | Conditional items based on job type/hazards |
| 5 | Photo evidence capture | Yes | **Match** | File upload with type/size validation |
| 6 | Digital signature | Inferred | **Match** | Canvas-based signature capture |
| 7 | JSA submission & review | Yes | **Match** | Submit -> Supervisor review -> Approve/Reject |
| **Hazard Categories** | | | |
| 8 | Moving Vehicles | Yes (in chart) | **Match** | From video data slide |
| 9 | Work with Electricity | Yes (in chart) | **Match** | Includes LOTO trigger |
| 10 | Lifting Operations | Yes (in chart) | **Match** | |
| 11 | Moving Machinery | Yes (in chart) | **Match** | Includes LOTO trigger |
| 12 | Work at Height | Yes (in chart) | **Match** | Fall protection required |
| 13 | Fire/Explosions/Arc Flash | Yes (in chart) | **Match** | Hot work considerations |
| 14 | Restricted Work Space | Yes (in chart) | **Match** | Confined space procedures |
| 15 | Ascending/Descending | Yes (in chart) | **Match** | Ladder/stairway safety |
| 16 | Below Deck/Ventilation/Temperature | Yes (in chart) | **Match** | Atmospheric monitoring |
| 17 | Adverse Weather/Rough Seas | Yes (in chart) | **Match** | Weather-dependent work |
| **Business Units** | | | |
| 18 | Marine segment | Yes (in chart) | **Match** | Configurable business unit |
| 19 | Field Service segment | Yes (in chart) | **Match** | |
| 20 | In Shop segment | Yes (in chart) | **Match** | |
| 21 | Power Gen segment | Yes (in chart) | **Match** | |
| **Escalation & Events** | | | |
| 22 | Flag/issue escalation | Yes (ANVL website) | **Match** | Flag types: Assistance, Concern, Information |
| 23 | Stop-job triggering | Yes (ANVL website) | **Match** | Auto-creates JSO task |
| 24 | Auto-triggered stop-jobs | Yes (ANVL website) | **Partial** | MVP: manual only. Auto-trigger deferred |
| 25 | Event-based alerts & notifications | Yes (ANVL website) | **Match** | Email via MailHog |
| **JSO (Safety Observation)** | | | |
| 26 | JSO creation from stop-job | Inferred | **Match** | Auto-created, assigned to Supervisor/HSE |
| 27 | Root cause analysis | Inferred | **Match** | Required field |
| 28 | Corrective/preventive actions | Inferred | **Match** | |
| 29 | JSO completion before JSA closure | Inferred | **Match** | Enforced by system |
| **Scoring & Analytics** | | | |
| 30 | JSA Strength Score (1-5) | Inferred | **Match** | Rules-based calculation |
| 31 | Hazard frequency chart (by category) | Yes (in video) | **Match** | Bar chart with business unit breakdown |
| 32 | Data by business unit breakdown | Yes (in video) | **Match** | Stacked bar charts |
| 33 | Leading indicators dashboard | Yes (ANVL website) | **Match** | Hazard ID rate, PPE compliance, flags |
| 34 | Lagging indicators | Inferred | **Match** | Stop-job freq, rejection rate |
| 35 | Advanced analytics with custom trending | Yes (ANVL website) | **Partial** | Basic trends only in MVP |
| **Platform Features** | | | |
| 36 | Mobile app (iOS/Android) | Yes | **Partial** | PWA only (not native) |
| 37 | Offline mode with full workflow | Yes (ANVL website) | **Match** | Service worker + IndexedDB |
| 38 | Voice-to-text data collection | Yes (ANVL website) | **Deferred** | Not in MVP |
| 39 | Two-way in-app messaging | Yes (ANVL website) | **Deferred** | Not in MVP |
| 40 | Rich attachments (photos/videos/files) | Yes (ANVL website) | **Partial** | Photos and docs; no video in MVP |
| 41 | Configurable workflow templates | Yes (ANVL website) | **Match** | JSON-driven config |
| 42 | Real-time workflow dashboard | Yes (ANVL website) | **Match** | Live queue for supervisors |
| 43 | Automated compliance reports | Yes (ANVL website) | **Partial** | Basic reports; no scheduled delivery |
| 44 | Custom reports with email delivery | Yes (ANVL website) | **Deferred** | |
| **Security & Admin** | | | |
| 45 | Role-based access control | Inferred | **Match** | 4 roles: Technician, Supervisor, HSE, Admin |
| 46 | Audit trail | Inferred | **Match** | Full CRUD audit with snapshots |
| 47 | Immutable approved records | Inferred | **Match** | JSON snapshot on approval |
| 48 | SSO/LDAP integration | Likely in enterprise | **Deferred** | OIDC placeholder only |
| **Data & Integration** | | | |
| 49 | 190K+ JSAs tracked | Yes (in video) | N/A | Scale reference; MVP targets 100 users |
| 50 | CSV/JSON export | Inferred | **Match** | |
| 51 | Data Lake/Delta integration | Mentioned in req | **Deferred** | Export endpoints as foundation |
| 52 | API-first architecture | Inferred | **Match** | OpenAPI 3.0 spec |

## Summary

| Status | Count | Description |
|--------|-------|-------------|
| **Match** | 37 | MVP fully implements the feature |
| **Partial** | 6 | MVP implements core functionality; advanced features deferred |
| **Deferred** | 6 | Not in MVP; planned for future releases |
| **Extended** | 3 | MVP adds features beyond what was visible in demo |

## Extended Beyond Demo

1. **Config-driven rules engine**: Externalizes all question sets, hazard catalogs, scoring weights in JSON. More flexible than what's visible in the demo.
2. **Detailed scoring breakdown**: MVP provides per-category scoring breakdown (field completeness, hazard specificity, mitigation detail, evidence, compliance) beyond the simple 1-5 visible score.
3. **Comprehensive audit trail**: Full before/after snapshots with IP tracking, exceeding typical audit requirements.

## Deferred Features (Post-MVP Roadmap)

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P1 | Voice-to-text capture | Requires speech-to-text API integration |
| P1 | In-app two-way messaging | Significant UI/backend complexity |
| P1 | SSO/OIDC integration | Enterprise deployment requirement |
| P2 | Auto-triggered stop-jobs | Rules engine enhancement |
| P2 | Custom scheduled reports | Email delivery infrastructure |
| P2 | Native mobile apps | PWA covers MVP needs |
| P2 | Video attachment support | Storage and streaming complexity |
| P3 | ML-based hazard prediction | Requires training data |
| P3 | Multi-language / i18n | Internationalization framework |
| P3 | Data Lake / Delta integration | Enterprise data platform |
