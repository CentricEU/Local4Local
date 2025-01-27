/* eslint-disable @typescript-eslint/no-unused-vars */
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ErrorCatchingInterceptor } from './error-catching.interceptor';
import { Router } from '@angular/router';
import { CaptchaStatus } from '../_enums/captcha.enum';
import { AuthService } from '../services/auth.service';
import { MockRouter } from '../_mocks/router.mock';
import {
	ALREADY_REGISTERED_CODE,
	CAPTCHA_SHOW,
	CREDENTIALS_INVALID,
	JWT_EXPIRED,
	JWT_NOT_FOUND,
	OTP_NOT_FOUND
} from '../_constants/error-constants';
import { commonRoutingConstants } from '../_constants/common-routing.constants';

describe('ErrorCatchingInterceptor', () => {
	let interceptor: ErrorCatchingInterceptor;
	let router: Router;

	const authServiceMock = {
		isLoggedIn: false,
		logout: jest.fn(),
		refreshToken: jest.fn().mockReturnValue(of({})),
		setDto: jest.fn()
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule, TranslateModule.forRoot()],
			providers: [
				ErrorCatchingInterceptor,
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: Router, useClass: MockRouter }
			]
		});

		interceptor = TestBed.inject(ErrorCatchingInterceptor);
		router = TestBed.inject(Router);
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should be created', () => {
		expect(interceptor).toBeTruthy();
	});

	it('should handle client-side or network error', () => {
		const errorInitEvent: ErrorEventInit = {
			error: new Error('AAAHHHH'),
			message: 'A monkey is throwing bananas at me!',
			lineno: 402,
			colno: 123,
			filename: 'closet.html'
		};
		const errorEvent = new ErrorEvent('MyErrEventType', errorInitEvent);

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => {
				return throwError(() => errorEvent);
			}
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				return;
			},
			(error) => {
				expect(error).toBe(errorEvent);
			}
		);
	});
	describe('Backend error with custom codes', () => {
		it('should handle custom error: 40007', () => {
			const customErrorCode = { message: '40007' };

			const request = new HttpRequest('GET', 'test');
			const next = {
				handle: () => {
					return throwError(() => new HttpErrorResponse({ error: customErrorCode }));
				}
			};

			interceptor.intercept(request, next).subscribe(
				() => {
					return;
				},
				(error) => {
					expectForCustomError(error, customErrorCode);
					expect(interceptor['handleCaptcha']).toBeCalledWith(CaptchaStatus.INVALID_CREDENTIALS);
				}
			);
		});

		it('should handle custom error: 40005', () => {
			const customErrorCode = { message: '40005' };

			const request = new HttpRequest('GET', 'test');
			const next = {
				handle: () => {
					return throwError(() => new HttpErrorResponse({ error: customErrorCode }));
				}
			};

			interceptor.intercept(request, next).subscribe(
				() => {
					return;
				},
				(error) => {
					expectForCustomError(error, customErrorCode);
					expect(interceptor['handleCaptcha']).toBeCalledWith(CaptchaStatus.CREATED);
				}
			);
		});

		it('should handle custom error: default', () => {
			const customErrorCode = 40050;

			const request = new HttpRequest('GET', 'test');
			const next = {
				handle: () => {
					return throwError(() => new HttpErrorResponse({ error: customErrorCode }));
				}
			};

			interceptor.intercept(request, next).subscribe(
				() => {
					return;
				},
				(error) => {
					expectForCustomError(error, customErrorCode);
				}
			);
		});
	});

	it('should pass through non-custom errors', () => {
		const standardError = new HttpErrorResponse({
			status: 500,
			statusText: 'Internal Server Error'
		});

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => throwError(() => standardError)
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				return;
			},
			(error) => {
				expect(error).toBe(standardError);
			}
		);
	});

	it('should propagate unrecognized custom error codes', () => {
		const customErrorCode = { message: '50001' };

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => throwError(() => new HttpErrorResponse({ error: customErrorCode }))
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				return;
			},
			(error) => {
				expect(error.error).toBe(customErrorCode);
			}
		);
	});

	it('should re-throw the error after handling custom error code', () => {
		const customErrorCode = { message: '50001' };
		const errorResponse = new HttpErrorResponse({ error: customErrorCode, status: 500 });
		interceptor['shownErrorCodes'].add('50001');

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => throwError(() => errorResponse)
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				fail('Expected error to be thrown');
			},
			(error) => {
				expect(error).toBe(errorResponse);
			}
		);
	});

	function expectForCustomError(customErrorCode: unknown, error: unknown) {
		expect(error).toBeTruthy();
		expect(interceptor['handleCustomError']).toHaveBeenCalledWith(customErrorCode);
	}

	it('should handle custom error: CREDENTIALS_INVALID', () => {
		const customErrorCode = { message: CREDENTIALS_INVALID };

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => throwError(() => new HttpErrorResponse({ error: customErrorCode }))
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				return;
			},
			(error) => {
				expectForCustomError(error, customErrorCode);
				expect(interceptor['handleCaptcha']).toBeCalledWith(CaptchaStatus.INVALID_CREDENTIALS);
			}
		);
	});

	it('should handle custom error: CAPTCHA_SHOW', () => {
		const customErrorCode = { message: CAPTCHA_SHOW };

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => throwError(() => new HttpErrorResponse({ error: customErrorCode }))
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				return;
			},
			(error) => {
				expectForCustomError(error, customErrorCode);
				expect(interceptor['handleCaptcha']).toBeCalledWith(CaptchaStatus.CREATED);
			}
		);
	});

	it('should handle custom error: JWT_EXPIRED and retry request', () => {
		const customErrorCode = { message: JWT_EXPIRED };
		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: jest.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ error: customErrorCode })))
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				fail('Expected error to be thrown');
			},
			(error) => {
				expect(authServiceMock.refreshToken).toHaveBeenCalled();
				expect(authServiceMock.setDto).toHaveBeenCalled();
				expect(next.handle).toHaveBeenCalledTimes(2);
			}
		);
	});

	it('should handle token expiration and redirect to login on refresh failure', () => {
		authServiceMock.refreshToken = jest.fn().mockReturnValue(throwError(() => new Error('Token refresh failed')));

		const customErrorCode = { message: JWT_EXPIRED };
		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: jest.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ error: customErrorCode })))
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				fail('Expected error to be thrown');
			},
			(error) => {
				expect(authServiceMock.refreshToken).toHaveBeenCalled();
				expect(authServiceMock.logout).toHaveBeenCalled();
				expect(router.navigate).toHaveBeenCalledWith([commonRoutingConstants.login]);
			}
		);
	});

	it('should pass through non-custom errors', () => {
		const standardError = new HttpErrorResponse({
			status: 500,
			statusText: 'Internal Server Error'
		});

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => throwError(() => standardError)
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				return;
			},
			(error) => {
				expect(error).toBe(standardError);
			}
		);
	});

	it('should re-throw the error after handling unrecognized custom error code', () => {
		const customErrorCode = { message: '50001' };
		const errorResponse = new HttpErrorResponse({ error: customErrorCode, status: 500 });

		interceptor['shownErrorCodes'].add('50001');

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => throwError(() => errorResponse)
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				fail('Expected error to be thrown');
			},
			(error) => {
				expect(error).toBe(errorResponse);
			}
		);
	});

	it('should logout, navigate to login, log error, and re-throw the error when token refresh fails', (done) => {
		const error = new Error('Token refresh failed');
		const customErrorCode = { message: JWT_EXPIRED };
		const errorResponse = new HttpErrorResponse({ error: customErrorCode, status: 401 });

		authServiceMock.refreshToken = jest.fn().mockReturnValue(throwError(() => error));

		authServiceMock.logout = jest.fn().mockReturnValue(of(null));

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: jest.fn()
		};

		const consoleErrorSpy = jest.spyOn(console, 'error');

		interceptor['handleTokenExpired'](request, next).subscribe({
			next: () => {
				fail('Expected error to be thrown');
			},
			error: (thrownError) => {
				try {
					expect(authServiceMock.logout).toHaveBeenCalled();
					expect(thrownError).toBe(error);
					done();
				} catch (e) {
					done(e);
				}
			}
		});
	});
	it('should skip handling for skipped error codes', () => {
		const skippedErrorCode = { message: ALREADY_REGISTERED_CODE };

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => throwError(() => new HttpErrorResponse({ error: skippedErrorCode }))
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				return;
			},
			(error) => {
				expect(error.error).toBe(skippedErrorCode);
			}
		);
	});

	it('should handle custom error: JWT_NOT_FOUND', () => {
		const customErrorCode = { message: JWT_NOT_FOUND };

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => throwError(() => new HttpErrorResponse({ error: customErrorCode }))
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				return;
			},
			(error) => {
				expectForCustomError(error, customErrorCode);
			}
		);
	});

	it('should handle custom error: OTP_NOT_FOUND', () => {
		const customErrorCode = { message: OTP_NOT_FOUND };

		const request = new HttpRequest('GET', 'test');
		const next = {
			handle: () => throwError(() => new HttpErrorResponse({ error: customErrorCode }))
		};

		interceptor.intercept(request, next).subscribe(
			() => {
				return;
			},
			(error) => {
				expectForCustomError(error, customErrorCode);
			}
		);
	});
});
