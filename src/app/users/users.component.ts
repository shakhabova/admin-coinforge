import { DatePipe } from '@angular/common';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { LoaderComponent } from 'ui/loader/loader.component';
import { TuiTable } from '@taiga-ui/addon-table';
import { EmptyDisplayComponent } from 'ui/empty-display/empty-display.component';
import { ErrorDisplayComponent } from 'ui/error-display/error-display.component';
import { UserInfoDto, UserService } from 'shared/user.service';
import { UserStatusChipComponent } from './user-status-chip/user-status-chip.component';
import { UserActionsComponent } from './user-actions/user-actions.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from 'shared/dialog.service';
import { finalize } from 'rxjs';

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

  protected columns = [
    'id',
    'customerId',
    'fullName',
    'contact',
    'address',
    'status',
    'createdUpdatedAt',
    'actions',
  ];
  protected users = signal<UserInfoDto[]>([]);
  pagedUsers = computed(() =>
    this.users().slice(
      this.pageSize * this.page(),
      this.pageSize * this.page() + this.pageSize,
    ),
  );

  protected totalElements = signal(0);
  readonly pageSize = 5;
  page = signal(0);

  filters = signal(null);
  hasFilters = computed(() => !!this.filters());

  isLoading = signal(false);
  hasError = signal(false);
  displayError = computed(() => !this.isLoading() && this.hasError());
  displayEmpty = computed(
    () => !this.isLoading() && !this.users()?.length && !this.hasError(),
  );

  ngOnInit() {
    this.loadUsers();
  }

  openFilters() {}

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
    this.usersService
      .getAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.page.set(0);
          this.totalElements.set(users.length);
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
