import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormField } from '../../models/form-field.model';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { L4LErrorStateMatcher } from '../../helpers/error-state-matcher';
import { FormUtil } from '../../util/form.util';
import { EsriLocatorService } from '../../services/esri-locator/esri-locator.service';
import { EsriSuggestionResult } from '../../models/esri-suggestion-response.model';
import AddressCandidate from '@arcgis/core/rest/support/AddressCandidate';
import { CategoryDto } from '../../_models/category-dto.model';
import { CategoryService } from '../../services/category.service';
import { MerchantService } from '../../services/merchant.service';
import { MerchantDto } from '../../models/merchant-dto.model';
import { ALREADY_REGISTERED_CODE, SUCCESS_CODE } from '../../_constants/error-constants';
import { RegexUtil } from '../../util/regex.util';
import { ColumnType } from '../../enums/column.enum';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from '../custom-snackbar/custom-snackbar.component';
import { SnackbarData } from '../../models/snackbar-data.model';
import { SnackbarType } from '../../_enums/snackbar-type.enum';
import { MerchantDialogType } from '../../enums/merchant-dialog-type.enum';
import { RejectMerchantDto } from '../../models/reject-merchant-dto.model';
import { ModalData } from '../../models/dialog-data.model';
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';

type ApprovalDialogValue = string | number | null | undefined;

@Component({
	selector: 'app-merchant-dialog',
	templateUrl: './merchant-dialog.component.html',
	styleUrls: ['./merchant-dialog.component.scss']
})
export class MerchantDialogComponent implements OnInit {
	public hasRequiredError = FormUtil.hasRequiredError;
	public hasPatternError = FormUtil.hasPatternError;

	public merchantDialogType: MerchantDialogType;
	public formFields: FormField[] = [];
	public form: FormGroup;
	public matcher = new L4LErrorStateMatcher();

	public suggestions: EsriSuggestionResult[] = [];
	public selectedLocation: AddressCandidate | null = null;
	public categories: CategoryDto[] = [];

	private fb = inject(FormBuilder);
	private esriLocatorService = inject(EsriLocatorService);
	private translateService = inject(TranslateService);
	private readonly data = inject(MAT_DIALOG_DATA);

	private readonly dialogRef = inject(MatDialogRef<MerchantDialogComponent>);
	private readonly categoryService = inject(CategoryService);
	private readonly merchantService = inject(MerchantService);
	private readonly snackBar = inject(MatSnackBar);
	private readonly dialog = inject(MatDialog);

	private currentMerchantId: string;

	private readonly merchantDialogContent = {
		[MerchantDialogType.APPROVAL]: {
			title: 'approveMerchant.title',
			subtitle: 'approveMerchant.subtitle',
			actionButton: 'approveMerchant.title'
		},
		[MerchantDialogType.REJECTION]: {
			title: 'rejectMerchant.title',
			subtitle: 'rejectMerchant.subtitle',
			actionButton: 'rejectMerchant.title'
		},
		[MerchantDialogType.REGISTRATION]: {
			title: 'register.title',
			subtitle: 'register.subtitle',
			actionButton: 'register.registerButton'
		}
	};

	public get reasonMessageLength(): number {
		return this.form.controls['reason'].value?.length || 0;
	}

	public get hasNoSuggestions(): boolean {
		return this.suggestions.length === 0 && !this.selectedLocation;
	}

	public get title(): string {
		return this.merchantDialogContent[this.merchantDialogType]?.title ?? '';
	}

	public get subtitle(): string {
		return this.merchantDialogContent[this.merchantDialogType]?.subtitle ?? '';
	}

	public get actionButton(): string {
		return this.merchantDialogContent[this.merchantDialogType]?.actionButton ?? '';
	}

	public ngOnInit(): void {
		this.checkFormMode();
		this.initCategories();
		this.initializeFormFields();
		this.createForm();
	}

	public isApprovalOrRejection(): boolean {
		return (
			this.merchantDialogType === MerchantDialogType.APPROVAL ||
			this.merchantDialogType === MerchantDialogType.REJECTION
		);
	}

	public isDisabled(): boolean {
		if (this.merchantDialogType === MerchantDialogType.APPROVAL) {
			return false;
		}

		if (this.merchantDialogType === MerchantDialogType.REJECTION) {
			return this.form.invalid;
		}

		return this.form.invalid || !this.selectedLocation;
	}

	public onSearchAddress(event: Event): void {
		this.selectedLocation = null;

		const input = (event.target as HTMLInputElement).value.trim();

		if (input.length <= 2) {
			this.suggestions = [];
			return;
		}

		this.esriLocatorService.getSuggestions(input).subscribe({
			next: (suggestions) => (this.suggestions = suggestions),
			error: () => {
				this.suggestions = [];
			}
		});
	}

	public selectAddress(suggestion: EsriSuggestionResult): void {
		this.form.get('address')?.setValue(suggestion.text);

		this.suggestions = [];

		this.esriLocatorService.findLocationBasedOnSuggestion(suggestion).subscribe({
			next: (locationData) => (this.selectedLocation = locationData[0] ?? null),
			error: () => (this.selectedLocation = null)
		});
	}

	public closeDialog(success?: string): void {
		const reasonValue = this.form.get('reason')?.value;

		if (reasonValue) {
			this.showWarningDialog();
			return;
		}

		this.dialogRef.close(success);
	}

	public performAction(): void {
		switch (this.merchantDialogType) {
			case MerchantDialogType.APPROVAL:
				this.approveMerchant(this.currentMerchantId);
				break;
			case MerchantDialogType.REJECTION:
				this.rejectMerchant(this.currentMerchantId);
				break;
			case MerchantDialogType.REGISTRATION:
				this.registerMerchant();
				break;
		}
	}

	public onKvkInput(event: Event): void {
		const input = event.target as HTMLInputElement;
		input.value = input.value.replace(/\D/g, '');
	}

	private approveMerchant(merchantId: string): void {
		this.merchantService.approveMerchant(merchantId).subscribe(() => {
			this.closeDialog(SUCCESS_CODE);
			this.showSuccessToast();
		});
	}

	private rejectMerchant(currentMerchantId: string): void {
		const reason = this.form.get('reason')?.value;
		const rejectMerchantDto = new RejectMerchantDto(currentMerchantId, reason);

		this.merchantService.rejectMerchant(rejectMerchantDto).subscribe(() => {
			this.closeDialog(SUCCESS_CODE);
			this.showSuccessToast();
		});
	}

	private showSuccessToast(): void {
		const toasterMessage =
			this.merchantDialogType === MerchantDialogType.APPROVAL
				? 'approveMerchant.success'
				: 'rejectMerchant.success';

		const translatedValue = this.translateService.instant(toasterMessage);

		this.snackBar.openFromComponent(CustomSnackbarComponent, {
			duration: 8000,
			data: new SnackbarData(translatedValue, SnackbarType.SUCCESS),
			horizontalPosition: 'right',
			verticalPosition: 'bottom'
		});
	}

	private registerMerchant(): void {
		if (this.form.invalid) return;

		const merchantDto = this.createMerchantDto();

		this.merchantService.registerMerchant(merchantDto).subscribe({
			next: () => this.closeDialog(SUCCESS_CODE),
			error: ({ error: { message } }) => {
				const dialogResult = message === ALREADY_REGISTERED_CODE ? ALREADY_REGISTERED_CODE : null;
				this.closeDialog(dialogResult as string);
			}
		});
	}

	private createMerchantDto(): MerchantDto {
		const { companyName, kvk, category, address, contactEmail, website } = this.form.value;
		const { location } = this.selectedLocation ?? {};

		return {
			companyName,
			kvk: kvk,
			category,
			latitude: location?.y ?? 0.0,
			longitude: location?.x ?? 0.0,
			address,
			contactEmail,
			website
		};
	}

	private initializeFormFields(): void {
		this.formFields = [];

		if (this.merchantDialogType === MerchantDialogType.REJECTION) {
			this.formFields.push({
				formControl: 'reason',
				labelKey: 'rejectMerchant.reason',
				fieldType: 'textarea',
				required: true,
				isReadOnly: false,
				maxLength: 1024,
				requiredMessage: 'rejectMerchant.error.reasonRequired'
			});
		}

		this.formFields.push(
			{
				formControl: 'companyName',
				labelKey: 'table.column.companyName',
				fieldType: 'input',
				required: true,
				maxLength: 256,
				isReadOnly: this.isApprovalOrRejection(),
				requiredMessage: 'register.error.companyNameRequired'
			},
			{
				formControl: 'kvk',
				labelKey: 'table.column.kvkNumber',
				fieldType: 'input',
				required: true,
				maxLength: 8,
				isReadOnly: this.isApprovalOrRejection(),
				requiredMessage: 'register.error.kvkNumberRequired',
				pattern: RegexUtil.kvkRegexPattern,
				patternMessage: 'register.error.kvkFormControlLength'
			},
			{
				formControl: 'category',
				labelKey: 'table.column.category',
				fieldType: this.isApprovalOrRejection() ? 'input' : 'select',
				required: true,
				isReadOnly: this.isApprovalOrRejection(),
				options: this.categories,
				requiredMessage: 'register.error.categoryRequired'
			},
			{
				formControl: 'address',
				labelKey: 'table.column.address',
				fieldType: 'input',
				required: true,
				isReadOnly: this.isApprovalOrRejection(),
				maxLength: 256,
				requiredMessage: 'register.error.addressRequired'
			},
			{
				formControl: 'contactEmail',
				labelKey: 'register.contactEmail',
				fieldType: 'input',
				required: true,
				isReadOnly: this.isApprovalOrRejection(),
				maxLength: 256,
				pattern: RegexUtil.emailRegexPattern,
				patternMessage: 'register.error.emailInvalid',
				requiredMessage: 'register.error.emailRequired'
			},
			{
				formControl: 'website',
				labelKey: 'register.website',
				fieldType: 'input',
				required: false,
				isReadOnly: this.isApprovalOrRejection(),
				maxLength: 256,
				pattern: RegexUtil.urlRegexPattern,
				patternMessage: 'register.error.invalidUrl'
			}
		);
	}

	private createForm(): void {
		const merchantData = this.isApprovalOrRejection() ? (this.data.merchant as MerchantDto) : null;

		const controls = this.formFields.reduce((acc, field) => {
			const formControlName = field.formControl as keyof MerchantDto;

			let formControlValue = merchantData ? merchantData[formControlName] : null;

			if (this.isApprovalOrRejection()) {
				formControlValue = this.handleApprovalDialogValues(field, formControlValue);
			}

			acc[formControlName] = new FormControl(formControlValue, this.getValidators(field));
			return acc;
		}, {} as Record<string, FormControl>);

		this.form = this.fb.group(controls);
	}

	private handleApprovalDialogValues(field: FormField, value: ApprovalDialogValue): ApprovalDialogValue {
		if (field.formControl === ColumnType.WEBSITE && value === null) {
			return '-';
		}

		if (field.formControl === ColumnType.CATEGORY && value !== null) {
			return this.translateService.instant(value as string);
		}

		return value;
	}

	private getValidators(field: FormField): ValidatorFn[] {
		const validators = [];

		if (field.required) {
			validators.push(Validators.required);
		}

		if (this.merchantDialogType === MerchantDialogType.REGISTRATION && field.pattern) {
			validators.push(Validators.pattern(field.pattern));
		}

		return validators;
	}

	private initCategories(): void {
		this.categoryService.categories.subscribe((data) => {
			this.categories = data;
		});
	}

	private checkFormMode(): void {
		this.merchantDialogType = this.data?.dialogType ?? MerchantDialogType.REGISTRATION;
		this.currentMerchantId = this.data?.merchant?.id;
	}

	private showWarningDialog(): void {
		const warningModalData = new ModalData(
			'general.warning',
			'',
			'rejectMerchant.warning',
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
}
