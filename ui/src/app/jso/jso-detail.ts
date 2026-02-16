import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { JSO } from '../models';

@Component({
  selector: 'app-jso-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    @if (loading) { <p>Loading...</p> }
    @if (jso) {
      <div class="jso-detail">
        <div class="header">
          <div>
            <h1>{{ jso.referenceNumber }}</h1>
            <span class="badge" [class]="'badge-' + jso.status.toLowerCase()">{{ jso.status }}</span>
          </div>
          <div class="actions">
            @if (jso.status === 'PENDING' && auth.currentUser?.id === jso.assignedTo.id) {
              <button class="btn-primary" (click)="startWork()">Start Work</button>
            }
            @if ((jso.status === 'PENDING' || jso.status === 'IN_PROGRESS') && auth.currentUser?.id === jso.assignedTo.id) {
              <button class="btn-approve" (click)="showCompleteForm = true">Complete</button>
            }
          </div>
        </div>

        <section class="card">
          <h2>Details</h2>
          <div class="info-grid">
            <div><label>JSA</label><a [routerLink]="['/jsas', jso.jsa?.id]">{{ jso.jsa?.referenceNumber }}</a></div>
            <div><label>Event</label><span>{{ jso.event?.eventType }} - {{ jso.event?.severity }}</span></div>
            <div><label>Assigned To</label><span>{{ jso.assignedTo.firstName }} {{ jso.assignedTo.lastName }}</span></div>
            <div><label>Status</label><span>{{ jso.status }}</span></div>
            <div class="full"><label>Reason</label><span>{{ jso.event?.reason }}</span></div>
          </div>
        </section>

        @if (jso.rootCause) {
          <section class="card">
            <h2>Investigation Results</h2>
            <div class="info-grid">
              <div class="full"><label>Root Cause</label><span>{{ jso.rootCause }}</span></div>
              <div class="full"><label>Corrective Actions</label><span>{{ jso.correctiveActions }}</span></div>
              @if (jso.preventiveActions) {
                <div class="full"><label>Preventive Actions</label><span>{{ jso.preventiveActions }}</span></div>
              }
              @if (jso.resolutionNotes) {
                <div class="full"><label>Resolution Notes</label><span>{{ jso.resolutionNotes }}</span></div>
              }
              @if (jso.completedBy) {
                <div><label>Completed By</label><span>{{ jso.completedBy.firstName }} {{ jso.completedBy.lastName }}</span></div>
                <div><label>Completed At</label><span>{{ jso.completedAt | date:'medium' }}</span></div>
              }
            </div>
          </section>
        }

        @if (showCompleteForm) {
          <section class="card">
            <h2>Complete Investigation</h2>
            <div class="form-group">
              <label>Root Cause *</label>
              <textarea [(ngModel)]="completeData.rootCause" rows="3" placeholder="What was the root cause?"></textarea>
            </div>
            <div class="form-group">
              <label>Corrective Actions *</label>
              <textarea [(ngModel)]="completeData.correctiveActions" rows="3" placeholder="What actions were taken?"></textarea>
            </div>
            <div class="form-group">
              <label>Preventive Actions</label>
              <textarea [(ngModel)]="completeData.preventiveActions" rows="2" placeholder="Future prevention measures"></textarea>
            </div>
            <div class="form-group">
              <label>Resolution Notes</label>
              <textarea [(ngModel)]="completeData.resolutionNotes" rows="2" placeholder="Additional notes"></textarea>
            </div>
            <div class="form-actions">
              <button class="btn-approve" (click)="complete()" [disabled]="!completeData.rootCause.trim() || !completeData.correctiveActions.trim()">Complete JSO</button>
              <button class="btn-secondary" (click)="showCompleteForm = false">Cancel</button>
            </div>
          </section>
        }
      </div>
    }
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    h1 { margin: 0; color: #1a365d; font-size: 1.5rem; display: inline; }
    .badge { padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-left: 0.5rem; vertical-align: middle; }
    .badge-pending { background: #fefcbf; color: #744210; }
    .badge-in_progress { background: #bee3f8; color: #2a4365; }
    .badge-completed { background: #c6f6d5; color: #22543d; }
    .actions { display: flex; gap: 0.5rem; }
    .btn-primary { background: #3182ce; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .btn-approve { background: #38a169; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .btn-secondary { background: white; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .card { background: white; border-radius: 8px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1rem; }
    .card h2 { margin: 0 0 1rem; font-size: 1rem; color: #2d3748; border-bottom: 1px solid #edf2f7; padding-bottom: 0.5rem; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .info-grid .full { grid-column: 1 / -1; }
    .info-grid label { font-size: 0.7rem; color: #718096; text-transform: uppercase; }
    .info-grid span, .info-grid a { display: block; font-size: 0.875rem; color: #2d3748; }
    .info-grid a { color: #3182ce; text-decoration: none; }
    .form-group { margin-bottom: 0.75rem; }
    .form-group label { display: block; font-size: 0.8rem; font-weight: 500; margin-bottom: 0.25rem; color: #4a5568; }
    textarea { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; box-sizing: border-box; }
    .form-actions { display: flex; gap: 0.5rem; }
  `]
})
export class JSODetailComponent implements OnInit {
  jso: JSO | null = null;
  loading = true;
  showCompleteForm = false;
  completeData = { rootCause: '', correctiveActions: '', preventiveActions: '', resolutionNotes: '' };

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getJSO(id).subscribe({
      next: (jso) => { this.jso = jso; this.loading = false; },
      error: () => { this.loading = false; this.router.navigate(['/jsos']); },
    });
  }

  startWork(): void {
    if (!this.jso) return;
    this.api.startJSO(this.jso.id).subscribe({ next: (jso) => this.jso = jso });
  }

  complete(): void {
    if (!this.jso) return;
    this.api.completeJSO(this.jso.id, this.completeData).subscribe({
      next: (jso) => { this.jso = jso; this.showCompleteForm = false; },
    });
  }
}
