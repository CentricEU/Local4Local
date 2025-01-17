import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { LoginRequestDto } from '../models/login-request-dto.model';
import { Role } from '../enums/roles.enum';
import { LoginResponseDto } from '../models/login-response.model';
import { HttpResponse } from '@angular/common/http';

describe('AuthService', () => {
	let service: AuthService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [AuthService]
		});

		service = TestBed.inject(AuthService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should call login and return HttpResponse<void>', (done) => {
		const loginRequest: LoginRequestDto = { email: 'user', password: 'password', rememberMe: false, reCaptchaResponse: '', role: Role.MANAGER };

		service.login(loginRequest).subscribe(response => {
			expect(response).toBeTruthy();
			done();
		});

		const req = httpMock.expectOne(`${environment.apiPath}/public/authenticate`);
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toEqual(loginRequest);
		req.flush(null, { status: 200, statusText: 'OK' });
	});

	it('should call refreshToken and return RefreshToken', (done) => {
		const mockRefreshToken: LoginResponseDto = { 
			role: Role.MANAGER,
			expirationDate: new Date('2099-12-31T23:59:59'),
			rememberMe: false
		};

		service.refreshToken().subscribe((response: HttpResponse<LoginResponseDto>) => {
			expect(response.body).toEqual(mockRefreshToken);
			done();
		});
		
		const req = httpMock.expectOne(`${environment.apiPath}/public/authenticate/refreshToken`);
		expect(req.request.method).toBe('POST');
		expect(req.request.withCredentials).toBe(true);
		req.flush(mockRefreshToken);
	});

	it('should call getTokenInfo and return HttpResponse<LoginResponseDto>', (done) => {
		const mockLoginResponseDto: LoginResponseDto = {
			role: Role.MANAGER,
			expirationDate: new Date('2099-12-31T23:59:59'),
			rememberMe: false
		};

		service.getTokenInfo().subscribe((response) => {
			expect(response.body).toEqual(mockLoginResponseDto);
			expect(service['loginResponseDto']).toEqual(mockLoginResponseDto);
			expect(service.isTokenValid()).toBe(true);
			done();
		});

		const req = httpMock.expectOne(`${environment.apiPath}/public/authenticate/token/details`);
		expect(req.request.method).toBe('GET');
		req.flush(mockLoginResponseDto);
	});

	it('should return true if role is MANAGER', () => {
		service['loginResponseDto'] = {
			role: Role.MANAGER,
			expirationDate: new Date('2099-12-31T23:59:59'),
			rememberMe: false
		};
		expect(service.isRoleManager()).toBe(true);
	});

	it('should return false if role is not MANAGER', () => {
		service['loginResponseDto'] = {
			role: "mocked",
			expirationDate: new Date('2099-12-31T23:59:59'),
			rememberMe: false

		};
		expect(service.isRoleManager()).toBe(false);
	});

	it('should return true if token is valid', () => {
		service['loginResponseDto'] = {
			role: Role.MANAGER,
			expirationDate: new Date('2099-12-31T23:59:59'),
			rememberMe: false
		};
		expect(service.isTokenValid()).toBe(true);
	});

	it('should return false if token is expired', () => {
		service['loginResponseDto'] = {
			role: Role.MANAGER,
			expirationDate: new Date('2000-01-01T00:00:00'),
			rememberMe: false
		};
		expect(service.isTokenValid()).toBe(false);
	});

	it('should call cookieCleaningLogout and make a POST request', (done) => {
		service['logoutAndClearCookies']().subscribe(() => {
			done();
		});

		const req = httpMock.expectOne(`${environment.apiPath}/logout`);
		expect(req.request.method).toBe('POST');
		expect(req.request.withCredentials).toBe(true);
		req.flush(null);
	});

	it('should call clearUser and reset loginResponseDto and isAuthenticatedSubject', () => {
		const clearUserSpy = jest.spyOn(service as any, 'clearUser').mockImplementation(() => {
			service['loginResponseDto'] = null;
			service['isAuthenticatedSubject'].next(false);
		});

		service['loginResponseDto'] = {
			role: Role.MANAGER,
			expirationDate: new Date('2099-12-31T23:59:59'),
			rememberMe: false
		};
		service['isAuthenticatedSubject'].next(true);

		service['clearUser']();

		expect(clearUserSpy).toHaveBeenCalled();
		expect(service['loginResponseDto']).toBeNull();
		service.isAuthenticatedObservable().subscribe(isAuthenticated => {
			expect(isAuthenticated).toBe(false);
		});
	});

	it('should return correct authentication status', (done) => {
		service['isAuthenticatedSubject'].next(true);

		service.isAuthenticatedObservable().subscribe(isAuthenticated => {
			expect(isAuthenticated).toBe(true);
			done();
		});
	});

	it('should return false when not authenticated', (done) => {
		service['isAuthenticatedSubject'].next(false);

		service.isAuthenticatedObservable().subscribe(isAuthenticated => {
			expect(isAuthenticated).toBe(false);
			done();
		});
	});

	it('should call logout, make a POST request, and clear user data', (done) => {
		const clearUserSpy = jest.spyOn(service as any, 'clearUser').mockImplementation(() => {
			service['loginResponseDto'] = null;
			service['isAuthenticatedSubject'].next(false);
		});

		service.logout().subscribe(() => {
			expect(clearUserSpy).toHaveBeenCalled();
			service.isAuthenticatedObservable().subscribe(isAuthenticated => {
				expect(isAuthenticated).toBe(false);
				done();
			});
		});

		const req = httpMock.expectOne(`${environment.apiPath}/logout`);
		expect(req.request.method).toBe('POST');
		expect(req.request.withCredentials).toBe(true);
		req.flush(null);
	});

	it('should call clearUser and reset loginResponseDto and isAuthenticatedSubject', () => {
		const clearUserSpy = jest.spyOn(service as any, 'clearUser').mockImplementation(() => {
			service['loginResponseDto'] = null;
			service['isAuthenticatedSubject'].next(false);
		});

		service['loginResponseDto'] = {
			role: Role.MANAGER,
			expirationDate: new Date('2099-12-31T23:59:59'),
			rememberMe: false
		};
		service['isAuthenticatedSubject'].next(true);

		(service as any).clearUser();

		expect(clearUserSpy).toHaveBeenCalled();
		expect(service['loginResponseDto']).toBeNull();
		service.isAuthenticatedObservable().subscribe(isAuthenticated => {
			expect(isAuthenticated).toBe(false);
		});
	});

	it('should clear user data and reset authentication status', () => {
		const clearUserSpy = jest.spyOn(service as any, 'clearUser').mockImplementation(() => {
			(service as any).loginResponseDto = null;
			(service as any).isAuthenticatedSubject.next(false);
		});

		(service as any).loginResponseDto = {
			role: Role.MANAGER,
			expirationDate: new Date('2099-12-31T23:59:59')
		};
		(service as any).isAuthenticatedSubject.next(true);

		(service as any).clearUser();

		expect(clearUserSpy).toHaveBeenCalled();
		expect((service as any).loginResponseDto).toBeNull();
		(service.isAuthenticatedObservable()).subscribe(isAuthenticated => {
			expect(isAuthenticated).toBe(false);
		});
	});

	it('should clear user data and reset authentication status', () => {
		// Arrange
		(service as any).loginResponseDto = {
			role: Role.MANAGER,
			expirationDate: new Date('2099-12-31T23:59:59')
		};
		(service as any).isAuthenticatedSubject.next(true);
	
		// Act
		(service as any).clearUser();
	
		// Assert
		expect((service as any).loginResponseDto).toBeNull();
		(service.isAuthenticatedObservable()).subscribe(isAuthenticated => {
			expect(isAuthenticated).toBe(false);
		});
	});

	it('should call verifyOtpCode and return HttpResponse<LoginResponseDto>', (done) => {
		const otpCode = 123456;
		const mockLoginResponseDto: LoginResponseDto = {
			role: Role.MANAGER,
			expirationDate: new Date('2099-12-31T23:59:59'),
			rememberMe: false
		};
	
		service.verifyOtpCode(otpCode).subscribe((response) => {
			expect(response.body).toEqual(mockLoginResponseDto);
			expect(service['loginResponseDto']).toEqual(mockLoginResponseDto);
			expect(service.isTokenValid()).toBe(true);
			done();
		});
	
		const req = httpMock.expectOne(`${environment.apiPath}/public/authenticate/validateOtp?otpCode=${otpCode}`);
		expect(req.request.method).toBe('POST');
		expect(req.request.params.get('otpCode')).toBe(otpCode.toString());
		expect(req.request.headers.get('Content-Type')).toBe('application/json');
		req.flush(mockLoginResponseDto);
	});

	it('should call resendOtp and make a POST request', (done) => {
		service.resendOtp().subscribe(() => {
			done();
		});
	
		const req = httpMock.expectOne(`${environment.apiPath}/public/authenticate/resendOtp`);
		expect(req.request.method).toBe('POST');
		expect(req.request.withCredentials).toBe(true);
		req.flush(null);
	});
	
	describe('isRememberMeActive', () => {
        it('should return null if loginResponseDto is undefined', () => {
            service['loginResponseDto'] = null;
            expect(service.isRememberMeActive()).toBeNull();
        });

        it('should return true if rememberMe is true', () => {
            service['loginResponseDto'] = { role: Role.MANAGER, expirationDate: new Date(), rememberMe: true } as LoginResponseDto;
            expect(service.isRememberMeActive()).toBeTruthy();
        });

        it('should return false if rememberMe is false', () => {
            service['loginResponseDto'] = { role: Role.MANAGER, expirationDate: new Date(), rememberMe: false } as LoginResponseDto;
            expect(service.isRememberMeActive()).toBeFalsy();
        });
    });

	describe('setDto', () => {
        it('should set loginResponseDto with the provided LoginResponseDto', () => {
            const mockLoginResponse: LoginResponseDto = {
                role: 'MANAGER',
                expirationDate: new Date(),
                rememberMe: true
            };

            service.setDto(mockLoginResponse);
            expect(service['loginResponseDto']).toEqual(mockLoginResponse);
        });

		describe('getRole', () => {
			it('should return the role if loginResponseDto is defined', () => {
				const mockLoginResponse: LoginResponseDto = {
					role: Role.MANAGER,
					expirationDate: new Date(),
					rememberMe: true
				};

				service['loginResponseDto'] = mockLoginResponse;
				expect(service.getRole()).toEqual(Role.MANAGER);
			});

			it('should return null if loginResponseDto is not defined', () => {
				service['loginResponseDto'] = null;
				expect(service.getRole()).toBeNull();
			});

			describe('isTokenValid', () => {
				it('should return true if the token is valid', () => {
					service['loginResponseDto'] = {
						role: Role.MANAGER,
						expirationDate: new Date('2099-12-31T23:59:59'),
						rememberMe: false
					};
					expect(service.isTokenValid()).toBe(true);
				});

				it('should return false if the token is expired', () => {
					service['loginResponseDto'] = {
						role: Role.MANAGER,
						expirationDate: new Date('2000-01-01T00:00:00'),
						rememberMe: false
					};
					expect(service.isTokenValid()).toBe(false);
				});

				it('should return false if loginResponseDto is null', () => {
					service['loginResponseDto'] = null;
					expect(service.isTokenValid()).toBe(false);
				});
			});
		});
	});
});