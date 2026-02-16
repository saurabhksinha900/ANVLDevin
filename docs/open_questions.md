# Connected Worker - JSA/JSO Platform: Open Questions

## P0 - Blocking (must resolve before or during MVP)

| # | Question | Context | Assumption (if proceeding) |
|---|----------|---------|---------------------------|
| P0-1 | **JSA Strength Score exact weights**: The video shows data-driven analytics but does not reveal the precise scoring algorithm. Are the proposed weights (30% completeness, 20% hazard specificity, 20% mitigation detail, 15% evidence, 15% compliance) acceptable? | Scoring rubric in requirements_draft.md | Proceeding with proposed weights; configurable via JSON so can be tuned post-launch |
| P0-2 | **LOTO trigger list**: Which exact hazard categories should trigger mandatory LOTO? Proposed: "Work with Electricity", "Moving Machinery". Are there others? | Rules engine config | Proceeding with the two listed; config-driven so easily extended |
| P0-3 | **Business units**: The video shows Marine, Field Service, In Shop, Power Gen (Cummins-specific). Should the MVP use these or generic placeholders? | Video frame analysis | Using generic configurable list; seeding with these four as demo data |

## P1 - Important (should clarify, but not blocking)

| # | Question | Context | Assumption (if proceeding) |
|---|----------|---------|---------------------------|
| P1-1 | **Auto-triggered stop-jobs**: ANVL website mentions "auto-triggered stop-jobs". Should the MVP implement automatic stop-job based on risk level (e.g., all CRITICAL risks auto-stop)? | ANVL feature comparison table | MVP: manual only. Auto-trigger as post-MVP enhancement |
| P1-2 | **JSO form depth**: The video doesn't show the JSO form in detail. Is root cause + corrective actions + preventive actions + verification photos sufficient? | JSO entity design | Proceeding with proposed fields; can extend |
| P1-3 | **Notification preferences**: Should users be able to opt in/out of specific notification types? | Notification system | MVP: all notifications enabled by default, no preferences UI |
| P1-4 | **Multi-site support**: Should the MVP support multiple physical sites with site-level filtering on dashboards? | Scalability concern | MVP: single site field on JSA; filtering available but no site hierarchy |
| P1-5 | **Concurrent JSA editing**: Can a Technician have multiple draft JSAs simultaneously? | Workflow question | Yes, allowing multiple drafts |
| P1-6 | **Rejection resubmission limit**: Is there a max number of times a JSA can be rejected and resubmitted? | Workflow question | No limit in MVP |
| P1-7 | **Photo requirements per section**: The video shows rich photo capture. Should there be minimum photo counts per section (e.g., at least 1 site photo, 1 PPE photo)? | Evidence requirements | MVP: photos optional except for stop-jobs (min 1 required) |

## P2 - Nice-to-Have (clarify when convenient)

| # | Question | Context | Assumption (if proceeding) |
|---|----------|---------|---------------------------|
| P2-1 | **Hazard catalog granularity**: Should hazards be two-level (category -> specific hazard) or flat list? | Data model design | Two-level: category contains specific hazards |
| P2-2 | **Crew member verification**: Should crew members be validated against the user database or is free-text acceptable? | JSA form design | Free-text in MVP; future: user lookup |
| P2-3 | **Dashboard refresh rate**: Should the supervisor dashboard auto-refresh or require manual refresh? | UX question | Manual refresh with a refresh button; future: WebSocket live updates |
| P2-4 | **Report date range defaults**: What should the default date range be for reports? | Reporting UX | Default: current month; selectable: week, month, quarter, year, custom |
| P2-5 | **Attachment retention policy**: Should there be automatic cleanup of old attachments? | Storage management | No cleanup in MVP; all attachments retained |
| P2-6 | **Bulk operations**: Should supervisors be able to bulk-approve or bulk-close JSAs? | UX enhancement | Not in MVP; single-record operations only |
| P2-7 | **Export scheduling**: Should exports be schedulable (e.g., weekly CSV email)? | Reporting enhancement | Not in MVP; manual export only |

## Assumptions Log

These assumptions are being made to proceed with development. Any can be revisited:

1. **No proprietary content**: All hazard catalogs, PPE lists, scoring rules are generic industry-standard content, not copied from ANVL.
2. **English only**: No internationalization in MVP.
3. **Single timezone**: Server timezone (UTC) used for all timestamps; display in user's local time on frontend.
4. **No file versioning**: Attachments are immutable once uploaded; no version history.
5. **Password-based auth only**: No social login, magic links, or biometric auth in MVP.
6. **No workflow customization UI**: Rules config edited via JSON; no drag-and-drop workflow builder.
7. **Signature is image-based**: Digital signature captured as canvas drawing, stored as base64 PNG. Not legally binding e-signature (e.g., DocuSign).
8. **Offline sync is last-write-wins**: No conflict resolution for simultaneous edits; last sync overwrites.
