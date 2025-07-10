import * as R from 'remeda';
import { DatePipe, formatDate } from '@angular/common';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiButton, tuiDialog, TuiIcon } from '@taiga-ui/core';
import { LoaderComponent } from 'ui/loader/loader.component';
import { TuiTable } from '@taiga-ui/addon-table';
import { EmptyDisplayComponent } from 'ui/empty-display/empty-display.component';
import { ErrorDisplayComponent } from 'ui/error-display/error-display.component';
import { UserInfoDto, UserService, UsersFilterDto, UsersPagination } from 'shared/user.service';
import { UserStatusChipComponent } from './user-status-chip/user-status-chip.component';
import { UserActionsComponent } from './user-actions/user-actions.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from 'shared/dialog.service';
import { finalize } from 'rxjs';
import { UsersFilterComponent, UsersFilterModel } from './users-filter/users-filter.component';
import { TuiDay } from '@taiga-ui/cdk';
import { explicitEffect } from 'ngxtension/explicit-effect';

@Component({
	selector: 'app-users',
	imports: [
		TuiButton,
		TuiIcon,
		PaginatorModule,
		TuiTable,
		DatePipe,
		ReactiveFormsModule,
		LoaderComponent,
		EmptyDisplayComponent,
		ErrorDisplayComponent,
		UserStatusChipComponent,
		UserActionsComponent,
	],
	templateUrl: './users.component.html',
	styleUrl: './users.component.less',
})
export class UsersComponent implements OnInit {
	private dialogService = inject(DialogService);
	private destroyRef = inject(DestroyRef);
	private usersService = inject(UserService);

	private filtersDialog = tuiDialog(UsersFilterComponent);

	protected columns = ['id', 'customerId', 'fullName', 'contact', 'address', 'status', 'createdUpdatedAt', 'actions'];
	protected users = signal<UserInfoDto[]>([]);

	protected totalElements = signal(0);
	readonly pageSize = 10;
	page = signal(0);

	filters = signal<UsersFilterModel | null>(null);
	hasFilters = computed(() => !!this.filters());

	isLoading = signal(false);
	hasError = signal(false);
	displayError = computed(() => !this.isLoading() && this.hasError());
	displayEmpty = computed(() => !this.isLoading() && !this.users()?.length && !this.hasError());

	constructor() {
		explicitEffect([this.filters, this.page], () => this.loadUsers());
	}

	ngOnInit() {
		this.loadUsers();
	}

	openFilters() {
		this.filtersDialog(this.filters()).subscribe((filters) => this.filters.set(filters));
	}

	onPageChange(state: PaginatorState): void {
		if (state.page != null && state.page !== this.page()) {
			this.page.set(state.page);
		}
	}

	onUserUpdate() {
		this.loadUsers();
	}

	private loadUsers() {
		this.isLoading.set(true);
		this.hasError.set(false);
		const params: UsersFilterDto = R.pipe(
			R.entries(this.filters() ?? {}),
			R.filter((entry) => !!entry[1]),
			R.map(([key, value]) => {
				if (value instanceof TuiDay) {
					return [key, formatDate(value.toLocalNativeDate(), 'yyyy-MM-dd', 'en-US')] as [string, string];
				}

				return [key, value] as const;
			}),
			R.fromEntries(),
		);

		const pagination: UsersPagination = {
			pageSize: this.pageSize,
			page: this.page(),
		};
		this.usersService
			.getAll(params as Required<UsersFilterDto>, pagination)
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => this.isLoading.set(false)),
			)
			.subscribe({
				next: (response) => {
					this.users.set(response.data);
					this.totalElements.set(response.totalElements);
				},
				error: (err) => {
					this.hasError.set(true);
					console.error(err);
					this.dialogService
						.showInfo({
							type: 'warning',
							title: 'Error',
							text: 'An unexpected error has appeared. Please try again later.',
						})
						.subscribe();
				},
			});
	}
}
