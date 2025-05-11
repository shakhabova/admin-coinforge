import { Component, inject } from '@angular/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TuiDataList, TuiDialogContext, TuiError } from '@taiga-ui/core';
import { UserStatus } from 'shared/user.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TuiInputDateModule,
  TuiInputModule,
  TuiSelectModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { AsyncPipe } from '@angular/common';
import {
  TuiDataListWrapper,
  TuiFieldErrorPipe,
  TuiSelect,
  tuiValidationErrorsProvider,
} from '@taiga-ui/kit';
import { TuiDay } from '@taiga-ui/cdk';

export interface UsersFilterModel {
  dateFrom?: TuiDay;
  dateTo?: TuiDay;
  customerId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  country?: string;
  city?: string;
  status?: UserStatus;
}

@Component({
  selector: 'app-users-filter',
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TuiInputDateModule,
    TuiInputModule,
    TuiError,
    TuiFieldErrorPipe,
    TuiTextfieldControllerModule,
    TuiDataList,
    TuiDataListWrapper,
    TuiSelectModule,
  ],
  templateUrl: './users-filter.component.html',
  styleUrl: './users-filter.component.scss',
  providers: [
    tuiValidationErrorsProvider({
      email: 'Please enter a valid email, e.g., name@example.com',
    }),
  ],
})
export class UsersFilterComponent {
  public context =
    injectContext<
      TuiDialogContext<UsersFilterModel | null, UsersFilterModel | null>
    >();

  fb = inject(FormBuilder);

  formGroup = this.fb.nonNullable.group({
    dateFrom: this.context.data?.dateFrom ?? undefined,
    dateTo: this.context.data?.dateTo ?? undefined,
    customerId: this.context.data?.customerId ?? undefined,
    firstName: this.context.data?.firstName ?? undefined,
    lastName: this.context.data?.lastName ?? undefined,
    email: [this.context.data?.email ?? undefined, Validators.email],
    country: this.context.data?.country ?? undefined,
    city: this.context.data?.city ?? undefined,
    status: this.context.data?.status ?? undefined,
  });

  statuses = [
    'EMAIL_NOT_CONFIRMED',
    'PENDING',
    'ACTIVE',
    'BLOCKED',
    'REJECTED',
  ];

  onApply() {
    if (this.formGroup.invalid) {
      return;
    }

    this.context.completeWith(this.formGroup.getRawValue());
  }

  onClear() {
    this.context.completeWith(null);
  }
}
