import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { JSA } from '../models';

@Component({
  selector: 'app-jsa-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="jsa-detail" *ngIf="jsa">
      <div class="header">
        <div>
          <h1>{{ jsa.referenceNumber }}</h1>
          <span class="badge" [class]="'badge-' + jsa.status.toLowerCase()">{{ jsa.status }}</span>
          @if (jsa.strengthScore) {
            <span class="score" [class]="'score-' + jsa.strengthScore">Score: {{ jsa.strengthScore }}/5</span>
          }
        </div>
        <div class="actions">
          @if (jsa.status === 'DRAFT' && auth.currentUser?.id === jsa.createdBy.id) {
            <button class="btn-primary" (click)="submitJSA()">Submit for Review</button>
          }
          @if (jsa.status === 'SUBMITTED' && auth.hasRole('SUPERVISOR', 'HSE', 'ADMIN')) {
            <button class="btn-approve" (click)="approveJSA()">Approve</button>
            <button class="btn-reject" (click)="showRejectForm = true">Reject</button>
          }
          @if ((jsa.status === 'APPROVED' || jsa.status === 'STOPPED') && auth.hasRole('SUPERVISOR', 'HSE', 'ADMIN')) {
            <button class="btn-secondary" (click)="closeJSA()">Close JSA</button>
          }
          @if (jsa.status !== 'CLOSED' && jsa.status !== 'STOPPED') {
            <button class="btn-flag" (click)="showFlagForm = true">Raise Flag</button>
            <button class="btn-stop" (click)="showStopForm = true">Stop Job</button>
          }
        </div>
      </div>

      @if (showRejectForm) {
        <div class="modal-overlay" (click)="showRejectForm = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Reject JSA</h3>
            <textarea [(ngModel)]="rejectComments" rows="3" placeholder="Reason for rejection (required)"></textarea>
            <div class="modal-actions">
              <button class="btn-reject" (click)="rejectJSA()" [disabled]="!rejectComments.trim()">Reject</button>
              <button class="btn-secondary" (click)="showRejectForm = false">Cancel</button>
            </div>
          </div>
        </div>
      }

      @if (showFlagForm) {
        <div class="modal-overlay" (click)="showFlagForm = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Raise Flag</h3>
            <select [(ngModel)]="flagType">
              <option value="ASSISTANCE">Request Assistance</option>
              <option value="CONCERN">Safety Concern</option>
              <option value="INFORMATION">Information</option>
            </select>
            <textarea [(ngModel)]="flagReason" rows="3" placeholder="Describe the issue"></textarea>
            <div class="modal-actions">
              <button class="btn-flag" (click)="createFlag()" [disabled]="!flagReason.trim()">Submit Flag</button>
              <button class="btn-secondary" (click)="showFlagForm = false">Cancel</button>
            </div>
          </div>
        </div>
      }

      @if (showStopForm) {
        <div class="modal-overlay" (click)="showStopForm = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Stop Job</h3>
            <p class="warning">This will stop the job and create a required JSO investigation.</p>
            <select [(ngModel)]="stopSeverity">
              <option value="MINOR">Minor</option>
              <option value="MAJOR">Major</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <textarea [(ngModel)]="stopReason" rows="3" placeholder="Reason for stopping (required)"></textarea>
            <div class="modal-actions">
              <button class="btn-stop" (click)="createStopJob()" [disabled]="!stopReason.trim()">Stop Job</button>
              <button class="btn-secondary" (click)="showStopForm = false">Cancel</button>
            </div>
          </div>
        </div>
      }

      <div class="sections">
        <section class="card">
          <h2>Job Information</h2>
          <div class="info-grid">
            <div><label>Job Type</label><span>{{ jsa.jobType }}</span></div>
            <div><label>Location</label><span>{{ jsa.location }}</span></div>
            <div><label>Business Unit</label><span>{{ jsa.businessUnit }}</span></div>
            <div><label>Date of Work</label><span>{{ jsa.dateOfWork | date:'mediumDate' }}</span></div>
            <div><label>Work Order</label><span>{{ jsa.workOrder || '-' }}</span></div>
            <div><label>Created By</label><span>{{ jsa.createdBy.firstName }} {{ jsa.createdBy.lastName }}</span></div>
            <div class="full"><label>Crew Members</label><span>{{ jsa.crewMembers.join(', ') || '-' }}</span></div>
            <div class="full"><label>Description</label><span>{{ jsa.jobDescription }}</span></div>
            @if (jsa.additionalNotes) {
              <div class="full"><label>Notes</label><span>{{ jsa.additionalNotes }}</span></div>
            }
          </div>
        </section>

        @if (jsa.scoreBreakdown) {
          <section class="card">
            <h2>Strength Score Breakdown</h2>
            <div class="score-grid">
              <div class="score-item">
                <div class="score-bar" [style.width.%]="jsa.scoreBreakdown.fieldCompleteness"></div>
                <span>Field Completeness: {{ jsa.scoreBreakdown.fieldCompleteness }}%</span>
              </div>
              <div class="score-item">
                <div class="score-bar" [style.width.%]="jsa.scoreBreakdown.hazardSpecificity"></div>
                <span>Hazard Specificity: {{ jsa.scoreBreakdown.hazardSpecificity }}%</span>
              </div>
              <div class="score-item">
                <div class="score-bar" [style.width.%]="jsa.scoreBreakdown.mitigationDetail"></div>
                <span>Mitigation Detail: {{ jsa.scoreBreakdown.mitigationDetail }}%</span>
              </div>
              <div class="score-item">
                <div class="score-bar" [style.width.%]="jsa.scoreBreakdown.evidenceQuality"></div>
                <span>Evidence Quality: {{ jsa.scoreBreakdown.evidenceQuality }}%</span>
              </div>
              <div class="score-item">
                <div class="score-bar" [style.width.%]="jsa.scoreBreakdown.complianceScore"></div>
                <span>Compliance: {{ jsa.scoreBreakdown.complianceScore }}%</span>
              </div>
            </div>
          </section>
        }

        <section class="card">
          <h2>Hazards ({{ jsa.hazards.length }})</h2>
          @for (hazard of jsa.hazards; track hazard.id) {
            <div class="hazard-item">
              <div class="hazard-info">
                <strong>{{ hazard.category }}</strong>
                <span class="risk-badge" [class]="'risk-' + hazard.riskLevel.toLowerCase()">{{ hazard.riskLevel }}</span>
                @if (hazard.lotoRequired) { <span class="loto-badge">LOTO</span> }
              </div>
              <p>{{ hazard.description }}</p>
              @if (hazard.details) { <p class="details">{{ hazard.details }}</p> }
              @if (hazard.mitigations.length > 0) {
                <ul class="mitigations-list">
                  @for (mit of hazard.mitigations; track mit.id) {
                    <li>{{ mit.description }}</li>
                  }
                </ul>
              }
            </div>
          }
          @if (jsa.hazards.length === 0) { <p class="empty">No hazards recorded</p> }
        </section>

        <section class="card">
          <h2>PPE Checklist</h2>
          <div class="ppe-grid">
            @for (ppe of jsa.ppeChecklist; track ppe.id) {
              <div class="ppe-item" [class.checked]="ppe.isChecked" [class.required]="ppe.isRequired">
                <span class="check">{{ ppe.isChecked ? '&#10003;' : '&#10007;' }}</span>
                {{ ppe.label }}
              </div>
            }
          </div>
        </section>

        @if (jsa.events.length > 0) {
          <section class="card">
            <h2>Events</h2>
            @for (event of jsa.events; track event.id) {
              <div class="event-item" [class]="'event-' + event.eventType.toLowerCase()">
                <div class="event-header">
                  <span class="event-type">{{ event.eventType === 'FLAG' ? 'Flag' : 'Stop Job' }}</span>
                  <span class="event-status">{{ event.status }}</span>
                  <span class="event-date">{{ event.createdAt | date:'short' }}</span>
                </div>
                <p>{{ event.reason }}</p>
                <small>By {{ event.createdBy.firstName }} {{ event.createdBy.lastName }}</small>
              </div>
            }
          </section>
        }

        @if (jsa.jsos.length > 0) {
          <section class="card">
            <h2>JSO Tasks</h2>
            @for (jso of jsa.jsos; track jso.id) {
              <div class="jso-item">
                <a [routerLink]="['/jsos', jso.id]">{{ jso.referenceNumber }}</a>
                <span class="badge" [class]="'badge-' + jso.status.toLowerCase()">{{ jso.status }}</span>
                <span>Assigned to: {{ jso.assignedTo.firstName }} {{ jso.assignedTo.lastName }}</span>
              </div>
            }
          </section>
        }

        @if (jsa.reviewComments) {
          <section class="card">
            <h2>Review Comments</h2>
            <p>{{ jsa.reviewComments }}</p>
            @if (jsa.reviewedBy) {
              <small>By {{ jsa.reviewedBy.firstName }} {{ jsa.reviewedBy.lastName }}</small>
            }
          </section>
        }
      </div>
    </div>

    @if (loading) { <p>Loading...</p> }
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    h1 { margin: 0; color: #1a365d; font-size: 1.5rem; display: inline; }
    .badge { padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-left: 0.5rem; vertical-align: middle; }
    .badge-draft { background: #edf2f7; color: #4a5568; }
    .badge-submitted { background: #bee3f8; color: #2a4365; }
    .badge-approved { background: #c6f6d5; color: #22543d; }
    .badge-rejected { background: #fed7d7; color: #742a2a; }
    .badge-stopped { background: #fed7d7; color: #742a2a; }
    .badge-closed { background: #e2e8f0; color: #4a5568; }
    .badge-pending { background: #fefcbf; color: #744210; }
    .badge-in_progress { background: #bee3f8; color: #2a4365; }
    .badge-completed { background: #c6f6d5; color: #22543d; }
    .score { margin-left: 0.75rem; font-weight: 700; vertical-align: middle; }
    .score-1, .score-2 { color: #e53e3e; }
    .score-3 { color: #d69e2e; }
    .score-4, .score-5 { color: #38a169; }
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .btn-primary { background: #3182ce; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .btn-approve { background: #38a169; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .btn-reject { background: #e53e3e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .btn-flag { background: #dd6b20; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .btn-stop { background: #e53e3e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .btn-secondary { background: white; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .card { background: white; border-radius: 8px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1rem; }
    .card h2 { margin: 0 0 1rem; font-size: 1rem; color: #2d3748; border-bottom: 1px solid #edf2f7; padding-bottom: 0.5rem; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
    .info-grid .full { grid-column: 1 / -1; }
    .info-grid label { font-size: 0.7rem; color: #718096; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-grid span { display: block; font-size: 0.875rem; color: #2d3748; }
    .hazard-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem; margin-bottom: 0.5rem; }
    .hazard-info { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
    .risk-badge { font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 3px; font-weight: 600; }
    .risk-low { background: #c6f6d5; color: #22543d; }
    .risk-medium { background: #fefcbf; color: #744210; }
    .risk-high { background: #fed7d7; color: #742a2a; }
    .risk-critical { background: #742a2a; color: white; }
    .loto-badge { font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 3px; background: #fbd38d; color: #744210; font-weight: 600; }
    .mitigations-list { margin: 0.5rem 0 0 1.5rem; font-size: 0.85rem; }
    .ppe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; }
    .ppe-item { padding: 0.375rem 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; }
    .ppe-item.checked { background: #f0fff4; border-color: #9ae6b4; }
    .ppe-item .check { font-weight: bold; }
    .ppe-item.checked .check { color: #38a169; }
    .ppe-item:not(.checked) .check { color: #e53e3e; }
    .event-item { border-left: 3px solid #e2e8f0; padding: 0.5rem 0.75rem; margin-bottom: 0.5rem; }
    .event-flag { border-color: #dd6b20; }
    .event-stop_job { border-color: #e53e3e; }
    .event-header { display: flex; gap: 0.5rem; font-size: 0.75rem; margin-bottom: 0.25rem; }
    .event-type { font-weight: 600; }
    .jso-item { display: flex; gap: 1rem; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #edf2f7; font-size: 0.875rem; }
    .jso-item a { color: #3182ce; text-decoration: none; }
    .empty { color: #a0aec0; font-style: italic; }
    .details { font-size: 0.85rem; color: #718096; }
    .score-grid { display: flex; flex-direction: column; gap: 0.5rem; }
    .score-item { position: relative; background: #edf2f7; border-radius: 4px; padding: 0.375rem 0.75rem; }
    .score-bar { position: absolute; left: 0; top: 0; bottom: 0; background: #bee3f8; border-radius: 4px; opacity: 0.5; }
    .score-item span { position: relative; font-size: 0.8rem; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 100; }
    .modal { background: white; padding: 1.5rem; border-radius: 8px; width: 450px; max-width: 90vw; }
    .modal h3 { margin: 0 0 1rem; }
    .modal textarea, .modal select { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 0.75rem; box-sizing: border-box; }
    .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .warning { color: #e53e3e; font-size: 0.85rem; margin: 0 0 0.75rem; }
  `]
})
export class JSADetailComponent implements OnInit {
  jsa: JSA | null = null;
  loading = true;

  showRejectForm = false;
  showFlagForm = false;
  showStopForm = false;
  rejectComments = '';
  flagType = 'ASSISTANCE';
  flagReason = '';
  stopSeverity = 'MAJOR';
  stopReason = '';

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadJSA(id);
  }

  loadJSA(id: string): void {
    this.api.getJSA(id).subscribe({
      next: (jsa) => { this.jsa = jsa; this.loading = false; },
      error: () => { this.loading = false; this.router.navigate(['/jsas']); },
    });
  }

  submitJSA(): void {
    if (!this.jsa) return;
    this.api.submitJSA(this.jsa.id).subscribe({ next: (jsa) => this.jsa = jsa });
  }

  approveJSA(): void {
    if (!this.jsa) return;
    this.api.approveJSA(this.jsa.id).subscribe({ next: (jsa) => this.jsa = jsa });
  }

  rejectJSA(): void {
    if (!this.jsa) return;
    this.api.rejectJSA(this.jsa.id, this.rejectComments).subscribe({
      next: (jsa) => { this.jsa = jsa; this.showRejectForm = false; this.rejectComments = ''; },
    });
  }

  closeJSA(): void {
    if (!this.jsa) return;
    this.api.closeJSA(this.jsa.id).subscribe({ next: (jsa) => this.jsa = jsa });
  }

  createFlag(): void {
    if (!this.jsa) return;
    this.api.createFlag({
      jsaId: this.jsa.id, flagType: this.flagType, reason: this.flagReason,
    }).subscribe({
      next: () => { this.showFlagForm = false; this.flagReason = ''; this.loadJSA(this.jsa!.id); },
    });
  }

  createStopJob(): void {
    if (!this.jsa) return;
    this.api.createStopJob({
      jsaId: this.jsa.id, reason: this.stopReason, severity: this.stopSeverity,
    }).subscribe({
      next: () => { this.showStopForm = false; this.stopReason = ''; this.loadJSA(this.jsa!.id); },
    });
  }
}
