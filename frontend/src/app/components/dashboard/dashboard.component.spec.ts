import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { MerchantService } from '../../services/merchant.service';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InviteMerchantDialogComponent } from '../invite-merchant-dialog/invite-merchant-dialog.component';

describe('DashboardComponent', () => {
	let component: DashboardComponent;
	let fixture: ComponentFixture<DashboardComponent>;
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
			countAllMerchants: jest.fn().mockReturnValue(of(12))
		};

		await TestBed.configureTestingModule({
			declarations: [DashboardComponent],
			imports: [HttpClientTestingModule, TranslateModule.forRoot()],
			providers: [
				{ provide: MerchantService, useValue: merchantService },
				{ provide: MatDialog, useValue: matDialogMock }
			],
			schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
		}).compileComponents();

		fixture = TestBed.createComponent(DashboardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
		expect(merchantService.countAllMerchants).toHaveBeenCalled();
	});

	it('should open the invite dialog when the invite is pressed', () => {
		component.openInviteMerchantsDialog();
		expect(matDialogMock.open).toHaveBeenCalledWith(InviteMerchantDialogComponent, {
			width: '560px',
			autoFocus: false,
			disableClose: false,
			hasBackdrop: true,
			restoreFocus: true
		});
	});
});
