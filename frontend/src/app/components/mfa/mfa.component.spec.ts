import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MfaComponent } from './mfa.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { commonRoutingConstants } from '../../_constants/common-routing.constants';
import { TranslateModule } from '@ngx-translate/core';
import { TimerService } from '../../services/timer.service';

describe('MfaComponent', () => {
    let component: MfaComponent;
    let fixture: ComponentFixture<MfaComponent>;
    let authServiceMock: any;
    let routerMock: any;
    let activatedRouteMock: any;
    let timerServiceMock: any;

    beforeEach(async () => {
        authServiceMock = {
            verifyOtpCode: jest.fn(),
            resendOtp: jest.fn().mockReturnValue(of({})),
        };

        timerServiceMock = { stopTimer: jest.fn() };

        routerMock = {
            navigateByUrl: jest.fn()
        };

        activatedRouteMock = {
            snapshot: { queryParams: {} }
        };

        await TestBed.configureTestingModule({
            declarations: [MfaComponent],
            imports: [
                ReactiveFormsModule,
                TranslateModule.forRoot(),
            ],
            providers: [
                FormBuilder,
                { provide: AuthService, useValue: authServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
                { provide: TimerService, useValue: timerServiceMock },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MfaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should create the form on init', () => {
        component.ngOnInit();
        expect(component.form).toBeTruthy();
        expect(component.form.get('code')).toBeTruthy();
    });

    it('should set returnUrl from queryParams or default to dashboard', () => {
        activatedRouteMock.snapshot.queryParams['returnUrl'] = encodeURIComponent('/custom-return-url');
        component.ngOnInit();
        expect(component["returnUrl"]).toBe('/custom-return-url');

        activatedRouteMock.snapshot.queryParams['returnUrl'] = undefined;
        component.ngOnInit();
        expect(component["returnUrl"]).toBe(commonRoutingConstants.dashboard);
    });

    it('should not submit form if it is invalid', () => {
        component.form.get('code')?.setValue('invalid');
        component.verifyOtpCode();
        expect(authServiceMock.verifyOtpCode).not.toHaveBeenCalled();
    });

    it('should submit form and navigate to returnUrl if OTP verification is successful', () => {
        component.form.get('code')?.setValue('123456'); 
        authServiceMock.verifyOtpCode.mockReturnValue(of({})); 

        component.verifyOtpCode();
        expect(authServiceMock.verifyOtpCode).toHaveBeenCalledWith('123456');
        expect(routerMock.navigateByUrl).toHaveBeenCalledWith(component["returnUrl"]);
    });

    it('should set invalidCode error if OTP verification fails', () => {
        component.form.get('code')?.setValue('123456');
        authServiceMock.verifyOtpCode.mockReturnValue(throwError(() => new Error('Invalid OTP')));

        component.verifyOtpCode();
        expect(authServiceMock.verifyOtpCode).toHaveBeenCalledWith('123456');
        expect(component.form.get('code')?.hasError('invalidCode')).toBeTruthy();
    });

    it('should call resendOtp and start countDownValue indirectly', () => {
        jest.useFakeTimers();
        component.resendOtp();

        expect(authServiceMock.resendOtp).toHaveBeenCalled();
        expect(component.isResendButtonDisabled).toBe(true);

        jest.advanceTimersByTime(3000);

        expect(component.countDownValue).toBe(297);
        jest.useRealTimers();
    });

    it('should countDownValue to be 0 when times completes', () => {
        jest.useFakeTimers();
        component.resendOtp();
        component.countDownValue = 2; 

        jest.advanceTimersByTime(2000);

        expect(component.countDownValue).toBe(0);
        jest.useRealTimers();
    });

    it('should re-enable resend button when countDownValue reaches zero', () => {
        jest.useFakeTimers();
    
        component.resendOtp();
        component.countDownValue = 0; 
    
        jest.advanceTimersByTime(2000);
    
        expect(component.countDownValue).toBe(0);
        expect(component.isResendButtonDisabled).toBe(false);
    
        jest.useRealTimers();
    });

    describe('MfaComponent message and translation parameter methods', () => {
        it.each([
            { isResendButtonDisabled: true, expectedKey: 'mfa.resendMessageWithSeconds' },
            { isResendButtonDisabled: false, expectedKey: 'mfa.resendMessage' }
        ])('should return the correct message key based on isResendButtonDisabled', ({ isResendButtonDisabled, expectedKey }) => {
            component.isResendButtonDisabled = isResendButtonDisabled;
            const result = component.getResendMessageKey();
            expect(result).toBe(expectedKey);
        });
    
        it.each([
            { isResendButtonDisabled: true, countDownValue: 120, expectedParams: { seconds: 120 } },
            { isResendButtonDisabled: false, countDownValue: 120, expectedParams: {} }
        ])('should return the correct translation params based on isResendButtonDisabled', ({ isResendButtonDisabled, countDownValue, expectedParams }) => {
            component.isResendButtonDisabled = isResendButtonDisabled;
            component.countDownValue = countDownValue;
            const result = component.getTranslationParams();
            expect(result).toEqual(expectedParams);
        });
    });    
    
});
