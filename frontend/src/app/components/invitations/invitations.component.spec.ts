import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvitationsComponent } from './invitations.component';
import { InviteMerchantDialogComponent } from '../invite-merchant-dialog/invite-merchant-dialog.component';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MerchantService } from '../../services/merchant.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { ColumnType } from '../../enums/column.enum';
import { InvitationDto } from '../../models/invitation-dto.model';

describe('InvitationsComponent', () => {
	let component: InvitationsComponent;
	let fixture: ComponentFixture<InvitationsComponent>;
	let merchantService: any;

	const matDialogMock = {
		open: jest.fn().mockReturnValue({
			afterClosed: jest.fn().mockReturnValue(of(true))
		})
	};

	beforeEach(async () => {
		global.structuredClone = jest.fn((val) => {
			return JSON.parse(JSON.stringify(val));
		});

		merchantService = {
			getPaginatedInvitations: jest.fn().mockReturnValue(of()),
			countAllInvitations: jest.fn().mockReturnValue(of(12))
		};

		await TestBed.configureTestingModule({
			declarations: [InvitationsComponent, InviteMerchantDialogComponent],
			schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
			imports: [TranslateModule.forRoot()],
			providers: [
				TranslateService,
				{ provide: MerchantService, useValue: merchantService },
				{ provide: MatDialog, useValue: matDialogMock }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(InvitationsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should call initData with correct parameters on page change', () => {
		const initDataSpy = jest.spyOn(component as any, 'initData');
		const event: PageEvent = { pageIndex: 1, pageSize: 25, length: 100 };

		component.onPageChange(event);

		expect(initDataSpy).toHaveBeenCalledWith(event.pageIndex, event.pageSize);
	});

	it('should open invite merchant dialog', () => {
		component.openInviteMerchantsDialog();
		expect(matDialogMock.open).toHaveBeenCalledWith(InviteMerchantDialogComponent, {
			width: '560px',
			autoFocus: false,
			disableClose: true,
			hasBackdrop: true,
			restoreFocus: false
		});
	});

	it('should define columnConfigs correctly', () => {
		expect(component.columnConfigs.length).toBe(2);

		expect(component.columnConfigs[0].columnDef).toBe(ColumnType.EMAIL);
		expect(component.columnConfigs[0].header).toBe('table.column.email');
		expect(component.columnConfigs[0].cell).toBeDefined();

		expect(component.columnConfigs[1].columnDef).toBe(ColumnType.SENDING_DATE);
		expect(component.columnConfigs[1].header).toBe('table.column.sendingDate');
		expect(component.columnConfigs[1].cell).toBeDefined();
	});

	it('should format date correctly in cell function', () => {
		const mockInvitation: InvitationDto = {
			email: 'test@example.com',
			createdDate: '2024-10-24T10:00:00Z'
		};

		const formattedDate = component.columnConfigs[1].cell(mockInvitation);
		expect(formattedDate).toBe('24/10/2024');
	});

	it('should retrieve email correctly in cell function', () => {
		const mockInvitation: InvitationDto = {
			email: 'test@example.com',
			createdDate: '2024-10-24T10:00:00Z'
		};

		const email = component.columnConfigs[0].cell(mockInvitation);
		expect(email).toBe('test@example.com');
	});

	it('should initialize data correctly', () => {
		const mockInvitations: InvitationDto[] = [
			{ email: 'test1@example.com', createdDate: '2024-10-24T10:00:00Z' },
			{ email: 'test2@example.com', createdDate: '2024-10-25T10:00:00Z' }
		];

		merchantService.getPaginatedInvitations.mockReturnValue(of(mockInvitations));
		merchantService.countAllInvitations.mockReturnValue(of(2));

		component['initData'](0, 10);

		expect(merchantService.getPaginatedInvitations).toHaveBeenCalledWith(0, 10);
		expect(merchantService.countAllInvitations).toHaveBeenCalled();
		expect(component.data).toEqual(mockInvitations);
		expect(component.noOfInvitations).toBe(2);
		expect(component.dataSource.data).toEqual(mockInvitations);
	});

	it('should format date correctly', () => {
		const dateString = '2024-10-24T10:00:00Z';
		const formattedDate = component['formatDate'](dateString);
		expect(formattedDate).toBe('24/10/2024');
	});

	it('should handle invalid date gracefully in formatDate', () => {
		const invalidDateString = 'invalid-date';
		const formattedDate = component['formatDate'](invalidDateString);
		expect(formattedDate).toBe('Invalid Date');
	});

	it('should not call initData when dialog result is null', () => {
        matDialogMock.open.mockReturnValue({
            afterClosed: jest.fn().mockReturnValue(of(null)) 
        });

        const initDataSpy = jest.spyOn(component as any, 'initData');
        component.openInviteMerchantsDialog();

        expect(initDataSpy).not.toHaveBeenCalled(); 
    });
});
