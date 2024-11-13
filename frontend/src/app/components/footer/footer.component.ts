import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';
import { ModalData } from '../../models/dialog-data.model';

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrl: './footer.component.scss'
})
export class FooterComponent {
	private dialog = inject(MatDialog);

	public openDialog(): void {
		const privacyPolicyInformation = new ModalData(
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

		this.dialog.open(GenericDialogComponent, CustomDialogConfigUtil.createMessageModal(privacyPolicyInformation));
	}
}
