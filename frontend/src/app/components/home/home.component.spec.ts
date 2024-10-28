import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CategoryService } from '../../services/category.service';
import { of } from 'rxjs';
import { MatChip, MatChipSet, MatChipsModule } from '@angular/material/chips';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { HomeComponent } from './home.component';
import { ModalData } from '../../models/dialog-data.model';
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';
import { ALREADY_REGISTERED_CODE, SUCCESS_CODE } from '../../_constants/error-constants';
import { MerchantsMapComponent } from '../merchants-map/merchants-map.component';
import { MerchantDialogComponent } from '../merchant-dialog/merchant-dialog.component';

const matDialogMock = {
	open: jest.fn().mockReturnValue({
		afterClosed: jest.fn().mockReturnValue(of(true))
	})
};

const merchantsMapComponentMock = {
	filterMerchantsByCategory: jest.fn()
};

describe('HomeComponent', () => {
	let component: HomeComponent;
	let fixture: ComponentFixture<HomeComponent>;
	let categoryServiceMock: any;

	beforeEach(async () => {
		jest.clearAllMocks();

		global.structuredClone = jest.fn((val) => {
			return JSON.parse(JSON.stringify(val));
		});

		categoryServiceMock = {
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
				{ provide: CategoryService, useValue: categoryServiceMock },
				{ provide: MerchantsMapComponent, useValue: merchantsMapComponentMock },
				MatChipSet,
				MatChip,
				TranslateService
			]
		}).compileComponents();

		fixture = TestBed.createComponent(HomeComponent);
		component = fixture.componentInstance;
		component.merchantsMapComponent = merchantsMapComponentMock as unknown as MerchantsMapComponent;
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

		(component as any).displayApprovalWaitingPopup();

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

		(component as any).displayAlreadyRegisteredDialog();

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
});
