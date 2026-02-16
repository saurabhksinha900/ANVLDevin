import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { DashboardData } from '../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      @if (loading) {
        <p>Loading...</p>
      }
      @if (data) {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ data.summary.totalJSAs }}</div>
            <div class="stat-label">Total JSAs</div>
          </div>
          <div class="stat-card highlight-blue">
            <div class="stat-value">{{ data.summary.jsasByStatus['SUBMITTED'] || 0 }}</div>
            <div class="stat-label">Pending Review</div>
          </div>
          <div class="stat-card highlight-orange">
            <div class="stat-value">{{ data.summary.openFlags }}</div>
            <div class="stat-label">Open Flags</div>
          </div>
          <div class="stat-card highlight-red">
            <div class="stat-value">{{ data.summary.openStopJobs }}</div>
            <div class="stat-label">Stop Jobs</div>
          </div>
          <div class="stat-card highlight-yellow">
            <div class="stat-value">{{ data.summary.pendingJSOs }}</div>
            <div class="stat-label">Pending JSOs</div>
          </div>
          <div class="stat-card highlight-green">
            <div class="stat-value">{{ data.summary.averageStrengthScore || 'N/A' }}</div>
            <div class="stat-label">Avg Strength Score</div>
          </div>
        </div>

        <div class="section">
          <h2>Recent JSAs</h2>
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
              @for (jsa of data.recentJSAs; track jsa.id) {
                <tr>
                  <td><a [routerLink]="['/jsas', jsa.id]">{{ jsa.referenceNumber }}</a></td>
                  <td>{{ jsa.jobType }}</td>
                  <td>{{ jsa.location }}</td>
                  <td>{{ jsa.createdBy.firstName }} {{ jsa.createdBy.lastName }}</td>
                  <td>
                    @if (jsa.strengthScore) {
                      <span class="score" [class]="'score-' + jsa.strengthScore">{{ jsa.strengthScore }}/5</span>
                    } @else {
                      <span class="score-na">-</span>
                    }
                  </td>
                  <td><span class="badge" [class]="'badge-' + jsa.status.toLowerCase()">{{ jsa.status }}</span></td>
                  <td>{{ jsa.createdAt | date:'short' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard h1 { margin: 0 0 1.5rem; color: #1a365d; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: white; padding: 1.25rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 2rem; font-weight: 700; color: #2d3748; }
    .stat-label { font-size: 0.8rem; color: #718096; margin-top: 0.25rem; }
    .highlight-blue .stat-value { color: #3182ce; }
    .highlight-orange .stat-value { color: #dd6b20; }
    .highlight-red .stat-value { color: #e53e3e; }
    .highlight-yellow .stat-value { color: #d69e2e; }
    .highlight-green .stat-value { color: #38a169; }
    .section { background: white; border-radius: 8px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section h2 { margin: 0 0 1rem; font-size: 1.1rem; color: #2d3748; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .data-table th { text-align: left; padding: 0.625rem 0.75rem; border-bottom: 2px solid #e2e8f0; color: #4a5568; font-weight: 600; }
    .data-table td { padding: 0.625rem 0.75rem; border-bottom: 1px solid #edf2f7; }
    .data-table a { color: #3182ce; text-decoration: none; }
    .data-table a:hover { text-decoration: underline; }
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
    .score-na { color: #a0aec0; }
  `]
})
export class DashboardComponent implements OnInit {
  data: DashboardData | null = null;
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getDashboard().subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: () => this.loading = false,
    });
  }
}
