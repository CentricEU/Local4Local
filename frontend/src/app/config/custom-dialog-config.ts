import { MatDialogConfig } from '@angular/material/dialog';
import { ModalData } from '../models/dialog-data.model';

export class CustomDialogConfigUtil {
	static GENERIC_MODAL_CONFIG: MatDialogConfig = {
		width: '560px',
		autoFocus: false,
		hasBackdrop: true,
		disableClose: true,
		restoreFocus: false
	};

	static MESSAGE_MODAL_CONFIG: MatDialogConfig = {
		width: '600px',
		disableClose: false,
		hasBackdrop: true,
		autoFocus: false,
		restoreFocus: false,
		data: {
			title: '',
			mainContent: '',
			secondaryContent: '',
			disableClosing: true,
			cancelButtonText: '',
			acceptButtonText: '',
			imageName: '',
			shouldDisplayActionButton: true,
			modalTypeClass: ''
		}
	};

	public static createMessageModal(successModal: ModalData, width = '600px'): MatDialogConfig {
		const config: MatDialogConfig = structuredClone(this.MESSAGE_MODAL_CONFIG);
		config.width = width;

		config.data.title = successModal.title;
		config.data.mainContent = successModal.mainContent;
		config.data.secondaryContent = successModal.secondaryContent;
		config.data.cancelButtonText = successModal.cancelButtonText;
		config.data.acceptButtonText = successModal.acceptButtonText;
		config.data.disableClosing = successModal.disableClosing;
		config.data.shouldDisplayActionButton = successModal.shouldDisplayActionButton;
		config.data.imageName = successModal.imageName;
		config.data.modalTypeClass = successModal.modalTypeClass;

		return config;
	}
}
