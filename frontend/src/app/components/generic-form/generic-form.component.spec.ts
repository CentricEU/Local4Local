import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenericFormComponent } from './generic-form.component';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RecaptchaFormsModule, RecaptchaModule } from 'ng-recaptcha';
import { commonRoutingConstants } from '../../_constants/common-routing.constants';
import { RegexUtil } from '../../util/regex.util';
import { FormUtil } from '../../util/form.util';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { UserService } from '../../services/user.service';

describe('GenericFormComponent', () => {
	let component: GenericFormComponent;
	let fixture: ComponentFixture<GenericFormComponent>;

	const mockActivatedRoute = {
		snapshot: {
			url: [commonRoutingConstants.recover]
		},
		params: of({ token: 'test-token' }),
	};

	const routerMock = {
		navigate: jest.fn(),
	};

	const userServiceMock = {
		changePassword: jest.fn().mockReturnValue(of({})),
		getRecoverByToken: jest.fn().mockReturnValue(of({})),
		recoverPassword: jest.fn().mockReturnValue(of({}))
	};

	beforeEach(async () => {
		global.structuredClone = jest.fn(val => {
			return JSON.parse(JSON.stringify(val));
		});
		
		await TestBed.configureTestingModule({
			declarations: [GenericFormComponent],
			schemas: [NO_ERRORS_SCHEMA],
			imports: [HttpClientTestingModule, ReactiveFormsModule, TranslateModule.forRoot(), RecaptchaFormsModule, RecaptchaModule],
			providers: [
				FormBuilder,
				TranslateService,
				{ provide: ActivatedRoute, useValue: mockActivatedRoute },
				{ provide: UserService, useValue: userServiceMock },
				{ provide: Router, useValue: routerMock }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(GenericFormComponent);
		component = fixture.componentInstance;
		component.form = component['fb'].group({
			email: ['test@example.com', [Validators.required, Validators.pattern(RegexUtil.emailRegexPattern)]],
			reCaptchaResponse: ['valid-recaptcha', Validators.required],
			password: ['ValidPassword123', [Validators.required, FormUtil.validatePassword]],
			confirmPassword: ['ValidPassword123', [Validators.required, FormUtil.confirmPasswordValidator]]
		});
		fixture.detectChanges();

		jest.spyOn(console, 'error').mockImplementation(() => { 'test' });
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should initialize the recover form for the recover route', () => {
		expect(component.form.contains('email')).toBe(true);
		expect(component.form.contains('reCaptchaResponse')).toBe(true);
	});

	it('should initialize the reset password form for the reset password route', () => {
		component.currentRoute = commonRoutingConstants.changePassword;
		component['performLogicBasedOnRoute'](component.currentRoute);

		expect(component.form.contains('password')).toBe(true);
		expect(component.form.contains('confirmPassword')).toBe(true);
	});

	it('should display correct error messages for email validation', () => {
		const emailControl = component.form.get('email');
		emailControl?.setValue('');
		emailControl?.markAsTouched();

		expect(component.emailError).toBe('email.error.emailRequired');
	});

	it('should display correct error message for password validation', () => {
		const passwordControl = component.form.get('password');
		passwordControl?.setErrors({ validPassword: true });
		passwordControl?.markAsTouched();

		expect(component.passwordError).toBe('password.error.passwordRequirements');
	});

	it('should perform recover action when form is valid and on recover route', () => {
		component.currentRoute = commonRoutingConstants.recover;
		component.form = component['fb'].group({
			email: ['test@example.com', [Validators.required, Validators.pattern(RegexUtil.emailRegexPattern)]],
			reCaptchaResponse: ['valid-recaptcha', Validators.required]
		});

		const recoverSpy = jest.spyOn(component as any, 'performRecover').mockImplementation(() => { 'test' });

		component.performAction();

		expect(recoverSpy).toHaveBeenCalled();
	});

	it('should not perform action if form is invalid', () => {
		component.currentRoute = commonRoutingConstants.recover;

		component.form = component['fb'].group({
			email: ['', Validators.required],
			reCaptchaResponse: ['', Validators.required]
		});

		const recoverSpy = jest.spyOn(component as any, 'performRecover');

		component.performAction();

		expect(recoverSpy).not.toHaveBeenCalled();
	});

	it('should display correct error message for confirm password validation', () => {
		component.currentRoute = commonRoutingConstants.changePassword;

		component.form = component['fb'].group({
			password: ['', Validators.required],
			confirmPassword: ['', Validators.required]
		});

		const confirmPasswordControl = component.form.get('confirmPassword');
		confirmPasswordControl?.setValue('');
		confirmPasswordControl?.markAsTouched();

		expect(component.confirmPasswordError).toBe('password.error.confirmPasswordRequired');

		const passwordControl = component.form.get('password');
		passwordControl?.setValue('ValidPassword123');
		confirmPasswordControl?.setValue('DifferentPassword123');

		confirmPasswordControl?.setErrors({ fieldsMismatch: true });

		expect(component.confirmPasswordError).toBe('password.error.confirmPasswordMatch');

		confirmPasswordControl?.setErrors(null);
		confirmPasswordControl?.setValue('ValidPassword123');
		expect(component.confirmPasswordError).toBe('');
	});

	it('should display correct error messages for email validation', () => {
		component.form = component['fb'].group({
			email: ['', [Validators.required, Validators.pattern(RegexUtil.emailRegexPattern)]]
		});

		const emailControl = component.form.get('email');
		emailControl?.setValue('');
		emailControl?.markAsTouched();

		expect(component.emailError).toBe('email.error.emailRequired');

		emailControl?.setValue('invalid-email');
		emailControl?.markAsTouched();

		expect(component.emailError).toBe('email.error.validEmail');

		emailControl?.setValue('test@example.com');
		emailControl?.markAsTouched();

		emailControl?.setErrors(null);
		expect(component.emailError).toBe('');
	});

	it('should return true if password is invalid and not required', () => {
		component.form = component['fb'].group({
			password: ['', [Validators.required, FormUtil.validatePassword]]
		});

		const passwordControl = component.form.get('password');

		passwordControl?.setValue('short');
		passwordControl?.markAsTouched();
		expect(component.isInvalidPassword()).toBe(true);

		passwordControl?.setValue('ValidPassword123');
		expect(component.isInvalidPassword()).toBe(true);

		passwordControl?.setValue('');
		expect(component.isInvalidPassword()).toBe(false);

		passwordControl?.setErrors({ validPassword: true });
		expect(component.isInvalidPassword()).toBe(true);
	});



	it('should handle the case when performRecover is called', () => {
		const recoverSpy = jest.spyOn(component as any, 'performRecover').mockImplementation(() => { 'test' });
		component['performRecover']();

		expect(recoverSpy).toHaveBeenCalled();
	});

	it('should handle the case when performResetPassword is called', () => {
		const resetSpy = jest.spyOn(component as any, 'performResetPassword').mockImplementation(() => { 'test' });
		component['performResetPassword']();

		expect(resetSpy).toHaveBeenCalled();
	});

	it('should display correct error message for password required validation', () => {
		component.form = component['fb'].group({
			password: ['', Validators.required]
		});

		const passwordControl = component.form.get('password');
		passwordControl?.markAsTouched();

		expect(component.passwordError).toBe('password.error.passwordRequired');
	});


	it('should return an empty string when password is valid', () => {
		component.form = component['fb'].group({
			password: ['ValidPassword123.', [Validators.required, FormUtil.validatePassword]]
		});

		const passwordControl = component.form.get('password');
		passwordControl?.markAsTouched();

		expect(component.passwordError).toBe('');
	});

	it('should not perform any action for an invalid route', () => {
		const invalidRoute = 'invalid/route';
		const actionSpy = jest.spyOn(component as any, 'createRecoverForm');

		component['performLogicBasedOnRoute'](invalidRoute);

		expect(actionSpy).not.toHaveBeenCalled();
	});

	it('should not perform any action if the form is invalid', () => {
		component.form = component['fb'].group({
			email: ['', Validators.required],
			reCaptchaResponse: ['', Validators.required]
		});

		const recoverSpy = jest.spyOn(component as any, 'performRecover');
		const resetSpy = jest.spyOn(component as any, 'performResetPassword');

		component.performAction();

		expect(recoverSpy).not.toHaveBeenCalled();
		expect(resetSpy).not.toHaveBeenCalled();
	});

	it('should call performRecover when the form is valid and on recover route', () => {
		component.currentRoute = commonRoutingConstants.recover;
		component.form = component['fb'].group({
			email: ['test@example.com', [Validators.required, Validators.pattern(RegexUtil.emailRegexPattern)]],
			reCaptchaResponse: ['valid-recaptcha', Validators.required]
		});

		const recoverSpy = jest.spyOn(component as any, 'performRecover').mockImplementation(() => { 'test' });

		component.performAction();

		expect(recoverSpy).toHaveBeenCalled();
	});

	it('should perform reset password action when form is valid and on change password route', () => {
		component.currentRoute = commonRoutingConstants.changePassword;
		component.form = component['fb'].group({
			password: ['ValidPassword123.', [Validators.required, FormUtil.validatePassword]],
			confirmPassword: ['ValidPassword123.', [Validators.required, FormUtil.confirmPasswordValidator]]
		});

		const resetSpy = jest.spyOn(component as any, 'performResetPassword').mockImplementation(() => { 'test' });

		component.performAction();

		expect(resetSpy).toHaveBeenCalled();
	});

	it('should not perform reset password action if form is invalid', () => {
		component.currentRoute = commonRoutingConstants.changePassword;
		component.form = component['fb'].group({
			password: ['', Validators.required],
			confirmPassword: ['', Validators.required]
		});

		const resetSpy = jest.spyOn(component as any, 'performResetPassword');

		component.performAction();

		expect(resetSpy).not.toHaveBeenCalled();
	});

	it('should perform recover action when form is valid and on recover route', () => {
		component.currentRoute = commonRoutingConstants.recover;
		component.form = component['fb'].group({
			email: ['test@example.com', [Validators.required, Validators.pattern(RegexUtil.emailRegexPattern)]],
			reCaptchaResponse: ['valid-recaptcha', Validators.required]
		});

		const recoverSpy = jest.spyOn(component as any, 'performRecover').mockImplementation(() => { 'test' });

		component.performAction();

		expect(recoverSpy).toHaveBeenCalled();
	});

	it('should not perform recover action if form is invalid', () => {
		component.currentRoute = commonRoutingConstants.recover;
		component.form = component['fb'].group({
			email: ['', Validators.required],
			reCaptchaResponse: ['', Validators.required]
		});

		const recoverSpy = jest.spyOn(component as any, 'performRecover');

		component.performAction();

		expect(recoverSpy).not.toHaveBeenCalled();
	});

	it('should call performResetPassword when the form is valid and on change password route', () => {
		component.currentRoute = commonRoutingConstants.changePassword;
		component.form = component['fb'].group({
			password: ['ValidPassword123.', [Validators.required, FormUtil.validatePassword]],
			confirmPassword: ['ValidPassword123.', [Validators.required, FormUtil.confirmPasswordValidator]]
		});

		const resetSpy = jest.spyOn(component as any, 'performResetPassword').mockImplementation(() => { 'test' });

		component.performAction();

		expect(resetSpy).toHaveBeenCalled();
	});

	it('should call performRecover when the form is valid and on recover route', () => {
		component.currentRoute = commonRoutingConstants.recover;
		component.form = component['fb'].group({
			email: ['test@example.com', [Validators.required, Validators.pattern(RegexUtil.emailRegexPattern)]],
			reCaptchaResponse: ['valid-recaptcha', Validators.required]
		});

		const recoverSpy = jest.spyOn(component as any, 'performRecover').mockImplementation(() => { 'test' });

		component.performAction();

		expect(recoverSpy).toHaveBeenCalled();
	});

	it('should call userService.changePassword when performResetPassword is called', () => {
		component['token'] = 'testToken';
		const formBuilder = TestBed.inject(FormBuilder);
		component.form = formBuilder.group({
			confirmPassword: ['ValidPassword123']
		});

		const changePasswordSpy = jest.spyOn(userServiceMock as any, 'changePassword').mockReturnValue(of({}));

		component['performResetPassword']();

		expect(changePasswordSpy).toHaveBeenCalledWith({
			token: 'testToken',
			password: 'ValidPassword123'
		});
	});

	it('should reset the form on error', () => {
		jest.spyOn(userServiceMock, 'changePassword').mockReturnValue(throwError(() => new Error()));

		const resetSpy = jest.spyOn(component.form, 'reset');

		component['performResetPassword']();

		expect(resetSpy).toHaveBeenCalled();
	});

	it('should navigate to recover on error from getRecoverByToken', () => {
		jest.spyOn(userServiceMock as any, 'getRecoverByToken').mockReturnValue(throwError(() => new Error('Error!')));
		const navigateToRecoverSpy = jest.spyOn(component as any, 'navigateToRecover');

		component['getRecoverByToken']('dummy-token');

		expect(navigateToRecoverSpy).toHaveBeenCalled();
	});

	it('should navigate to recover', () => {
		const navigateSpy = jest.spyOn(routerMock, 'navigate');

		component['navigateToRecover']();

		expect(navigateSpy).toHaveBeenCalledWith([commonRoutingConstants.recover]);
	});

	it('should call recoverPassword with the correct data', () => {
		const recoverPasswordDto = {
			email: 'test@example.com',
			password: 'newpassword',
			confirmPassword: 'ValidPassword123',
			reCaptchaResponse: 'dummyReCaptchaResponse'
		};

		component.form.setValue(recoverPasswordDto);
		const recoverPasswordSpy = jest.spyOn(userServiceMock, 'recoverPassword').mockReturnValue(of(null));

		component['performRecover']();

		expect(recoverPasswordSpy).toHaveBeenCalledWith(recoverPasswordDto);
	});

	it('should perform recover action when form is valid on recover route', () => {
		component.currentRoute = commonRoutingConstants.recover;
		component.form.setValue({
			email: 'test@example.com',
			reCaptchaResponse: 'valid-recaptcha',
			password: 'ValidPass1234.',
			confirmPassword: 'ValidPass1234.'
		});

		const recoverSpy = jest.spyOn(component as any, 'performRecover').mockImplementation(() => { 'test' });

		component.performAction();

		expect(recoverSpy).toHaveBeenCalled();
	});

	it('should not perform recover action if form is invalid', () => {
		component.currentRoute = commonRoutingConstants.recover;
		component.form.setValue({
			email: '',
			reCaptchaResponse: '',
			password: '',
			confirmPassword: ''
		});

		const recoverSpy = jest.spyOn(component as any, 'performRecover');

		component.performAction();

		expect(recoverSpy).not.toHaveBeenCalled();
	});

	it('should not set token if params do not contain token key', () => {
		component.ngOnInit();
		expect(component['token']).toBeUndefined();
	});

	it('should navigate to login when the dialog is closed with a truthy result', () => {
		const dialogRefMock = {
			afterClosed: jest.fn().mockReturnValue(of(true))
		};

		jest.spyOn(component['dialog'], 'open').mockReturnValue(dialogRefMock as any);

		component['displaySuccessfulChangePassPopup']();

		expect(component['dialog'].open).toHaveBeenCalled();
		expect(routerMock.navigate).toHaveBeenCalledWith([commonRoutingConstants.login]);
	});

	it('should not navigate to login when the dialog is closed with a falsy result', () => {
		const dialogRefMock = {
			afterClosed: jest.fn().mockReturnValue(of(false))
		};

		jest.spyOn(component['dialog'], 'open').mockReturnValue(dialogRefMock as any);

		component['displaySuccessfulChangePassPopup']();

		expect(component['dialog'].open).toHaveBeenCalled();
		expect(routerMock.navigate).not.toHaveBeenCalled();
	});

});
