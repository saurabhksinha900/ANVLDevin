import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>Connected Worker</h1>
        <h2>JSA/JSO Safety Platform</h2>
        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" required placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" required placeholder="Enter your password" />
          </div>
          @if (error) {
            <div class="error">{{ error }}</div>
          }
          <button type="submit" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        <div class="demo-accounts">
          <p>Demo accounts (password: Password123!):</p>
          <ul>
            <li><button (click)="fillDemo('tech1&#64;connected-worker.local')">Technician</button></li>
            <li><button (click)="fillDemo('supervisor&#64;connected-worker.local')">Supervisor</button></li>
            <li><button (click)="fillDemo('hse&#64;connected-worker.local')">HSE</button></li>
            <li><button (click)="fillDemo('admin&#64;connected-worker.local')">Admin</button></li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; }
    .login-card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 400px; max-width: 90vw; }
    h1 { margin: 0 0 0.25rem; color: #1a365d; font-size: 1.5rem; text-align: center; }
    h2 { margin: 0 0 1.5rem; color: #718096; font-size: 0.9rem; text-align: center; font-weight: 400; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.25rem; font-weight: 500; font-size: 0.875rem; color: #4a5568; }
    input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.875rem; box-sizing: border-box; }
    input:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49,130,206,0.1); }
    button[type="submit"] { width: 100%; padding: 0.625rem; background: #3182ce; color: white; border: none; border-radius: 4px; font-size: 0.875rem; cursor: pointer; margin-top: 0.5rem; }
    button[type="submit"]:hover { background: #2c5282; }
    button[type="submit"]:disabled { background: #a0aec0; cursor: not-allowed; }
    .error { color: #e53e3e; font-size: 0.8rem; margin-bottom: 0.5rem; padding: 0.5rem; background: #fff5f5; border-radius: 4px; }
    .demo-accounts { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
    .demo-accounts p { font-size: 0.75rem; color: #718096; margin: 0 0 0.5rem; }
    .demo-accounts ul { list-style: none; padding: 0; display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .demo-accounts button { background: #edf2f7; border: 1px solid #e2e8f0; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }
    .demo-accounts button:hover { background: #e2e8f0; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  fillDemo(email: string): void {
    this.email = email;
    this.password = 'Password123!';
  }

  onSubmit(): void {
    this.error = '';
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        const user = this.auth.currentUser;
        if (user?.role === 'TECHNICIAN') {
          this.router.navigate(['/jsas']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error?.message || 'Login failed';
      }
    });
  }
}
