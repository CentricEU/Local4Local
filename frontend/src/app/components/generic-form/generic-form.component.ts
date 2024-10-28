import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { commonRoutingConstants } from '../../_constants/common-routing.constants';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegexUtil } from '../../util/regex.util';
import { FormUtil } from '../../util/form.util';
import { L4LErrorStateMatcher } from '../../helpers/error-state-matcher';
import { UserService } from '../../services/user.service';
import { ChangePasswordDto } from '../../models/change-password-dto.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ModalData } from '../../models/dialog-data.model';
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';

@Component({
    selector: 'app-generic-form',
    templateUrl: './generic-form.component.html',
    styleUrl: './generic-form.component.scss'
})
export class GenericFormComponent implements OnInit {
    public currentRoute: string;

    public form: FormGroup;

    public matcher = new L4LErrorStateMatcher();

    public shouldDisplayDialog = false;

    public passwordValidator = FormUtil.validatePassword;
    public confirmPasswordValidator = FormUtil.confirmPasswordValidator;

    private token: string;

    private routeFormMap = {
        [commonRoutingConstants.recover]: this.createRecoverForm.bind(this),
        [commonRoutingConstants.changePassword]: this.createResetPasswordForm.bind(this)
    };

    private routeTextMap = {
        [commonRoutingConstants.recover]: { title: 'recover.title', buttonText: 'general.button.link' },
        [commonRoutingConstants.changePassword]: { title: 'password.resetPassword.title', buttonText: 'general.button.confirm' }
    };

    public get title(): string {
        return this.routeTextMap[this.currentRoute]?.title || '';
    }

    public get buttonText(): string {
        return this.routeTextMap[this.currentRoute]?.buttonText || '';
    }

    public get passwordError(): string {
        if (this.form.get('password')?.hasError('required')) {
            return 'password.error.passwordRequired';
        }

        if (this.form.get('password')?.hasError('validPassword')) {
            return 'password.error.passwordRequirements';
        }

        return '';
    }

    public get confirmPasswordError(): string {
        if (this.form.get('confirmPassword')?.hasError('required')) {
            return 'password.error.confirmPasswordRequired';
        }

        if (this.form.get('confirmPassword')?.hasError('fieldsMismatch')) {
            return 'password.error.confirmPasswordMatch';
        }

        return '';
    }

    public get emailError(): string {
        if (this.form.get('email')?.hasError('required')) {
            return 'email.error.emailRequired';
        }

        if (this.form.get('email')?.hasError('pattern')) {
            return 'email.error.validEmail';
        }

        return '';
    }

    private fb = inject(FormBuilder);
    private activatedRoute = inject(ActivatedRoute);
    private userService = inject(UserService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private dialog = inject(MatDialog);

    public ngOnInit(): void {
        this.currentRoute = this.activatedRoute.snapshot.routeConfig?.path?.split('/:')[0] || '';
        this.performLogicBasedOnRoute(this.currentRoute);
    }

    public isRecoverPath(): boolean {
        return this.currentRoute === commonRoutingConstants.recover;
    }

    public isInvalidPassword(): boolean {
        const passwordControl = this.form.get('password');
        return passwordControl ? passwordControl.hasError('validPassword') && !passwordControl.hasError('required') : false;
    }

    public performAction(): void {
        if (this.form.invalid) {
            return;
        }

        if (this.isRecoverPath()) {
            this.performRecover();
            return;
        }

        this.performResetPassword();
    }

    private performResetPassword(): void {

        const changePasswordModel = new ChangePasswordDto(this.token, this.form.get('confirmPassword')?.value);

        this.userService.changePassword(changePasswordModel).subscribe(
            {
                next: () => {
                    this.displaySuccessfulChangePassDialog();
                },
                error: () => {
                    this.form.reset();
                }
            }
        );

    }

    private getTokenFromParam(): void {
        this.route?.params?.subscribe((params) => {
            if (!params || (params && !params['token'])) {
                return;
            }

            this.token = params['token'];
            this.getRecoverByToken(this.token);
        });
    }

    private getRecoverByToken(token: string): void {
        this.userService.getRecoverByToken(token).subscribe(
            {
                error: () => {
                    this.navigateToRecover();
                }
            }
        );
    }

    private navigateToRecover(): void {
        this.router.navigate([commonRoutingConstants.recover]);
    }

    private performRecover(): void {
        const recoverPasswordDto = this.form.value;
        this.userService.recoverPassword(recoverPasswordDto).subscribe({
            next: () => {
                this.displaySuccessfulRecoveryDialog();
            }
        });
    }

    private displaySuccessfulRecoveryDialog(): void {
        this.shouldDisplayDialog = true;
        this.displaySuccessfulRecoveryPopup();
    }

    private displaySuccessfulChangePassDialog(): void {
        this.shouldDisplayDialog = true;
        this.displaySuccessfulChangePassPopup();
    }

    private displaySuccessfulRecoveryPopup(): void {
        const successfulRecoveryModalData = new ModalData(
            'recoveryDialog.title',
            'general.congratulations',
            'recoveryDialog.secondaryText',
            '',
            '',
            true,
            'check.svg',
            false,
            ''
        );

        this.dialog.open(GenericDialogComponent, CustomDialogConfigUtil.createMessageModal(successfulRecoveryModalData));
    }

    private displaySuccessfulChangePassPopup(): void {
        const successfulRecoveryModalData = new ModalData(
            'changePassDialog.title',
            'general.congratulations',
            'changePassDialog.secondaryText',
            '',
            'general.button.continueToLogin',
            true,
            'check.svg',
            true,
            ''
        );

        const dialogRef = this.dialog.open(GenericDialogComponent, CustomDialogConfigUtil.createMessageModal(successfulRecoveryModalData));

        this.closeAndRedirectToLogin(dialogRef);
    }

    private closeAndRedirectToLogin(dialogRef: MatDialogRef<GenericDialogComponent, boolean>): void {
        dialogRef.afterClosed().subscribe((result: boolean | undefined) => {
            if (!result) {
                return;
            }

            this.router.navigate([commonRoutingConstants.login]);
        });
    }

    private createRecoverForm(): void {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.pattern(RegexUtil.emailRegexPattern)]],
            reCaptchaResponse: ['', [Validators.required]]
        });
    }

    private createResetPasswordForm(): void {
        this.form = this.fb.group({
            password: ['', [Validators.required, this.passwordValidator]],
            confirmPassword: ['', [Validators.required, this.confirmPasswordValidator]]
        });
    }

    private performLogicBasedOnRoute(route: string): void {
        const action = this.routeFormMap[route];
        if (!action) {
            return;
        }

        if (route === commonRoutingConstants.changePassword) {
            this.getTokenFromParam();
        }

        action();
    }

}
