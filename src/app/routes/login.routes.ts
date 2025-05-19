import { Routes } from '@angular/router';
import { MfaConnectComponent } from 'login/mfa-connect/mfa-connect.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../layouts/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../login/login.component').then((m) => m.LoginComponent),
        title: 'Login',
      },
      {
        path: 'mfa-connect',
        loadComponent: () =>
          import('../login/mfa-connect/mfa-connect.component').then(
            (m) => m.MfaConnectComponent,
          ),
        title: 'Two-Factor Authentication',
      },
    ],
  },
];
