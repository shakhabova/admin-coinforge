import { Component, DestroyRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiDropdown, TuiDataList, TuiIcon, TuiButton } from '@taiga-ui/core';
import { LoginApiService } from 'login/services/login-api.service';
import { Observable } from 'rxjs';
import { DialogService } from 'shared/dialog.service';
import { UserInfoDto, UserService, UserStatus } from 'shared/user.service';

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

  open = false;

  blockUser(): void {
    this.updateStatus(this.userService.blockUser(this.user().id));
  }

  unblockUser(): void {
    this.updateStatus(this.userService.unblockUser(this.user().id));
  }

  resendOtp(): void {
    this.updateStatus(this.loginApiService.resendOTP(this.user().email));
  }

  reject() {
    this.updateStatus(this.userService.rejectUser(this.user().id));
  }

  deactivate() {
    this.updateStatus(this.userService.deactivateUser(this.user().id));
  }

  private updateStatus(request: Observable<void>) {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.updated.emit(),
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
}
