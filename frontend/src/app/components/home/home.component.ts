import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { CategoryDto } from '../../_models/category-dto.model';
import { GenericDialogComponent } from '../generic-dialog/generic-dialog.component';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';
import { ModalData } from '../../models/dialog-data.model';
import { ALREADY_REGISTERED_CODE, SUCCESS_CODE } from '../../_constants/error-constants';
import { MerchantsMapComponent } from '../merchants-map/merchants-map.component';
import { MerchantDialogComponent } from '../merchant-dialog/merchant-dialog.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationService } from '../../services/invitation.service';
import { Location } from '@angular/common';
import { RegexUtil } from '../../util/regex.util';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
	readonly dialog = inject(MatDialog);
	readonly categoryService = inject(CategoryService);
	readonly route = inject(ActivatedRoute);
	readonly invitationService = inject(InvitationService);
	readonly router = inject(Router);
	readonly location = inject(Location);

	@ViewChild(MerchantsMapComponent) merchantsMapComponent!: MerchantsMapComponent;

	public categoriesData: CategoryDto[] = [];
	public selectedCategoryId = -1;

	public showEmptyState = false;

	public ngOnInit(): void {
		this.initCategoriesData();
		this.checkForToken();
	}

	public openDialog(): void {
		this.openMerchantDialog();
	}

	private openDialogWithToken(token: string): void {
		this.openMerchantDialog({ token });
	}

	public onShowEmptyStateChange(value: boolean): void {
		this.showEmptyState = value;
	}

	public onTabChange(event: MatTabChangeEvent): void {
		const selectedCategory = this.categoriesData[event.index];
		this.selectCategory(selectedCategory);
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

	private checkForToken(): void {
		this.route.params.subscribe((params) => {
			const token = params['token'];

			if (token) {
				this.validateInvitationToken(token);
				return;
			}
		});
	}

	private validateInvitationToken(token: string): void {
		if (!RegexUtil.uuidRegexPattern.test(token)) {
			this.clearPath();
			return;
		}

		this.invitationService.validateInvitationToken(token).subscribe(
			() => {
				this.openDialogWithToken(token);
			},
			() => {
				this.clearPath();
			}
		);
	}

	private clearPath(): void {
		this.location.replaceState('');
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

	private openMerchantDialog(data?: { token?: string }): void {
		this.dialog
			.open(MerchantDialogComponent, {
				...CustomDialogConfigUtil.GENERIC_MODAL_CONFIG,
				data
			})
			.afterClosed()
			.subscribe((result: string) => {
				switch (result) {
					case ALREADY_REGISTERED_CODE:
						this.displayAlreadyRegisteredDialog();
						break;
					case SUCCESS_CODE:
						this.displayApprovalWaitingPopup();
						break;
				}
			});
	}
}
