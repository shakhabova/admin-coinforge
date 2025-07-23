import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('../layouts/home-layout/home-layout.component').then((m) => m.HomeLayoutComponent),
		children: [
			{
				path: 'users',
				loadComponent: () => import('../users/users.component').then((m) => m.UsersComponent),
				title: 'Users',
			},
			{
				path: 'wallets',
				loadChildren: () => import('../wallets-page/wallets-page.routes').then((m) => m.routes),
				title: 'Wallets',
			},
			{
				path: 'transactions',
				loadComponent: () =>
					import('../transactions-page/transactions-page.component').then((m) => m.TransactionsPageComponent),
				title: 'Transactions',
			},
			{
				path: '',
				redirectTo: '/users',
				pathMatch: 'full',
			},
		],
	},
];
