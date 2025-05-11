import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TuiError, TuiLabel, TuiTextfield, tuiDialog } from '@taiga-ui/core';
import { TuiFieldErrorPipe, TuiInputPassword } from '@taiga-ui/kit';
import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { finalize } from 'rxjs';
import { AuthService } from '../shared/auth.service';
import {
  type AuthenticateResponse,
  LoginApiService,
} from './services//login-api.service';
import { LoaderComponent } from 'ui//loader/loader.component';
import { UserService } from 'shared/user.service';
import { DialogService } from 'shared/dialog.service';
import { MfaOtpCodeComponent } from './ui/mfa-otp-code/mfa-otp-code.component';

@Component({
  selector: 'app-login',
  imports: [
    TuiLabel,
    TuiInputModule,
    TuiTextfieldControllerModule,
    ReactiveFormsModule,
    TuiError,
    TuiFieldErrorPipe,
    AsyncPipe,
    TuiInputPassword,
    TuiTextfield,
    LoaderComponent,
    RouterModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private loginService = inject(LoginApiService);
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);
  private userService = inject(UserService);
  protected readonly loading = signal(false);

  private mfaOptDialog = tuiDialog(MfaOtpCodeComponent, { size: 'auto' });

  protected formGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit() {
    this.formGroup.updateValueAndValidity();
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }

    const email = this.formGroup.getRawValue().email;

    this.loading.set(true);
    this.loginService
      .login(this.formGroup.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          // this.authorize(response);
          if (response.role !== 'ADMIN') {
            this.dialogService
              .showInfo({
                type: 'error',
                title: 'Error',
                text: 'The specified user could not be found.',
              })
              .subscribe();
            return;
          }

          if (response.userStatus === 'FORCE_PASSWORD_CHANGE') {
            this.forceChangePass(email);
            return;
          }

          if (response.userStatus === 'ACTIVE') {
            // response.mfaStatus = 'PENDING' as MfaStatus;
            switch (response.mfaStatus) {
              case 'PENDING':
                this.askForMfa(email);
                break;
              case 'ACTIVATED':
                this.sendMfaOtpCode(email);
                break;
              case 'REJECTED':
                this.authorize(response);
                this.goToHome();
                break;
            }
          }
        },
        error: (err) => {
          console.error(err);
          switch (err.error?.code) {
            case 'user_not_found':
              this.dialogService
                .showInfo({
                  type: 'error',
                  title: 'Error',
                  text: 'The specified user could not be found.',
                })
                .subscribe();
              break;
            case 'unauthorized':
              this.dialogService
                .showInfo({
                  type: 'error',
                  title: 'Error',
                  text: 'Invalid credentials. Please try again.',
                })
                .subscribe();
              break;
            case 'temporary_blocked':
              this.dialogService
                .showInfo({
                  type: 'error',
                  title: 'Error',
                  text: 'Your account is temporarily blocked.',
                })
                .subscribe();
              break;
            case 'account_pending':
              this.dialogService
                .showInfo({
                  type: 'pending',
                  title: 'Pending',
                  text: 'Your account is currently pending approval',
                })
                .subscribe();
              break;
            case 'too_many_attempts':
              this.dialogService
                .showInfo({
                  type: 'error',
                  title: 'Error',
                  text: 'You have made too many incorrect attempts. Please try again later.',
                })
                .subscribe();
              break;
            case 'email_confirmation_pending':
              this.dialogService
                .showInfo({
                  type: 'error',
                  title: 'Error',
                  text: 'The specified user could not be found.',
                })
                .subscribe();
              break;
            default:
              this.dialogService
                .showInfo({
                  type: 'warning',
                  title: 'Error',
                  text: 'An unexpected error has appeared. Please try again later.',
                })
                .subscribe();
          }
        },
      });
  }

  private sendMfaOtpCode(email: string) {
    this.mfaOptDialog({ email })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (response) {
          this.authorize(response);
          this.goToHome();
        }
      });
  }

  private forceChangePass(email: string) {
    this.router.navigateByUrl('/auth/force-change-password', {
      state: { email },
    });
  }

  private askForMfa(email: string) {
    this.router.navigate(['/auth/two-factor-auth'], { queryParams: { email } });
  }

  private goToHome() {
    this.router.navigateByUrl('/');
  }

  private authorize(response: AuthenticateResponse) {
    this.authService.saveToken(response.accessToken, response.refreshToken);
    this.userService.updateCurrentUser();
  }
}
