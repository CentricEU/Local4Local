import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InviteMerchantDialogComponent } from './invite-merchant-dialog.component';
import { MerchantService } from '../../services/merchant.service';
import { of } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatChipInput, MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';

describe('InviteMerchantDialogComponent', () => {
	let component: InviteMerchantDialogComponent;
	let fixture: ComponentFixture<InviteMerchantDialogComponent>;
	let merchantServiceMock: jest.Mocked<MerchantService>;
	let mockChipInputEvent: MatChipInputEvent;

	const dialogRefStub = {
		close: () => undefined,
		afterClosed: jest.fn(() => of({})),
		backdropClick: jest.fn(() => of({}))
	};

	beforeEach(async () => {
		const mockChipInput: Partial<MatChipInput> = {
			clear: jest.fn()
		};

		global.structuredClone = jest.fn((val) => {
			return JSON.parse(JSON.stringify(val));
		});

		const mockInputElement = document.createElement('input');
		mockInputElement.value = 'test chip';

		mockChipInputEvent = {
			input: mockInputElement,
			value: mockInputElement.value,
			chipInput: mockChipInput as MatChipInput
		} as MatChipInputEvent;

		merchantServiceMock = {
			inviteMerchants: jest.fn(() =>
				of({
					subscribe: () => jest.fn()
				})
			)
		} as any;

		await TestBed.configureTestingModule({
			declarations: [InviteMerchantDialogComponent, GenericDialogComponent],
			imports: [
				TranslateModule.forRoot(),
				ReactiveFormsModule,
				HttpClientTestingModule,
				MatIconModule,
				MatFormFieldModule,
				MatInputModule,
				BrowserAnimationsModule,
				MatChipsModule,
				MatDialogModule,
				NoopAnimationsModule
			],
			providers: [
				FormBuilder,
				{ provide: MatDialogRef, useValue: dialogRefStub },
				{ provide: MerchantService, useValue: merchantServiceMock },
				{ provide: MAT_DIALOG_DATA, useValue: null }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(InviteMerchantDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should close the dialog when close method is called and form has no data', () => {
		jest.spyOn(dialogRefStub, 'close');
		component.closeDialog();

		expect(dialogRefStub.close).toHaveBeenCalled();
	});

	it('should add e-mail to list if it is valid when enter key is pressed', () => {
		mockChipInputEvent.value = 'email@domain.com';
		component.handleEnterKeyup(mockChipInputEvent);

		expect([...component.merchantEmails]).toEqual(['email@domain.com']);
	});

	it('should display an error when trying to add an e-mail that is already in the list', () => {
		component.merchantEmails.add('email@domain.com');

		mockChipInputEvent.value = 'email@domain.com';
		component.handleEnterKeyup(mockChipInputEvent);

		expect(component.emailError).toEqual('inviteMerchants.error.emailAlreadyInList');
	});

	it('should display an error when trying to add an invalid e-mail', () => {
		mockChipInputEvent.value = 'invalidemail@';
		component.handleEnterKeyup(mockChipInputEvent);
		expect(component.emailError).toEqual('inviteMerchants.error.emailPattern');
	});

	it('should display an error when trying to add more than 50 emails', () => {
		for (let i = 1; i <= 51; i++) {
			mockChipInputEvent.value = `email${i}@domain.com`;
			component.handleEnterKeyup(mockChipInputEvent);
		}
		expect(component.emailError).toEqual('inviteMerchants.error.emailsLimitReached');
	});

	it('should mark invitation message as invalid if empty', () => {
		const invitationMessageControl = component.form.get('invitationMessage');
		invitationMessageControl?.setValue('');

		expect(invitationMessageControl?.valid).toBeFalsy();
	});

	it('should mark form as valid if there are emails provided and message is not empty', () => {
		const invitationMessageControl = component.form.get('invitationMessage');
		invitationMessageControl?.setValue('Invitation message.');

		component.merchantEmails.add('email@domain.com');

		expect(component.isFormValid).toBeTruthy();
	});

	it('should remove given email from list', () => {
		component.merchantEmails.add('email1@domain.com');
		component.merchantEmails.add('email2@domain.com');

		component.removeEmailFromList('email1@domain.com');

		expect([...component.merchantEmails]).toEqual(['email2@domain.com']);
	});

	it('should get the data from the form and return it as a dto', () => {
		const invitationMessageControl = component.form.get('invitationMessage');
		invitationMessageControl?.setValue('Invitation message.');

		component.merchantEmails.add('email1@domain.com');

		const result = component['getFormValuesToInviteMerchantsDto']();

		expect(result.message).toBe('Invitation message.');
	});

	it('should send the invitations and close the dialog', () => {
		jest.spyOn(component as any, 'getFormValuesToInviteMerchantsDto');
		jest.spyOn(component as any, 'showSuccessToaster');
		jest.spyOn(dialogRefStub, 'close');

		component['sendInvitations']();

		expect(component['getFormValuesToInviteMerchantsDto']).toHaveBeenCalled();
		expect(component['showSuccessToaster']).toHaveBeenCalled();
		expect(merchantServiceMock.inviteMerchants).toHaveBeenCalled();
		expect(dialogRefStub.close).toHaveBeenCalled();
	});

	it('should not call sendInvitations if the form is invalid', () => {
		jest.spyOn(component as any, 'sendInvitations');

		const invitationMessageControl = component.form.get('invitationMessage');
		invitationMessageControl?.setValue('');
		component.merchantEmails.add('email1@');

		component.inviteMerchants();

		expect(component['sendInvitations']).not.toHaveBeenCalled();
	});

	it('should call sendInvitations if the form is valid', () => {
		jest.spyOn(component as any, 'sendInvitations');

		const invitationMessageControl = component.form.get('invitationMessage');
		invitationMessageControl?.setValue('Invitation message.');

		component.merchantEmails.add('email1@domain.com');

		component.inviteMerchants();

		expect(component['sendInvitations']).toHaveBeenCalled();
	});

	it('should close the dialog if there are no form changes', () => {
		jest.spyOn(component, 'hasFormChanges').mockReturnValue(false);
		jest.spyOn(dialogRefStub, 'close');

		component.closeDialog();

		expect(component.hasFormChanges).toHaveBeenCalled();
		expect(dialogRefStub.close).toHaveBeenCalled();
	});

	it('should open warning dialog when showWarningDialog is called', () => {
		const dialogSpy = jest.spyOn(component['dialog'], 'open').mockReturnValue({
			afterClosed: () => of(true)
		} as any);

		component['showWarningDialog']();

		expect(dialogSpy).toHaveBeenCalled();
	});

	it('should close the dialog if the user confirms the warning dialog', () => {
		const dialogSpy = jest.spyOn(component['dialog'], 'open').mockReturnValue({
			afterClosed: () => of(true)
		} as any);

		jest.spyOn(dialogRefStub, 'close');

		component['showWarningDialog']();

		expect(dialogSpy).toHaveBeenCalled();
		expect(dialogRefStub.close).toHaveBeenCalled();
	});

	it('should call showWarningDialog if there are form changes', () => {
		jest.spyOn(component, 'hasFormChanges').mockReturnValue(true);
		const showWarningDialogSpy = jest.spyOn(component as any, 'showWarningDialog');

		component.closeDialog();

		expect(component.hasFormChanges).toHaveBeenCalled();
		expect(showWarningDialogSpy).toHaveBeenCalled();
	});
});
