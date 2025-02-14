import { Component, inject, OnInit } from '@angular/core';
import { FormField } from '../../models/form-field.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { L4LErrorStateMatcher } from '../../helpers/error-state-matcher';
import { FormUtil } from '../../util/form.util';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RegexUtil } from '../../util/regex.util';
import { MatChipInputEvent } from '@angular/material/chips';
import { InviteMerchantsDto } from '../../models/invite-merchants-dto.model';
import { SnackbarType } from '../../_enums/snackbar-type.enum';
import { CustomSnackbarComponent } from '../custom-snackbar/custom-snackbar.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarData } from '../../models/snackbar-data.model';
import { ModalData } from '../../models/dialog-data.model';
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';
import { InvitationService } from '../../services/invitation.service';

@Component({
	selector: 'app-invite-merchant-dialog',
	templateUrl: './invite-merchant-dialog.component.html',
	styleUrl: './invite-merchant-dialog.component.scss'
})
export class InviteMerchantDialogComponent implements OnInit {
	public hasRequiredError = FormUtil.hasRequiredError;

	public merchantEmails: Set<string> = new Set<string>();
	public emailError: string;

	public formFields: FormField[] = [];
	public form: FormGroup;
	public matcher = new L4LErrorStateMatcher();

	private readonly fb = inject(FormBuilder);
	private readonly dialogRef = inject(MatDialogRef<InviteMerchantDialogComponent>);
	private readonly invitationService = inject(InvitationService);
	private readonly snackBar = inject(MatSnackBar);
	private readonly translateService = inject(TranslateService);
	private readonly dialog = inject(MatDialog);

	public get isFormValid(): boolean {
		return this.form.valid && this.merchantEmails.size > 0;
	}

	public get merchantEmailsArray(): string[] {
		return [...this.merchantEmails];
	}

	public get invitationMessageLength(): number {
		return this.form.controls['invitationMessage'].value.length;
	}

	public ngOnInit(): void {
		this.createForm();
	}

	public closeDialog(): void {
		if (!this.hasFormChanges()) {
			this.dialogRef.close();
			return;
		}

		this.showWarningDialog();
	}

	public handleEnterKeyup(event: MatChipInputEvent): void {
		const emailRegex = new RegExp(RegexUtil.emailRegexPattern);
		const email = (event.value || '').trim();

		if (!email || !emailRegex.test(email)) {
			this.emailError = 'inviteMerchants.error.emailPattern';
			return;
		}

		if (this.merchantEmails.has(email)) {
			this.emailError = 'inviteMerchants.error.emailAlreadyInList';
			return;
		}

		if (this.merchantEmails.size >= 5) {
			this.emailError = 'inviteMerchants.error.emailsLimitReached';
			return;
		}

		this.merchantEmails.add(email);
		this.emailError = '';
		event.chipInput!.clear();
	}

	public removeEmailFromList(email: string): void {
		this.merchantEmails.delete(email);
	}

	public inviteMerchants(): void {
		if (this.form.invalid) return;
		this.sendInvitations();
	}

	public hasFormChanges(): boolean {
		const invitationValue = this.form.get('invitationMessage')?.value;

		return invitationValue || this.merchantEmailsArray.length > 0;
	}

	private sendInvitations(): void {
		const inviteSuppliersDto = this.getFormValuesToInviteMerchantsDto();
		this.invitationService.inviteMerchants(inviteSuppliersDto).subscribe((result) => {
			this.dialogRef.close(true);

			const isSingleMail = inviteSuppliersDto.emails.length === 1;

			this.showToaster(isSingleMail, SnackbarType.SUCCESS);

			if (!result) {
				return;
			}

			this.showToaster(isSingleMail, SnackbarType.INFO);
		});
	}

	private getFormValuesToInviteMerchantsDto(): InviteMerchantsDto {
		return new InviteMerchantsDto(this.merchantEmailsArray, this.form.controls['invitationMessage'].value);
	}

	private createForm(): void {
		this.form = this.fb.group({
			invitationMessage: ['', [Validators.required, Validators.maxLength(1024)]],
			email: ['']
		});
	}

	private showWarningDialog(): void {
		const warningModalData = new ModalData(
			'general.warning',
			'',
			'inviteMerchants.warning',
			'general.button.stay',
			'general.button.cancel',
			false,
			'',
			true,
			'warning'
		);

		this.dialog
			.open(GenericDialogComponent, CustomDialogConfigUtil.createMessageModal(warningModalData, '400px'))
			.afterClosed()
			.subscribe((confirmed: boolean) => {
				if (!confirmed) {
					return;
				}

				this.dialogRef.close();
			});
	}

	private showToaster(isSingleMail: boolean, type: SnackbarType): void {
		const messageKey = isSingleMail
			? type === SnackbarType.SUCCESS
				? 'inviteMerchants.successOne'
				: 'inviteMerchants.merchantAlreadyRegistered'
			: type === SnackbarType.SUCCESS
			? 'inviteMerchants.successMultiple'
			: 'inviteMerchants.merchantsAlreadyRegistered';

		const toasterMessage = this.translateService.instant(messageKey);

		this.snackBar.openFromComponent(CustomSnackbarComponent, {
			duration: 8000,
			data: new SnackbarData(toasterMessage, type),
			horizontalPosition: 'right',
			verticalPosition: 'bottom'
		});
	}
}
