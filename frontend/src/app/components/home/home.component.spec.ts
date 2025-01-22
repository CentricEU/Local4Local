/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CategoryService } from '../../services/category.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MatChip, MatChipSet, MatChipsModule } from '@angular/material/chips';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { HomeComponent } from './home.component';
import { ModalData } from '../../models/dialog-data.model';
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';
import { ALREADY_REGISTERED_CODE, SUCCESS_CODE } from '../../_constants/error-constants';
import { MerchantsMapComponent } from '../merchants-map/merchants-map.component';
import { MerchantDialogComponent } from '../merchant-dialog/merchant-dialog.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { InvitationService } from '../../services/invitation.service';
import { ActivatedRoute } from '@angular/router';

const matDialogMock = {
	open: jest.fn().mockReturnValue({
		afterClosed: jest.fn().mockReturnValue(of(true))
	})
};

const merchantsMapComponentMock = {
	filterMerchantsByCategory: jest.fn()
};

const routeParamsSubject = new BehaviorSubject<{ token?: string }>({});
const activatedRouteMock = {
	params: routeParamsSubject.asObservable()
};

describe('HomeComponent', () => {
	let component: HomeComponent;
	let fixture: ComponentFixture<HomeComponent>;
	let categoryServiceMock: jest.Mocked<CategoryService>;
	let invitationServiceMock: jest.Mocked<InvitationService>;

	beforeEach(async () => {
		jest.clearAllMocks();

		global.structuredClone = jest.fn((val) => {
			return JSON.parse(JSON.stringify(val));
		});

		const invitationServiceStub = {
			validateInvitationToken: jest.fn().mockReturnValue(of('success-response')) // Ensure it returns an Observable<string>
		}

		const categoryServiceStub = {
			getAllCategories: jest.fn().mockReturnValue(
				of([
					{
						id: 0,
						label: 'category1'
					},
					{
						id: 1,
						label: 'category2'
					}
				])
			)
		};

		await TestBed.configureTestingModule({
			declarations: [HomeComponent],
			imports: [TranslateModule.forRoot(), MatChipsModule],
			schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
			providers: [
				{ provide: MatDialog, useValue: matDialogMock },
				{ provide: CategoryService, useValue: categoryServiceStub },
				{ provide: MerchantsMapComponent, useValue: merchantsMapComponentMock },
				{ provide: InvitationService, useValue: invitationServiceStub },
				{ provide: ActivatedRoute, useValue: activatedRouteMock },
				MatChipSet,
				MatChip,
				TranslateService
			]
		}).compileComponents();

		fixture = TestBed.createComponent(HomeComponent);
		component = fixture.componentInstance;
		component.merchantsMapComponent = merchantsMapComponentMock as unknown as MerchantsMapComponent;
		invitationServiceMock = TestBed.inject(InvitationService) as jest.Mocked<InvitationService>;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should open the dialog with correct configuration when openDialog is called', () => {
		component.openDialog();
		expect(matDialogMock.open).toHaveBeenCalledWith(MerchantDialogComponent, {
			width: '560px',
			autoFocus: false,
			disableClose: true,
			hasBackdrop: true,
			restoreFocus: false
		});
	});

	it('should select the given category', () => {
		component.selectCategory({
			id: 1,
			label: 'category2'
		});

		expect(component.selectedCategoryId).toEqual(1);
	});

	it('should call displayAlreadyRegisteredDialog when dialog is closed with ALREADY_REGISTERED_CODE', () => {
		const dialogRef = { afterClosed: jest.fn().mockReturnValue(of(ALREADY_REGISTERED_CODE)) };
		matDialogMock.open.mockReturnValue(dialogRef);
		jest.spyOn(component as any, 'displayAlreadyRegisteredDialog').mockImplementation();

		component.openDialog();

		expect((component as any).displayAlreadyRegisteredDialog).toHaveBeenCalled();
	});

	it('should call displayApprovalWaitingPopup when dialog is closed with SUCCESS_CODE', () => {
		const dialogRef = { afterClosed: jest.fn().mockReturnValue(of(SUCCESS_CODE)) };
		matDialogMock.open.mockReturnValue(dialogRef);
		jest.spyOn(component as any, 'displayApprovalWaitingPopup').mockImplementation();

		component.openDialog();

		expect((component as any).displayApprovalWaitingPopup).toHaveBeenCalled();
	});

	it('should open GenericDialogComponent with correct config when displayApprovalWaitingPopup is called', () => {
		const dialogRef = { afterClosed: jest.fn() };
		matDialogMock.open.mockReturnValue(dialogRef);
		const expectedModalData = new ModalData(
			'approvalDialog.title',
			'',
			'approvalDialog.text',
			'general.button.cancel',
			'general.button.understand',
			false,
			'wait-clock.svg',
			true,
			''
		);

		component["displayApprovalWaitingPopup"]();

		expect(matDialogMock.open).toHaveBeenCalledWith(GenericDialogComponent, {
			...CustomDialogConfigUtil.createMessageModal(expectedModalData),
			width: '600px'
		});
	});

	it('should open GenericDialogComponent with correct config when displayAlreadyRegisteredDialog is called', () => {
		const dialogRef = { afterClosed: jest.fn() };
		matDialogMock.open.mockReturnValue(dialogRef);
		const expectedModalData = new ModalData(
			'alreadyRegisteredDialog.title',
			'',
			'alreadyRegisteredDialog.text',
			'general.button.cancel',
			'general.button.understand',
			false,
			'wait-clock.svg',
			true,
			''
		);

		component["displayAlreadyRegisteredDialog"]();

		expect(matDialogMock.open).toHaveBeenCalledWith(GenericDialogComponent, {
			...CustomDialogConfigUtil.createMessageModal(expectedModalData),
			width: '600px'
		});
	});

	it('should call filterMerchantsByCategory on MerchantsMapComponent when a category is selected', () => {
		component.merchantsMapComponent = merchantsMapComponentMock as unknown as MerchantsMapComponent;
		const selectedCategory = { id: 1, label: 'category2' };
		component.selectCategory(selectedCategory);

		expect(merchantsMapComponentMock.filterMerchantsByCategory).toHaveBeenCalledWith(selectedCategory.id);
	});

	it('should call selectCategory with the correct category on tab change', () => {
		const mockEvent: MatTabChangeEvent = { index: 1, tab: {} as any };
		const expectedCategory = {
			id: 0,
			label: 'category1'
		};
		jest.spyOn(component, 'selectCategory');

		component.onTabChange(mockEvent);

		expect(component.selectCategory).toHaveBeenCalledWith(expectedCategory);
	});


	it('should call validateInvitationToken when token is present in route params', () => {
		jest.spyOn(component as any, 'validateInvitationToken').mockImplementation();

		routeParamsSubject.next({ token: 'test-token' });

		expect((component as any).validateInvitationToken).toHaveBeenCalledWith('test-token');
	});

	it('should NOT call validateInvitationToken when no token is present in route params', () => {
		jest.spyOn(component as any, 'validateInvitationToken').mockImplementation();

		routeParamsSubject.next({});

		expect(component["validateInvitationToken"]).not.toHaveBeenCalled();
	});

	it('should replace state with empty string in clearPath', () => {
		jest.spyOn(component.location, 'replaceState');

		component['clearPath']();

		expect(component.location.replaceState).toHaveBeenCalledWith('');
	});

	it('should open MerchantDialogComponent when validateInvitationToken succeeds', () => {
		const token = 'c1c75569-718f-45b5-b347-a41f653f9798';
	
		const validateInvitationTokenSpy = jest.spyOn(invitationServiceMock, 'validateInvitationToken').mockReturnValue(of(token));
		const dialogOpenSpy = jest.spyOn(matDialogMock, 'open');
	
		component['validateInvitationToken'](token);
	
		expect(validateInvitationTokenSpy).toHaveBeenCalledTimes(1);
		expect(validateInvitationTokenSpy).toHaveBeenCalledWith(token);
		expect(dialogOpenSpy).toHaveBeenCalledWith(MerchantDialogComponent, {
			...CustomDialogConfigUtil.GENERIC_MODAL_CONFIG,
			data: { token }
		});
	});
	
	
	
	it('should call clearPath when validateInvitationToken fails', () => {
		const token = 'c1c75569-718f-45b5-b347-a41f653f9798';
	
		const validateInvitationTokenSpy = jest.spyOn(invitationServiceMock, 'validateInvitationToken').mockReturnValue(throwError(() => new Error('Invalid token')));
		const clearPathSpy = jest.spyOn(component as any, 'clearPath');
	
		component['validateInvitationToken'](token);
	
		expect(validateInvitationTokenSpy).toHaveBeenCalledWith(token);
		expect(clearPathSpy).toHaveBeenCalled();
	});
	
});
