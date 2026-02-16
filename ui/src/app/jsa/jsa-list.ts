import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { JSA, PaginatedResponse } from '../models';

@Component({
  selector: 'app-jsa-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="jsa-list">
      <div class="header">
        <h1>Job Safety Assessments</h1>
        @if (auth.hasRole('TECHNICIAN')) {
          <a routerLink="/jsas/new" class="btn-primary">New JSA</a>
        }
      </div>

      <div class="filters">
        <select [(ngModel)]="filterStatus" (change)="loadJSAs()">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="STOPPED">Stopped</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      @if (loading) { <p>Loading...</p> }

      <table class="data-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Job Type</th>
            <th>Location</th>
            <th>Created By</th>
            <th>Score</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          @for (jsa of jsas; track jsa.id) {
            <tr>
              <td><a [routerLink]="['/jsas', jsa.id]">{{ jsa.referenceNumber }}</a></td>
              <td>{{ jsa.jobType }}</td>
              <td>{{ jsa.location }}</td>
              <td>{{ jsa.createdBy.firstName }} {{ jsa.createdBy.lastName }}</td>
              <td>
                @if (jsa.strengthScore) {
                  <span class="score" [class]="'score-' + jsa.strengthScore">{{ jsa.strengthScore }}/5</span>
                } @else { - }
              </td>
              <td><span class="badge" [class]="'badge-' + jsa.status.toLowerCase()">{{ jsa.status }}</span></td>
              <td>{{ jsa.createdAt | date:'shortDate' }}</td>
            </tr>
          }
          @if (!loading && jsas.length === 0) {
            <tr><td colspan="7" class="empty">No JSAs found</td></tr>
          }
        </tbody>
      </table>

      @if (total > limit) {
        <div class="pagination">
          <button [disabled]="page <= 1" (click)="page = page - 1; loadJSAs()">Previous</button>
          <span>Page {{ page }} of {{ Math.ceil(total / limit) }}</span>
          <button [disabled]="page * limit >= total" (click)="page = page + 1; loadJSAs()">Next</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    h1 { margin: 0; color: #1a365d; font-size: 1.5rem; }
    .btn-primary { background: #3182ce; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; font-size: 0.875rem; }
    .btn-primary:hover { background: #2c5282; }
    .filters { margin-bottom: 1rem; }
    .filters select { padding: 0.375rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.875rem; }
    .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-size: 0.875rem; }
    .data-table th { text-align: left; padding: 0.75rem; border-bottom: 2px solid #e2e8f0; color: #4a5568; font-weight: 600; background: #f7fafc; }
    .data-table td { padding: 0.75rem; border-bottom: 1px solid #edf2f7; }
    .data-table a { color: #3182ce; text-decoration: none; }
    .data-table a:hover { text-decoration: underline; }
    .empty { text-align: center; color: #a0aec0; padding: 2rem !important; }
    .badge { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .badge-draft { background: #edf2f7; color: #4a5568; }
    .badge-submitted { background: #bee3f8; color: #2a4365; }
    .badge-approved { background: #c6f6d5; color: #22543d; }
    .badge-rejected { background: #fed7d7; color: #742a2a; }
    .badge-stopped { background: #fed7d7; color: #742a2a; }
    .badge-closed { background: #e2e8f0; color: #4a5568; }
    .score { font-weight: 600; }
    .score-1, .score-2 { color: #e53e3e; }
    .score-3 { color: #d69e2e; }
    .score-4, .score-5 { color: #38a169; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1rem; }
    .pagination button { padding: 0.375rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 4px; background: white; cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class JSAListComponent implements OnInit {
  jsas: JSA[] = [];
  loading = true;
  page = 1;
  limit = 20;
  total = 0;
  filterStatus = '';
  Math = Math;

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadJSAs();
  }

  loadJSAs(): void {
    this.loading = true;
    const params: Record<string, string> = { page: this.page.toString(), limit: this.limit.toString() };
    if (this.filterStatus) params['status'] = this.filterStatus;
    this.api.getJSAs(params).subscribe({
      next: (res) => { this.jsas = res.data; this.total = res.total; this.loading = false; },
      error: () => this.loading = false,
    });
  }
}
