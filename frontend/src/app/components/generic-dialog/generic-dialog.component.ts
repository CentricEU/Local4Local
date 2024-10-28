import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
	selector: 'app-generic-dialog',
	templateUrl: './generic-dialog.component.html',
	styleUrl: './generic-dialog.component.scss'
})
export class GenericDialogComponent {
	public readonly data = inject(MAT_DIALOG_DATA);
	public readonly dialogRef = inject(MatDialogRef<GenericDialogComponent>);

	public close(): void {
		this.dialogRef.close(false);
	}

	public accept(): void {
		this.dialogRef.close(true);
	}
}
