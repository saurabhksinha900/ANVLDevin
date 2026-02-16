import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { JSO, PaginatedResponse } from '../models';

@Component({
  selector: 'app-jso-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="jso-list">
      <h1>JSO Queue</h1>
      <div class="filters">
        <select [(ngModel)]="filterStatus" (change)="loadJSOs()">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      @if (loading) { <p>Loading...</p> }

      <table class="data-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>JSA</th>
            <th>Event Type</th>
            <th>Reason</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          @for (jso of jsos; track jso.id) {
            <tr>
              <td><a [routerLink]="['/jsos', jso.id]">{{ jso.referenceNumber }}</a></td>
              <td>
                @if (jso.jsa) {
                  <a [routerLink]="['/jsas', jso.jsa.id]">{{ jso.jsa.referenceNumber }}</a>
                }
              </td>
              <td>{{ jso.event?.eventType || '-' }}</td>
              <td>{{ jso.event?.reason || '-' }}</td>
              <td>{{ jso.assignedTo.firstName }} {{ jso.assignedTo.lastName }}</td>
              <td><span class="badge" [class]="'badge-' + jso.status.toLowerCase()">{{ jso.status }}</span></td>
              <td>{{ jso.createdAt | date:'shortDate' }}</td>
            </tr>
          }
          @if (!loading && jsos.length === 0) {
            <tr><td colspan="7" class="empty">No JSOs found</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    h1 { margin: 0 0 1rem; color: #1a365d; }
    .filters { margin-bottom: 1rem; }
    .filters select { padding: 0.375rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 4px; }
    .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-size: 0.875rem; }
    .data-table th { text-align: left; padding: 0.75rem; border-bottom: 2px solid #e2e8f0; color: #4a5568; font-weight: 600; background: #f7fafc; }
    .data-table td { padding: 0.75rem; border-bottom: 1px solid #edf2f7; }
    .data-table a { color: #3182ce; text-decoration: none; }
    .data-table a:hover { text-decoration: underline; }
    .empty { text-align: center; color: #a0aec0; padding: 2rem !important; }
    .badge { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .badge-pending { background: #fefcbf; color: #744210; }
    .badge-in_progress { background: #bee3f8; color: #2a4365; }
    .badge-completed { background: #c6f6d5; color: #22543d; }
  `]
})
export class JSOListComponent implements OnInit {
  jsos: JSO[] = [];
  loading = true;
  filterStatus = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadJSOs();
  }

  loadJSOs(): void {
    this.loading = true;
    const params: Record<string, string> = {};
    if (this.filterStatus) params['status'] = this.filterStatus;
    this.api.getJSOs(params).subscribe({
      next: (res) => { this.jsos = res.data; this.loading = false; },
      error: () => this.loading = false,
    });
  }
}
