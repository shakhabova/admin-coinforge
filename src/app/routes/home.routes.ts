import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../layouts/home-layout/home-layout.component').then(
        (m) => m.HomeLayoutComponent,
      ),
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('../users/users.component').then((m) => m.UsersComponent),
        title: 'Users',
      },
      {
        path: '',
        redirectTo: '/users',
        pathMatch: 'full',
      },
    ],
  },
];
