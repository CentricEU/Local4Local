import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CategoryService } from "../../services/category.service";
import { CategoryDto } from "../../_models/category-dto.model";
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';
import { ModalData } from '../../models/dialog-data.model';
import { ALREADY_REGISTERED_CODE, SUCCESS_CODE } from '../../_constants/error-constants';
import { MerchantsMapComponent } from '../merchants-map/merchants-map.component';
import { MerchantDialogComponent } from '../merchant-dialog/merchant-dialog.component';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
	readonly dialog = inject(MatDialog);
	readonly categoryService = inject(CategoryService);

	@ViewChild(MerchantsMapComponent) merchantsMapComponent!: MerchantsMapComponent;

	public categoriesData: CategoryDto[] = [];
	public selectedCategoryId = -1;

	public ngOnInit(): void {
		this.initCategoriesData();
	}

	public openDialog(): void {
		this.dialog.open(MerchantDialogComponent, CustomDialogConfigUtil.GENERIC_MODAL_CONFIG)
			.afterClosed()
			.subscribe((result) => {
				switch (result) {
					case ALREADY_REGISTERED_CODE:
						return this.displayAlreadyRegisteredDialog();
					case SUCCESS_CODE:
						return this.displayApprovalWaitingPopup();
				}
			});
	}

	public selectCategory(selected: CategoryDto): void {
		this.selectedCategoryId = selected.id;

		if (!this.merchantsMapComponent) {
			return;
		}

		this.merchantsMapComponent.filterMerchantsByCategory(this.selectedCategoryId);
	}

	private initCategoriesData(): void {
		this.categoryService.getAllCategories().subscribe((data) => {
			this.categoriesData.push({
				id: -1,
				label: 'category.all'
			});

			this.categoriesData.push(...data);
		});
	}

	private displayApprovalWaitingPopup(): void {
		const approvalWaitingModalData = new ModalData(
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

		this.dialog.open(GenericDialogComponent, CustomDialogConfigUtil.createMessageModal(approvalWaitingModalData));
	}

	private displayAlreadyRegisteredDialog(): void {
		const alreadyRegisteredModalData = new ModalData(
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

		this.dialog.open(GenericDialogComponent, CustomDialogConfigUtil.createMessageModal(alreadyRegisteredModalData));
	}
}

