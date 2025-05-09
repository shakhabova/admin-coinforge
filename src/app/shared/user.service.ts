import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, finalize, map, type Observable, of, tap } from 'rxjs';
import { ConfigService } from './config.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface UserInfoDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  city: string;
  zipCode: string;
  address: string;
  status: UserStatus;
  mfaStatus: MfaStatus;
  role: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  customerId: number;
}

export type UserStatus =
  | 'EMAIL_NOT_CONFIRMED'
  | 'PENDING'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'REJECTED';

export type MfaStatus = 'REJECTED' | 'PENDING' | 'ACTIVATED';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpClient = inject(HttpClient);
  private configService = inject(ConfigService);
  private destroyRef = inject(DestroyRef);

  currentUser$ = new BehaviorSubject<UserInfoDto | null>(null);
  currentUserUpdating$ = new BehaviorSubject<boolean>(false);
  currentUserId$ = this.currentUser$.pipe(map((info) => info?.id));

  constructor() {
    this.updateCurrentUser();
  }

  getAll(): Observable<UserInfoDto[]> {
    return this.httpClient.get<UserInfoDto[]>(
      `${this.configService.serverUrl}/v1/users/all`,
    );
  }

  getInfo(): Observable<UserInfoDto> {
    return this.httpClient.get<UserInfoDto>(
      `${this.configService.serverUrl}/v1/users/current`,
    );
  }

  updateCurrentUser() {
    this.currentUserUpdating$.next(true);
    this.getInfo()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.currentUserUpdating$.next(false);
        }),
      )
      .subscribe({
        next: (info) => this.currentUser$.next(info),
      });
  }

  getUser(email: string): Observable<UserInfoDto> {
    return this.httpClient.get<UserInfoDto>(
      `${this.configService.serverUrl}/v1/internal/users`,
      {
        params: { email: decodeURIComponent(email) },
      },
    );
  }

  clearCurrentUser(): void {
    this.currentUser$.next(null);
  }

  blockUser(userId: number): Observable<void> {
    return this.httpClient.put<void>(
      `${this.configService.serverUrl}/v1/users/block`,
      {
        currentUserId: this.currentUser$.value?.id,
        validData: true,
        userId,
      },
    );
  }

  unblockUser(userId: number): Observable<void> {
    return this.httpClient.put<void>(
      `${this.configService.serverUrl}/v1/users/unblock`,
      {
        currentUserId: this.currentUser$.value?.id,
        validData: true,
        userId,
      },
    );
  }

  rejectUser(userId: number): Observable<void> {
    return this.httpClient.put<void>(
      `${this.configService.serverUrl}/v1/users/${userId}/reject`,
      null,
    );
  }

  activateUser(userId: number): Observable<void> {
    return this.httpClient.put<void>(
      `${this.configService.serverUrl}/v1/users/status`,
      {
        userIds: [userId],
        status: 'ACTIVE',
      },
    );
  }

  deactivateUser(userId: number): Observable<void> {
    return this.httpClient.put<void>(
      `${this.configService.serverUrl}/v1/users/status`,
      {
        userIds: [userId],
        status: 'REJECTED',
      },
    );
  }
}
