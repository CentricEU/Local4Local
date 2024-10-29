import { Component, inject, OnInit } from '@angular/core';
import { FormUtil } from '../../util/form.util';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { L4LErrorStateMatcher } from '../../helpers/error-state-matcher';
import { commonRoutingConstants } from '../../_constants/common-routing.constants';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RegexUtil } from '../../util/regex.util';
import { TimerService } from '../../services/timer.service';
import { TranslateService } from '@ngx-translate/core';

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
    public countdown = 300;
    public resendButtonDisabled = false;

    public get invalidCode(): boolean | undefined {
        return this.form.get('code')?.hasError('invalidCode');
    }

    private returnUrl: string = commonRoutingConstants.dashboard;
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private timerService = inject(TimerService);
    private translateService = inject(TranslateService);

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

    public resendOtp() {
        this.authService.resendOtp().subscribe(() => {
            this.resendButtonDisabled = true;
            this.startCountdown();
        });

    }

    public getResendMessageWithSeconds(): string {
        const messageTemplate = this.translateService.instant('mfa.resendMessageWithSeconds');
        return messageTemplate.replace('{{seconds}}', this.countdown.toString());
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
        setInterval(() => {
            if (this.countdown > 0) {
                this.countdown--;
            } else {
                this.resendButtonDisabled = false;
            }
        }, 1000);
    }
}
