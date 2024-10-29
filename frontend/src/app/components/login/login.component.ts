import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { L4LErrorStateMatcher } from '../../helpers/error-state-matcher';
import { FormUtil } from '../../util/form.util';
import { RegexUtil } from '../../util/regex.util';
import { RecaptchaComponent } from 'ng-recaptcha';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../enums/roles.enum';
import { LoginRequestDto } from '../../models/login-request-dto.model';
import { commonRoutingConstants } from '../../_constants/common-routing.constants';
import { ActivatedRoute, Router } from '@angular/router';
import { CaptchaService } from '../../services/captcha.service';
import { CaptchaStatus } from '../../_enums/captcha.enum';
import { TimerService } from '../../services/timer.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrl: './login.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
	public hasRequiredError = FormUtil.hasRequiredError;
	public hasPatternError = FormUtil.hasPatternError;

	public form: FormGroup;
	public matcher = new L4LErrorStateMatcher();
	public userIsBlocked = false;

	@ViewChild(RecaptchaComponent) ngRecaptcha!: RecaptchaComponent;

	private fb = inject(FormBuilder);
	private authService = inject(AuthService);
	private router = inject(Router);
	private captchaService = inject(CaptchaService);
	private route = inject(ActivatedRoute);
	private timerService = inject(TimerService);

	constructor() {
		this.subscribeToCaptcha();
	}

	public ngOnInit(): void {
		this.createForm();
		this.timerService.startTimer(600000);
	}

	public login(): void {
		if (!this.form.valid) {
			return;
		}
		this.performLogin();
	}

	public navigateToForgotPass(): void {
		this.router.navigate([commonRoutingConstants.recover]);
	}

	private performLogin(): void {
		if (this.userIsBlocked && !this.form.controls['reCaptchaResponse'].value) {
			return;
		}

		const loginRequest: LoginRequestDto = {
			...this.form.value,
			role: Role.MANAGER
		};

		const returnUrl = this.route.snapshot.queryParams['returnUrl'];

		this.authService.login(loginRequest).subscribe(() => {
			if (returnUrl && returnUrl !== `/${commonRoutingConstants.mfa}`) {
				this.router.navigate([commonRoutingConstants.mfa], { queryParams: { returnUrl } });
				return;
			}

			this.router.navigate([commonRoutingConstants.mfa]);
		});
	}

	private createForm(): void {
		this.form = this.fb.group({
			email: ['', [Validators.required, Validators.pattern(RegexUtil.emailRegexPattern)]],
			password: ['', [Validators.required, Validators.maxLength(256)]],
			rememberMe: false,
			reCaptchaResponse: ['', this.userIsBlocked ? [Validators.required] : []]
		});
	}

	private subscribeToCaptcha(): void {
		this.captchaService.displayCaptchaObservable.subscribe((data) => {
			if (data === CaptchaStatus.CREATED) {
				this.addRecaptcha();
			} else {
				if (!this.ngRecaptcha) {
					return;
				}

				this.ngRecaptcha.reset();
			}

			this.addRecaptchaValidatorsAndDetechChanges();
		});
	}

	private addRecaptcha(): void {
		if (this.userIsBlocked && this.form.get('reCaptchaResponse')) {
			return;
		}

		this.userIsBlocked = true;
	}

	private addRecaptchaValidatorsAndDetechChanges(): void {
		const recaptcha = this.form.get('reCaptchaResponse');
		if (recaptcha && !recaptcha.hasValidator(Validators.required)) {
			recaptcha.addValidators(Validators.required);
			recaptcha.updateValueAndValidity();
		}
	}
}
