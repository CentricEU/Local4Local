/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CaptchaStatus } from '../_enums/captcha.enum';
import { CaptchaService } from '../services/captcha.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarType } from '../_enums/snackbar-type.enum';
import { CustomSnackbarComponent } from '../components/custom-snackbar/custom-snackbar.component';
import { SnackbarData } from '../models/snackbar-data.model';
import { commonRoutingConstants } from '../_constants/common-routing.constants';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LoginResponseDto } from '../models/login-response.model';
import {
	ALREADY_REGISTERED_CODE,
	CAPTCHA_SHOW,
	CREDENTIALS_INVALID,
	JWT_EXPIRED,
	JWT_NOT_FOUND,
	OTP_NOT_FOUND
} from '../_constants/error-constants';

@Injectable()
export class ErrorCatchingInterceptor implements HttpInterceptor {
	private shownErrorCodes = new Set<string>();

	private router = inject(Router);
	private authService = inject(AuthService);
	private snackBar = inject(MatSnackBar);
	private captchaService = inject(CaptchaService);
	private translateService = inject(TranslateService);

	private skippedErrorCodes = [ALREADY_REGISTERED_CODE];

	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		return next.handle(request).pipe(
			catchError((error: HttpErrorResponse) => {
				const customErrorCode = error.error;

				if (customErrorCode && this.skippedErrorCodes.includes(customErrorCode.message)) {
					return throwError(() => error);
				}

				if (customErrorCode) {
					return this.handleCustomError(error, request, next);
				}

				return throwError(() => error);
			})
		);
	}

	private handleCustomError(
		error: HttpErrorResponse,
		request: HttpRequest<unknown>,
		next: HttpHandler
	): Observable<HttpEvent<unknown>> {
		const customErrorCode = error.error;
		const errorCodes = [JWT_NOT_FOUND, OTP_NOT_FOUND];

		switch (customErrorCode.message) {
			case CREDENTIALS_INVALID:
				this.handleCaptcha(CaptchaStatus.INVALID_CREDENTIALS);
				break;
			case CAPTCHA_SHOW:
				this.handleCaptcha(CaptchaStatus.CREATED);
				break;
			case JWT_EXPIRED:
				return this.handleTokenExpired(request, next);
			default:
				break;
		}

		if (!this.shownErrorCodes.has(customErrorCode.message) && !errorCodes.includes(customErrorCode.message)) {
			this.showToast(customErrorCode.message, SnackbarType.ERROR);
			this.shownErrorCodes.add(customErrorCode);
		}
		return throwError(() => error);
	}

	private handleCaptcha(status: CaptchaStatus): void {
		this.captchaService.displayCaptchaSubject.next(status);
	}

	private handleTokenExpired(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// Call the refresh token endpoint to get a new access token
		return this.authService.refreshToken().pipe(
			switchMap((response: any) => {
				this.authService.setDto(response.body as LoginResponseDto);
				// Retry the original request with the new access token
				return next.handle(this.cloneRequest(request));
			}),
			catchError((error) => {
				this.authService.logout().subscribe();
				this.router.navigate([commonRoutingConstants.login]);
				return throwError(() => error);
			})
		);
	}

	private cloneRequest(req: HttpRequest<unknown>): HttpRequest<unknown> {
		return req.clone({
			withCredentials: true
		});
	}

	private showToast(message: string, type: SnackbarType): void {
		const toasterMessage = this.translateService.instant(`errors.${message}`);

		this.snackBar.openFromComponent(CustomSnackbarComponent, {
			duration: 8000,
			data: new SnackbarData(toasterMessage, type),
			horizontalPosition: 'right',
			verticalPosition: 'bottom'
		});
	}
}
