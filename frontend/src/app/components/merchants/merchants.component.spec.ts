import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MerchantsComponent } from './merchants.component';
import { InviteMerchantDialogComponent } from '../invite-merchant-dialog/invite-merchant-dialog.component';
import { of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MerchantService } from '../../services/merchant.service';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MerchantDto } from '../../models/merchant-dto.model';
import { ColumnType } from '../../enums/column.enum';
import { PageEvent } from '@angular/material/paginator';
import { MerchantDialogComponent } from '../merchant-dialog/merchant-dialog.component';
import { SUCCESS_CODE } from '../../_constants/error-constants';
import { MerchantDialogType } from '../../enums/merchant-dialog-type.enum';

describe('MerchantsComponent', () => {
	let component: MerchantsComponent;
	let fixture: ComponentFixture<MerchantsComponent>;
	let merchantService: any;

	const matDialogMock = {
		open: jest.fn().mockReturnValue({
			afterClosed: jest.fn().mockReturnValue(of(true))
		})
	};

	const mockMerchant: MerchantDto = {
		companyName: 'Test Company',
		identifierNumber: '12345678',
		category: 'Retail',
		latitude: 52.3702,
		longitude: 4.8952,
		address: '123 Test Street, Test City',
		contactEmail: 'test@example.com',
		website: 'https://www.testcompany.com',
		status: 'Active'
	};

	beforeEach(async () => {
		global.structuredClone = jest.fn((val) => {
			return JSON.parse(JSON.stringify(val));
		});

		merchantService = {
			getPaginatedMerchants: jest.fn().mockReturnValue(of([mockMerchant])),
			countAllMerchants: jest.fn().mockReturnValue(of(12))
		};

		await TestBed.configureTestingModule({
			schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
			declarations: [MerchantsComponent, InviteMerchantDialogComponent],
			imports: [TranslateModule.forRoot()],
			providers: [
				TranslateService,
				{ provide: MerchantService, useValue: merchantService },
				{ provide: MatDialog, useValue: matDialogMock }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(MerchantsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should correctly configure column configs', () => {
		const columns = component.columnConfigs;

		expect(columns).toEqual([
			{ columnDef: ColumnType.STATUS, header: 'table.column.status', cell: expect.any(Function) },
			{ columnDef: ColumnType.COMPANY_NAME, header: 'table.column.companyName', cell: expect.any(Function) },
			{ columnDef: ColumnType.CATEGORY, header: 'table.column.category', cell: expect.any(Function) },
			{ columnDef: ColumnType.IDENTIFIER_NUMBER, header: 'table.column.identifierNumber', cell: expect.any(Function) },
			{ columnDef: ColumnType.ADDRESS, header: 'table.column.address', cell: expect.any(Function) },
			{ columnDef: ColumnType.WEBSITE, header: 'table.column.website', cell: expect.any(Function) },
			{ columnDef: ColumnType.ACTIONS, header: 'table.column.actions', cell: expect.any(Function) }
		]);
	});

	it('should display the correct cell values for each column', () => {
		const columns = component.columnConfigs;

		const statusCell = columns.find((col) => col.columnDef === ColumnType.STATUS)?.cell(mockMerchant);
		expect(statusCell).toBe('Active');

		const companyNameCell = columns.find((col) => col.columnDef === ColumnType.COMPANY_NAME)?.cell(mockMerchant);
		expect(companyNameCell).toBe('Test Company');

		const categoryCell = columns.find((col) => col.columnDef === ColumnType.CATEGORY)?.cell(mockMerchant);
		expect(categoryCell).toBe('Retail');

		const identifierNumberCell = columns.find((col) => col.columnDef === ColumnType.IDENTIFIER_NUMBER)?.cell(mockMerchant);
		expect(identifierNumberCell).toBe('12345678');

		const addressCell = columns.find((col) => col.columnDef === ColumnType.ADDRESS)?.cell(mockMerchant);
		expect(addressCell).toBe('123 Test Street, Test City');

		const websiteCell = columns.find((col) => col.columnDef === ColumnType.WEBSITE)?.cell(mockMerchant);
		expect(websiteCell).toBe('https://www.testcompany.com');

		const actionsCell = columns.find((col) => col.columnDef === ColumnType.ACTIONS)?.cell(mockMerchant);
		expect(actionsCell).toBe('Active');
	});

	it('should fallback to empty strings or dashes for missing values', () => {
		const incompleteMerchant: MerchantDto = {
			companyName: '',
			identifierNumber: '',
			category: '',
			latitude: 0,
			longitude: 0,
			address: '',
			contactEmail: '',
			website: '',
			status: ''
		};

		const columns = component.columnConfigs;

		const statusCell = columns.find((col) => col.columnDef === ColumnType.STATUS)?.cell(incompleteMerchant);
		expect(statusCell).toBe('');

		const companyNameCell = columns
			.find((col) => col.columnDef === ColumnType.COMPANY_NAME)
			?.cell(incompleteMerchant);
		expect(companyNameCell).toBe('');

		const categoryCell = columns.find((col) => col.columnDef === ColumnType.CATEGORY)?.cell(incompleteMerchant);
		expect(categoryCell).toBe('');

		const identifierNumberCell = columns.find((col) => col.columnDef === ColumnType.IDENTIFIER_NUMBER)?.cell(incompleteMerchant);
		expect(identifierNumberCell).toBe('');

		const addressCell = columns.find((col) => col.columnDef === ColumnType.ADDRESS)?.cell(incompleteMerchant);
		expect(addressCell).toBe('');

		const websiteCell = columns.find((col) => col.columnDef === ColumnType.WEBSITE)?.cell(incompleteMerchant);
		expect(websiteCell).toBe('-');

		const actionsCell = columns.find((col) => col.columnDef === ColumnType.ACTIONS)?.cell(incompleteMerchant);
		expect(actionsCell).toBe('');
	});

	it('should call initData with correct parameters on page change', () => {
		const initDataSpy = jest.spyOn(component as any, 'initData');
		const event: PageEvent = { pageIndex: 1, pageSize: 25, length: 100 };

		component.onPageChange(event);

		expect(initDataSpy).toHaveBeenCalledWith(event.pageIndex, event.pageSize);
	});

	it('should return false for shouldDisplayColumn on ACTIONS and STATUS', () => {
		expect(component.shouldDisplayColumn(ColumnType.ACTIONS)).toBe(false);
		expect(component.shouldDisplayColumn(ColumnType.STATUS)).toBe(false);
	});

	it('should return true for shouldDisplayColumn on other columns', () => {
		expect(component.shouldDisplayColumn(ColumnType.COMPANY_NAME)).toBe(true);
		expect(component.shouldDisplayColumn(ColumnType.CATEGORY)).toBe(true);
	});

	it('should return true for isCategoryColumn when column is CATEGORY', () => {
		expect(component.isColumnType(ColumnType.CATEGORY, 'category')).toBe(true);
		expect(component.isColumnType(ColumnType.COMPANY_NAME, 'none')).toBe(false);
	});

	it('should return true for isActionColumn when column is ACTIONS', () => {
		expect(component.isColumnType(ColumnType.ACTIONS, 'actions')).toBe(true);
		expect(component.isColumnType(ColumnType.STATUS, 'none')).toBe(false);
	});

	it('should return true for isStatusColumn when column is STATUS', () => {
		expect(component.isColumnType(ColumnType.STATUS, 'status')).toBe(true);
		expect(component.isColumnType(ColumnType.COMPANY_NAME, 'none')).toBe(false);
	});

	it('should open invite merchant dialog', () => {
		component.openInviteMerchantsDialog();
		expect(matDialogMock.open).toHaveBeenCalledWith(InviteMerchantDialogComponent, {
			width: '560px',
			autoFocus: false,
			disableClose: false,
			hasBackdrop: true,
			restoreFocus: true
		});
	});

	it('should open MerchantDialogComponent with correct data when approveMerchant is called', () => {
		const mockMerchant: MerchantDto = {
			companyName: 'Test Company',
			identifierNumber: '12345678',
			category: 'Retail',
			latitude: 52.3702,
			longitude: 4.8952,
			address: '123 Test Street, Test City',
			contactEmail: 'test@example.com',
			website: 'https://www.testcompany.com',
			status: 'Active'
		};

		component.approveMerchant(mockMerchant);

		expect(matDialogMock.open).toHaveBeenCalledWith(MerchantDialogComponent, {
			data: { dialogType: MerchantDialogType.APPROVAL, merchant: mockMerchant },
			width: '560px',
			autoFocus: false,
			disableClose: false,
			hasBackdrop: true,
			restoreFocus: true
		});
	});

	it('should call initData when the dialog result is SUCCESS_CODE', () => {
		const initDataSpy = jest.spyOn(component as any, 'initData');
		const mockMerchant: MerchantDto = {
			companyName: 'Test Company',
			identifierNumber: '12345678',
			category: 'Retail',
			latitude: 52.3702,
			longitude: 4.8952,
			address: '123 Test Street, Test City',
			contactEmail: 'test@example.com',
			website: 'https://www.testcompany.com',
			status: 'Active'
		};

		matDialogMock.open = jest.fn().mockReturnValue({
			afterClosed: jest.fn().mockReturnValue(of(SUCCESS_CODE))
		});

		component.approveMerchant(mockMerchant);

		expect(initDataSpy).toHaveBeenCalledWith(component['currentPageIndex'], component['currentPageSize']);
	});

	it('should open MerchantDialogComponent with correct data when rejectMerchant is called', () => {
		const mockMerchant: MerchantDto = {
			companyName: 'Test Company',
			identifierNumber: '12345678',
			category: 'Retail',
			latitude: 52.3702,
			longitude: 4.8952,
			address: '123 Test Street, Test City',
			contactEmail: 'test@example.com',
			website: 'https://www.testcompany.com',
			status: 'Active'
		};

		component.rejectMerchant(mockMerchant);

		expect(matDialogMock.open).toHaveBeenCalledWith(MerchantDialogComponent, {
			data: { dialogType: MerchantDialogType.REJECTION, merchant: mockMerchant },
			width: '560px',
			autoFocus: false,
			disableClose: false,
			hasBackdrop: true,
			restoreFocus: true
		});
	});

	it('should call initData when the dialog result is SUCCESS_CODE after rejectMerchant is called', () => {
		const initDataSpy = jest.spyOn(component as any, 'initData');
		const mockMerchant: MerchantDto = {
			companyName: 'Test Company',
			identifierNumber: '12345678',
			category: 'Retail',
			latitude: 52.3702,
			longitude: 4.8952,
			address: '123 Test Street, Test City',
			contactEmail: 'test@example.com',
			website: 'https://www.testcompany.com',
			status: 'Active'
		};

		matDialogMock.open = jest.fn().mockReturnValue({
			afterClosed: jest.fn().mockReturnValue(of(SUCCESS_CODE))
		});

		component.rejectMerchant(mockMerchant);

		expect(initDataSpy).toHaveBeenCalledWith(component['currentPageIndex'], component['currentPageSize']);
	});
});
