import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';
import { ModalData } from '../../models/dialog-data.model';

describe('FooterComponent', () => {
	let component: FooterComponent;
	let fixture: ComponentFixture<FooterComponent>;
	let dialogSpy: jest.SpyInstance;

	beforeEach(async () => {
		global.structuredClone = jest.fn((val) => {
			return JSON.parse(JSON.stringify(val));
		});

		await TestBed.configureTestingModule({
			declarations: [FooterComponent, GenericDialogComponent],
			imports: [TranslateModule.forRoot(), MatDialogModule],
			providers: [TranslateService]
		}).compileComponents();

		fixture = TestBed.createComponent(FooterComponent);
		component = fixture.componentInstance;

		const dialog = TestBed.inject(MatDialog);
		dialogSpy = jest.spyOn(dialog, 'open');

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should open the dialog with the expected configuration when openDialog is called', () => {
		const expectedModalData = new ModalData(
			'presentation.footer.privacyPolicy.title',
			'',
			'presentation.footer.privacyPolicy.text',
			'',
			'',
			false,
			'',
			false,
			'info'
		);

		const expectedConfig = CustomDialogConfigUtil.createMessageModal(expectedModalData);

		component.openDialog();

		expect(dialogSpy).toHaveBeenCalledWith(GenericDialogComponent, expectedConfig);
	});
});
