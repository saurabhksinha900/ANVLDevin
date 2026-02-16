import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./shared/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'jsas', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
        canActivate: [roleGuard('SUPERVISOR', 'HSE', 'ADMIN')],
      },
      { path: 'jsas', loadComponent: () => import('./jsa/jsa-list').then(m => m.JSAListComponent) },
      {
        path: 'jsas/new',
        loadComponent: () => import('./jsa/jsa-create').then(m => m.JSACreateComponent),
        canActivate: [roleGuard('TECHNICIAN')],
      },
      { path: 'jsas/:id', loadComponent: () => import('./jsa/jsa-detail').then(m => m.JSADetailComponent) },
      {
        path: 'jsos',
        loadComponent: () => import('./jso/jso-list').then(m => m.JSOListComponent),
        canActivate: [roleGuard('SUPERVISOR', 'HSE', 'ADMIN')],
      },
      { path: 'jsos/:id', loadComponent: () => import('./jso/jso-detail').then(m => m.JSODetailComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
