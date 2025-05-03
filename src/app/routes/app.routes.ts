import { Routes } from '@angular/router';
import { authGuard } from 'guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('../routes/login.routes').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('../routes/home.routes').then((m) => m.routes),
    canActivate: [authGuard],
  },
];
