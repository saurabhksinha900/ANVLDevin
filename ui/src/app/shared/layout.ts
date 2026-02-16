import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout">
      <nav class="sidebar">
        <div class="brand">
          <h2>Connected Worker</h2>
          <span class="subtitle">JSA/JSO Platform</span>
        </div>
        <ul class="nav-links">
          @if (auth.hasRole('SUPERVISOR', 'HSE', 'ADMIN')) {
            <li><a routerLink="/dashboard" routerLinkActive="active">Dashboard</a></li>
          }
          <li><a routerLink="/jsas" routerLinkActive="active">JSA List</a></li>
          @if (auth.hasRole('TECHNICIAN')) {
            <li><a routerLink="/jsas/new" routerLinkActive="active">New JSA</a></li>
          }
          @if (auth.hasRole('SUPERVISOR', 'HSE', 'ADMIN')) {
            <li><a routerLink="/jsos" routerLinkActive="active">JSO Queue</a></li>
          }
        </ul>
        <div class="user-info">
          <div class="user-name">{{ auth.currentUser?.firstName }} {{ auth.currentUser?.lastName }}</div>
          <div class="user-role">{{ auth.currentUser?.role }}</div>
          <button class="logout-btn" (click)="auth.logout()">Sign Out</button>
        </div>
      </nav>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; background: #1a365d; color: white; display: flex; flex-direction: column; flex-shrink: 0; }
    .brand { padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .brand h2 { margin: 0; font-size: 1.1rem; }
    .brand .subtitle { font-size: 0.75rem; color: rgba(255,255,255,0.6); }
    .nav-links { list-style: none; padding: 0.5rem 0; margin: 0; flex: 1; }
    .nav-links li a { display: block; padding: 0.625rem 1.25rem; color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.875rem; transition: background 0.2s; }
    .nav-links li a:hover { background: rgba(255,255,255,0.1); }
    .nav-links li a.active { background: rgba(255,255,255,0.15); color: white; border-left: 3px solid #63b3ed; }
    .user-info { padding: 1rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .user-name { font-size: 0.875rem; font-weight: 500; }
    .user-role { font-size: 0.7rem; color: rgba(255,255,255,0.6); margin-bottom: 0.5rem; text-transform: capitalize; }
    .logout-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.375rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem; width: 100%; }
    .logout-btn:hover { background: rgba(255,255,255,0.2); }
    .content { flex: 1; background: #f7fafc; padding: 1.5rem; overflow-y: auto; }
  `]
})
export class LayoutComponent {
  constructor(public auth: AuthService) {}
}
