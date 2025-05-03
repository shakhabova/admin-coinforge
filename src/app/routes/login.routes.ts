import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('../layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
		children: [
			{
				path: '',
				loadComponent: () => import('../login/login.component').then((m) => m.LoginComponent),
			},
		],
	},
];
