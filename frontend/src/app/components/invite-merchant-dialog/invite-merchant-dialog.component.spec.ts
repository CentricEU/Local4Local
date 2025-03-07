import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InviteMerchantDialogComponent } from './invite-merchant-dialog.component';
import { of } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';
import { InvitationService } from '../../services/invitation.service';
import { InviteMerchantsDto } from '../../models/invite-merchants-dto.model';
import { SnackbarType } from '../../_enums/snackbar-type.enum';

describe('InviteMerchantDialogComponent', () => {
	let component: InviteMerchantDialogComponent;
	let fixture: ComponentFixture<InviteMerchantDialogComponent>;
	let invitationServiceMock: jest.Mocked<InvitationService>;
	let dialogRefStub: any;

	beforeEach(async () => {
		global.structuredClone = jest.fn((val) => {
			return JSON.parse(JSON.stringify(val));
		});

		dialogRefStub = {
			close: jest.fn(),
			afterClosed: jest.fn(() => of({}))
		};

		invitationServiceMock = {
			inviteMerchants: jest.fn(() => of(true))
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
				{ provide: InvitationService, useValue: invitationServiceMock },
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

	it('should add valid email and clear input', () => {
		const inputElement = document.createElement('input');
		inputElement.value = 'valid@example.com';

		const event = new KeyboardEvent('keyup', { key: 'Space', bubbles: true, cancelable: true });
		Object.defineProperty(event, 'target', { value: inputElement, writable: true });
		component.handleKeyup(event, true);

		expect(component.merchantEmails.has('valid@example.com')).toBeTruthy();
		expect(inputElement.value).toBe('');
	});

	it('should not add duplicate emails', () => {
		component.merchantEmails.add('duplicate@example.com');
		const inputElement = document.createElement('input');
		inputElement.value = 'duplicate@example.com';

		const event = new KeyboardEvent('keyup', { key: 'Space', bubbles: true, cancelable: true });
		Object.defineProperty(event, 'target', { value: inputElement, writable: true });
		component.handleKeyup(event, true);

		expect(component.emailError).toEqual('inviteMerchants.error.emailAlreadyInList');
	});

	it('should remove email from the list', () => {
		component.merchantEmails.add('remove@example.com');
		component.removeEmailFromList('remove@example.com');
		expect(component.merchantEmails.has('remove@example.com')).toBeFalsy();
	});

	it('should validate empty invitation message', () => {
		component.form.controls['invitationMessage'].setValue('');
		expect(component.form.controls['invitationMessage'].valid).toBeFalsy();
	});

	it('should validate form when email and message are provided', () => {
		component.merchantEmails.add('valid@example.com');
		component.form.controls['invitationMessage'].setValue('A message.');
		expect(component.isFormValid).toBeTruthy();
	});

	it('should call service to send invitations', () => {
		jest.spyOn(component as any, 'getFormValuesToInviteMerchantsDto').mockReturnValue(
			new InviteMerchantsDto(['valid@example.com'], 'A message.')
		);
		jest.spyOn(invitationServiceMock, 'inviteMerchants').mockReturnValue(of(false));

		component['sendInvitations']();

		expect(invitationServiceMock.inviteMerchants).toHaveBeenCalledWith(
			new InviteMerchantsDto(['valid@example.com'], 'A message.')
		);
	});

	it('should close dialog on successful invitation', () => {
		jest.spyOn(component as any, 'getFormValuesToInviteMerchantsDto').mockReturnValue(
			new InviteMerchantsDto(['valid@example.com'], 'A message.')
		);
		jest.spyOn(invitationServiceMock, 'inviteMerchants').mockReturnValue(of(true));
		jest.spyOn(dialogRefStub, 'close');

		component['sendInvitations']();

		expect(dialogRefStub.close).toHaveBeenCalledWith(true);
	});

	it('should show warning dialog if form has changes', () => {
		jest.spyOn(component, 'hasFormChanges').mockReturnValue(true);
		const dialogSpy = jest
			.spyOn(component['dialog'], 'open')
			.mockReturnValue({ afterClosed: () => of(true) } as any);

		component.closeDialog();
		expect(dialogSpy).toHaveBeenCalled();
	});

	const testCases = [
		{ message: true, emails: ['valid@example.com'], expected: true },
		{ message: '', emails: ['valid@example.com'], expected: true },
		{ message: true, emails: [], expected: true },
		{ message: '', emails: [], expected: false }
	];

	testCases.forEach(({ message, emails, expected }) => {
		it(`should return ${expected} if invitation message is "${message}" and merchant emails list is ${
			emails.length ? 'not empty' : 'empty'
		}`, () => {
			component.form.controls['invitationMessage'].setValue(message);
			component.merchantEmails.clear();
			emails.forEach((email) => component.merchantEmails.add(email));
			expect(component.hasFormChanges()).toBe(expected);
		});
	});

	it('should return false if form has no changes', () => {
		component.form.controls['invitationMessage'].setValue('');
		component.merchantEmails.clear();
		expect(component.hasFormChanges()).toBeFalsy();
	});

	it('should return true if form has invitation message', () => {
		component.form.controls['invitationMessage'].setValue('A message.');
		component.merchantEmails.clear();
		expect(component.hasFormChanges()).toBeTruthy();
	});

	it('should return true if form has merchant emails', () => {
		component.form.controls['invitationMessage'].setValue('');
		component.merchantEmails.add('valid@example.com');
		expect(component.hasFormChanges()).toBeTruthy();
	});

	it('should not send invitations if form is invalid', () => {
		component.form.controls['invitationMessage'].setValue('');
		const sendInvitationsSpy = jest.spyOn(component as any, 'sendInvitations');
		component.inviteMerchants();
		expect(sendInvitationsSpy).not.toHaveBeenCalled();
	});

	it('should send invitations if form is valid', () => {
		component.form.controls['invitationMessage'].setValue('A message.');
		component.merchantEmails.add('valid@example.com');
		const sendInvitationsSpy = jest.spyOn(component as any, 'sendInvitations');
		component.inviteMerchants();
		expect(sendInvitationsSpy).toHaveBeenCalled();
	});

	it('should call showWarningDialog if form has changes on closeDialog', () => {
		jest.spyOn(component, 'hasFormChanges').mockReturnValue(true);
		const showWarningDialogSpy = jest.spyOn(component as any, 'showWarningDialog');
		component.closeDialog();
		expect(showWarningDialogSpy).toHaveBeenCalled();
	});

	it('should not call showWarningDialog if form has no changes on closeDialog', () => {
		jest.spyOn(component, 'hasFormChanges').mockReturnValue(false);
		const showWarningDialogSpy = jest.spyOn(component as any, 'showWarningDialog');
		component.closeDialog();
		expect(showWarningDialogSpy).not.toHaveBeenCalled();
	});

	it('should call showToaster with success type on successful invitation', () => {
		const inviteMerchantsDto = new InviteMerchantsDto(['valid@example.com'], 'A message.');
		jest.spyOn(component as any, 'getFormValuesToInviteMerchantsDto').mockReturnValue(inviteMerchantsDto);
		jest.spyOn(invitationServiceMock, 'inviteMerchants').mockReturnValue(of(true));
		const showToasterSpy = jest.spyOn(component as any, 'showToaster');
		component['sendInvitations']();
		expect(showToasterSpy).toHaveBeenCalledWith(true, SnackbarType.SUCCESS);
	});

	it('should set email error if email pattern is invalid', () => {
		const inputElement = document.createElement('input');
		inputElement.value = 'invalid-email';

		const event = new KeyboardEvent('keyup', { key: 'Space', bubbles: true, cancelable: true });
		Object.defineProperty(event, 'target', { value: inputElement, writable: true });
		component.handleKeyup(event, true);

		expect(component.emailError).toEqual('inviteMerchants.error.emailPattern');
		expect(component.merchantEmails.size).toBe(0);
	});

	it('should set email error if email is already in the list', () => {
		component.merchantEmails.add('duplicate@example.com');
		const inputElement = document.createElement('input');
		inputElement.value = 'duplicate@example.com';

		const event = new KeyboardEvent('keyup', { key: 'Space', bubbles: true, cancelable: true });
		Object.defineProperty(event, 'target', { value: inputElement });
		component.handleKeyup(event, true);

		expect(component.emailError).toEqual('inviteMerchants.error.emailAlreadyInList');
		expect(component.merchantEmails.size).toBe(1);
	});

	it('should set email error if email limit is reached', () => {
		component.merchantEmails.add('email1@example.com');
		component.merchantEmails.add('email2@example.com');
		component.merchantEmails.add('email3@example.com');
		component.merchantEmails.add('email4@example.com');
		component.merchantEmails.add('email5@example.com');
		const inputElement = document.createElement('input');
		inputElement.value = 'newemail@example.com';

		const event = new KeyboardEvent('keyup', { key: 'Space', bubbles: true, cancelable: true });
		Object.defineProperty(event, 'target', { value: inputElement });
		component.handleKeyup(event, true);

		expect(component.emailError).toEqual('inviteMerchants.error.emailsLimitReached');
		expect(component.merchantEmails.size).toBe(5);
	});

	it('should add valid email and clear input', () => {
		const inputElement = document.createElement('input');
		inputElement.value = 'valid@example.com';

		const event = new KeyboardEvent('keyup', { key: 'Space', bubbles: true, cancelable: true });
		Object.defineProperty(event, 'target', { value: inputElement });
		component.handleKeyup(event, true);

		expect(component.merchantEmails.has('valid@example.com')).toBeTruthy();
		expect(inputElement.value).toBe('');
		expect(component.emailError).toBe('');
	});

	it('should add valid email and clear input', () => {
		const inputElement = document.createElement('input');
		inputElement.value = 'valid@example.com';

		const event = new KeyboardEvent('keyup', { key: 'Space', bubbles: true, cancelable: true });
		Object.defineProperty(event, 'target', { value: inputElement });
		component.handleKeyup(event, true);

		expect(component.merchantEmails.has('valid@example.com')).toBeTruthy();
		expect(inputElement.value).toBe('');
		expect(component.emailError).toBe('');
	});

	it('should set email error if email pattern is invalid', () => {
		const inputElement = document.createElement('input');
		inputElement.value = 'invalid-email';

		const event = new KeyboardEvent('keyup', { key: 'Space', bubbles: true, cancelable: true });
		Object.defineProperty(event, 'target', { value: inputElement });
		component.handleKeyup(event, true);

		expect(component.emailError).toEqual('inviteMerchants.error.emailPattern');
		expect(component.merchantEmails.size).toBe(0);
	});

	it('should set email error if email is already in the list', () => {
		component.merchantEmails.add('duplicate@example.com');
		const inputElement = document.createElement('input');
		inputElement.value = 'duplicate@example.com';

		const event = new KeyboardEvent('keyup', { key: 'Space', bubbles: true, cancelable: true });
		Object.defineProperty(event, 'target', { value: inputElement });
		component.handleKeyup(event, true);

		expect(component.emailError).toEqual('inviteMerchants.error.emailAlreadyInList');
		expect(component.merchantEmails.size).toBe(1);
	});

	it('should set email error if email limit is reached', () => {
		component.merchantEmails.add('email1@example.com');
		component.merchantEmails.add('email2@example.com');
		component.merchantEmails.add('email3@example.com');
		component.merchantEmails.add('email4@example.com');
		component.merchantEmails.add('email5@example.com');
		const inputElement = document.createElement('input');
		inputElement.value = 'newemail@example.com';

		const event = new KeyboardEvent('keyup', { key: 'Space', bubbles: true, cancelable: true });
		Object.defineProperty(event, 'target', { value: inputElement });
		component.handleKeyup(event, true);

		expect(component.emailError).toEqual('inviteMerchants.error.emailsLimitReached');
		expect(component.merchantEmails.size).toBe(5);
	});

	it('should call service to send invitations', () => {
		const inviteMerchantsDto = new InviteMerchantsDto(['valid@example.com'], 'A message.');
		jest.spyOn(component as any, 'getFormValuesToInviteMerchantsDto').mockReturnValue(inviteMerchantsDto);
		jest.spyOn(invitationServiceMock, 'inviteMerchants').mockReturnValue(of(true));
		const showToasterSpy = jest.spyOn(component as any, 'showToaster');
		const dialogRefCloseSpy = jest.spyOn(dialogRefStub, 'close');

		component['sendInvitations']();

		expect(invitationServiceMock.inviteMerchants).toHaveBeenCalledWith(inviteMerchantsDto);
		expect(dialogRefCloseSpy).toHaveBeenCalledWith(true);
		expect(showToasterSpy).toHaveBeenCalledWith(true, SnackbarType.SUCCESS);
	});

	it('should not call showToaster with info type if invitation service returns true', () => {
		const inviteMerchantsDto = new InviteMerchantsDto(['valid@example.com'], 'A message.');
		jest.spyOn(component as any, 'getFormValuesToInviteMerchantsDto').mockReturnValue(inviteMerchantsDto);
		jest.spyOn(invitationServiceMock, 'inviteMerchants').mockReturnValue(of(true));
		const showToasterSpy = jest.spyOn(component as any, 'showToaster');

		component['sendInvitations']();

		expect(showToasterSpy).not.toHaveBeenCalledWith(false, SnackbarType.INFO);
	});

	it('should clear input and emailError when email is valid', () => {
		const chipInputMock = {
			inputElement: document.createElement('input'),
			clear: jest.fn()
		};

		chipInputMock.inputElement.value = 'valid@example.com';

		const event = { chipInput: chipInputMock } as unknown as MatChipInputEvent;

		component.handleKeyup(event, false);

		expect(component.merchantEmails.has('valid@example.com')).toBeTruthy();
		expect(chipInputMock.clear).toHaveBeenCalled();
		expect(component.emailError).toBe('');
	});
});
