import { Component, inject, OnInit } from '@angular/core';
import { FormUtil } from '../../util/form.util';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { L4LErrorStateMatcher } from '../../helpers/error-state-matcher';
import { commonRoutingConstants } from '../../_constants/common-routing.constants';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RegexUtil } from '../../util/regex.util';
import { TimerService } from '../../services/timer.service';

@Component({
    selector: 'app-mfa',
    templateUrl: './mfa.component.html',
    styleUrl: './mfa.component.scss'
})
export class MfaComponent implements OnInit {
    public hasRequiredError = FormUtil.hasRequiredError;
    public hasPatternError = FormUtil.hasPatternError;

    public form: FormGroup;
    public matcher = new L4LErrorStateMatcher();
    public userIsBlocked = false;
    public countDownValue: string;
    public isResendButtonDisabled = false;

    public get invalidCode(): boolean | undefined {
        return this.form.get('code')?.hasError('invalidCode');
    }

    private countDownValueInSeconds: number;
    private returnUrl: string = commonRoutingConstants.dashboard;
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private timerService = inject(TimerService);

    public ngOnInit(): void {
        this.createForm();
        this.setReturnUrl();
    }

    public verifyOtpCode(): void {
        if (!this.form.valid) {
            return;
        }

        this.performMfa();
    }

    public resendOtp(): void {
        this.authService.resendOtp().subscribe(() => {
            this.countDownValueInSeconds = 301;
            this.isResendButtonDisabled = true;
            this.startCountdown();
        });

    }
    public getTranslationParams(): { seconds?: string } {
        return this.isResendButtonDisabled ? { seconds: this.countDownValue } : {};
    }

    private setReturnUrl(): void {
        const encodedReturnUrl = this.route.snapshot.queryParams['returnUrl'] || commonRoutingConstants.dashboard;
        this.returnUrl = decodeURIComponent(encodedReturnUrl);
    }

    private createForm(): void {
        this.form = this.fb.group({
            code: ['', [Validators.required, Validators.pattern(RegexUtil.mfaRegexPattern)]],
        });
    }

    private performMfa(): void {
        const mfaCode = this.form.get('code')?.value;

        this.authService.verifyOtpCode(mfaCode).subscribe(() => {
            this.timerService.stopTimer();
            this.router.navigateByUrl(this.returnUrl);
        },
            () => {
                this.form.get('code')?.setErrors({ invalidCode: true });
            });
    }

    private startCountdown(): void {
        const intervalId = setInterval(() => {
            this.countDownValueInSeconds = Math.max(0, this.countDownValueInSeconds - 1);

            this.updateCountDownValue();

            this.isResendButtonDisabled = this.countDownValueInSeconds !== 0;

            if (this.countDownValueInSeconds === 0) {
                clearInterval(intervalId);
            }
        }, 1000);
    }

    private updateCountDownValue(): void {
        const minutes = Math.floor(this.countDownValueInSeconds / 60);
        const seconds = this.countDownValueInSeconds % 60;
        this.countDownValue = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
}

