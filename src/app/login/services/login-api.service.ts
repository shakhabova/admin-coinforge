import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'shared/config.service';
import { type Observable, switchMap } from 'rxjs';
import { SrpClientService } from 'shared/srp-client.service';
import { MfaStatus } from 'shared/user.service';

export interface LoginChallengeResponse {
	salt: string;
	b: string;
}

export interface LoginModel {
	email: string;
	password: string;
}

export interface AuthenticateResponse {
	userStatus: AuthenticateUserStatus;
	mfaStatus: MfaStatus;
	accessToken?: string;
	refreshToken?: string;
	role?: string;
}

export interface TokenResponse {
	accessToken: string;
	refreshToken: string;
}

export interface SubmitResetPasswordRequest {
	email: string;
	password: string;
	salt: string;
	b: string;
	otp: string;
}

export type AuthenticateUserStatus = 'FORCE_PASSWORD_CHANGE' | 'ACTIVE';

@Injectable({ providedIn: 'root' })
export class LoginApiService {
	private httpClient = inject(HttpClient);
	private configService = inject(ConfigService);
	private srpClientService = inject(SrpClientService);

	public challenge(email: string): Observable<LoginChallengeResponse> {
		return this.httpClient.post<LoginChallengeResponse>(`${this.configService.serverUrl}/v1/auth/srp/challenge`, {
			email,
		});
	}

	public login(value: LoginModel): Observable<AuthenticateResponse> {
		return this.challenge(value.email).pipe(
			switchMap((challenge) => {
				const srpClient = this.srpClientService.srpClient();
				srpClient.step1(value.email, value.password);
				const { A, M1 } = srpClient.step2(challenge.salt, challenge.b);

				const request = { a: A, m1: M1, email: value.email };
				return this.httpClient.post<AuthenticateResponse>(
					`${this.configService.serverUrl}/v1/auth/srp/authenticate`,
					request,
				);
			}),
		);
	}

	public forceChangePassword(email: string, password: string): Observable<{ data: string }> {
		return this.challenge(email).pipe(
			switchMap((challenge) => {
				const srpClient = this.srpClientService.srpClient();
				srpClient.step1(email, password);
				const { A, M1 } = srpClient.step2(challenge.salt, challenge.b);

				const request = { a: A, m1: M1, email };
				return this.httpClient.post<{ data: string }>(
					`${this.configService.serverUrl}/v1/auth/srp/force-change-password`,
					request,
				);
			}),
		);
	}

	public sendMfaOtpCode(otp: string, email: string): Observable<AuthenticateResponse> {
		return this.httpClient.post<AuthenticateResponse>(`${this.configService.serverUrl}/v1/auth/srp/check-mfa`, {
			otp,
			email,
		});
	}

	public resetPassword(email: string): Observable<void> {
		return this.httpClient.post<void>(`${this.configService.serverUrl}/v1/auth/srp/reset-password`, { email });
	}

	public submitResetPassword(params: SubmitResetPasswordRequest): Observable<void> {
		const srpClient = this.srpClientService.srpClient();
		srpClient.step1(params.email, params.password);
		const verifier = srpClient.generateVerifier(params.salt, params.email, params.password);
		const { A, M1 } = srpClient.step2(params.salt, params.b);
		const body = {
			email: params.email,
			otp: params.otp,
			aNew: A,
			salt: params.salt,
			verifier,
			m1New: M1,
		};

		return this.httpClient.post<void>(`${this.configService.serverUrl}/v1/auth/srp/reset-password/submit`, body);
	}

	resendOTP(email: string): Observable<void> {
		return this.httpClient.post<void>(`${this.configService.serverUrl}/v1/users/registration/otp/resend`, { email });
	}
}
