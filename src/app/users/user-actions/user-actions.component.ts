import { Component, DestroyRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  TuiDropdown,
  TuiDataList,
  TuiIcon,
  TuiButton,
  tuiDialog,
} from '@taiga-ui/core';
import { LoginApiService } from 'login/services/login-api.service';
import { filter, Observable, of, switchMap } from 'rxjs';
import { DialogService } from 'shared/dialog.service';
import { UserInfoDto, UserService, UserStatus } from 'shared/user.service';
import {
  UserActionConfirmComponent,
  UserActionConfirmType,
} from './user-action-confirm.component';

@Component({
  selector: 'app-user-actions',
  imports: [TuiDropdown, TuiDataList, TuiIcon, TuiButton],
  templateUrl: './user-actions.component.html',
  styleUrl: './user-actions.component.scss',
})
export class UserActionsComponent {
  user = input.required<UserInfoDto>();
  updated = output();

  private loginApiService = inject(LoginApiService);
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  private dialogService = inject(DialogService);

  private confirmDialog = tuiDialog(UserActionConfirmComponent);

  open = false;

  blockUser(): void {
    this.updateStatus(this.userService.blockUser(this.user().id), 'block');
  }

  unblockUser(): void {
    this.updateStatus(this.userService.unblockUser(this.user().id), 'unblock');
  }

  resendOtp(): void {
    this.loginApiService
      .resendOTP(this.user().email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updated.emit();
          this.dialogService
            .showInfo({
              type: 'success',
              title: 'OTP has been successfully resent!',
            })
            .subscribe();
        },
        error: (err) => {
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

  reject() {
    this.updateStatus(this.userService.rejectUser(this.user().id), 'reject');
  }

  activate() {
    this.updateStatus(
      this.userService.activateUser(this.user().id),
      'activate',
    );
  }

  deactivate() {
    this.updateStatus(
      this.userService.deactivateUser(this.user().id),
      'deactivate',
    );
  }

  private updateStatus(
    request: Observable<void>,
    statusToConfirm: UserActionConfirmType,
  ) {
    this.confirmation(statusToConfirm)
      .pipe(
        switchMap(() => request),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.updated.emit();
          this.dialogService
            .showInfo({
              type: 'success',
              title: `This user has been successfully ${statusToConfirm}${statusToConfirm.endsWith('e') ? 'd' : 'ed'}!`,
            })
            .subscribe();
        },
        error: (err) => {
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

  private confirmation(statusToConfirm: UserActionConfirmType) {
    return this.confirmDialog(statusToConfirm).pipe(filter((val) => !!val));
  }
}
