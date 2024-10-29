import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequestDto } from '../models/login-request-dto.model';
import { LoginResponseDto } from '../models/login-response.model';
import { Role } from '../enums/roles.enum';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private loginResponseDto: LoginResponseDto | null = null;

	private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

	constructor(private http: HttpClient) { }

	public login(loginRequest: LoginRequestDto): Observable<HttpResponse<LoginResponseDto>> {
		return this.http.post<LoginResponseDto>(`${environment.apiPath}/authenticate`, loginRequest, {
			headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
			observe: 'response'
		}).pipe(
			tap(() => {
				this.isAuthenticatedSubject.next(true);
			})
		);
	}

	public refreshToken(): Observable<HttpResponse<LoginResponseDto>> {
		const url = `${environment.apiPath}/authenticate/refreshToken`;
		return this.http.post<LoginResponseDto>(url, {},
			{
				withCredentials: true,
				observe: 'response'
			});
	}

	public getTokenInfo(): Observable<HttpResponse<LoginResponseDto>> {
		const url = `${environment.apiPath}/authenticate/token/details`;
		return this.http.get<LoginResponseDto>(url, {
			withCredentials: true,
			observe: 'response'
		}).pipe(
			tap((response: HttpResponse<LoginResponseDto>) => {
				this.loginResponseDto = response.body;
				this.isAuthenticatedSubject.next(this.isTokenValid());
			})
		);
	}

	public verifyOtpCode(otpCode: number): Observable<HttpResponse<LoginResponseDto>> {
		const params = new HttpParams().set('otpCode', otpCode)
		return this.http.post<LoginResponseDto>(`${environment.apiPath}/authenticate/validateOtp`, {}, {
			headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
			params: params,
			observe: 'response'
		}).pipe(
			tap((response: HttpResponse<LoginResponseDto>) => {
				this.loginResponseDto = response.body;
				this.isAuthenticatedSubject.next(this.isTokenValid());
			})
		);
	}

	public resendOtp(): Observable<void> {
		return this.http.post<void>(`${environment.apiPath}/authenticate/resendOtp`, {}, {
			withCredentials: true,
		});
	}

	public setDto(login: LoginResponseDto) {
		this.loginResponseDto = login;
		this.isAuthenticatedSubject.next(this.isTokenValid());
	}

	public isRoleManager(): boolean {
		return this.getRole() === Role.MANAGER;
	}

	public logout(): Observable<void> {
		return this.logoutAndClearCookies().pipe(
			tap(() => {
				this.clearUser();
				this.isAuthenticatedSubject.next(false);
			})
		);
	}

	public isAuthenticatedObservable(): Observable<boolean> {
		return this.isAuthenticatedSubject.asObservable();
	}

	public getRole(): string | null {
		return this.loginResponseDto?.role || null;
	}

	public isTokenValid(): boolean {
		return this.loginResponseDto ? new Date() < new Date(this.loginResponseDto.expirationDate) : false;
	}

	public isRememberMeActive(): boolean | null {
		return this.loginResponseDto?.rememberMe || null;
	}

	private logoutAndClearCookies(): Observable<void> {
		const url = `${environment.apiPath}/logout`;
		return this.http.post<void>(url, {}, { withCredentials: true });
	}

	private clearUser(): void {
		this.loginResponseDto = null;
		this.isAuthenticatedSubject.next(false);
	}
}
