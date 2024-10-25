import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InviteMerchantDialogComponent } from '../invite-merchant-dialog/invite-merchant-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MerchantDto } from '../../models/merchant-dto.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MerchantService } from '../../services/merchant.service';
import { ColumnConfig } from '../../models/column-config.model';
import { ColumnType } from '../../enums/column.enum';
import { forkJoin } from 'rxjs';
import { MerchantDialogComponent } from '../merchant-dialog/merchant-dialog.component';
import { SUCCESS_CODE } from '../../_constants/error-constants';
import { MerchantDialogType } from '../../enums/merchant-dialog-type.enum';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';

@Component({
	selector: 'app-merchants',
	templateUrl: './merchants.component.html',
	styleUrls: ['./merchants.component.scss']
})
export class MerchantsComponent implements OnInit {
	@ViewChild(MatPaginator) paginator: MatPaginator;

	public displayedColumns: string[] = [
		ColumnType.STATUS,
		ColumnType.COMPANY_NAME,
		ColumnType.CATEGORY,
		ColumnType.KVK,
		ColumnType.ADDRESS,
		ColumnType.WEBSITE,
		ColumnType.ACTIONS
	];

	public dataSource: MatTableDataSource<MerchantDto>;
	public data: MerchantDto[] = [];
	public noOfMerchants = 0;

	public readonly PAGE_SIZE_OPTIONS = [10, 25, 50];

	public columnConfigs: ColumnConfig<MerchantDto>[] = [
		{ columnDef: ColumnType.STATUS, header: 'table.column.status', cell: (element) => element.status || '' },
		{
			columnDef: ColumnType.COMPANY_NAME,
			header: 'table.column.companyName',
			cell: (element) => element.companyName
		},
		{ columnDef: ColumnType.CATEGORY, header: 'table.column.category', cell: (element) => element.category },
		{ columnDef: ColumnType.KVK, header: 'table.column.kvkNumber', cell: (element) => element.kvk },
		{ columnDef: ColumnType.ADDRESS, header: 'table.column.address', cell: (element) => element.address },
		{ columnDef: ColumnType.WEBSITE, header: 'table.column.website', cell: (element) => element.website || '-' },
		{ columnDef: ColumnType.ACTIONS, header: 'table.column.actions', cell: (element) => element.status || '' }
	];

	public readonly noDataTitle: string = 'merchants.noData.title';
	public readonly noDataDescription: string = 'merchants.noData.description';

	private currentPageIndex = 0;
	private currentPageSize = 10;

	private dialog = inject(MatDialog);
	private merchantsService = inject(MerchantService);

	public ngOnInit(): void {
		this.initData(this.currentPageIndex, this.currentPageSize);
	}

	public onPageChange(event: PageEvent): void {
		this.currentPageIndex = event.pageIndex;
		this.currentPageSize = event.pageSize;
		this.initData(event.pageIndex, event.pageSize);
	}

	public shouldDisplayColumn(columnDef: string): boolean {
		return columnDef !== ColumnType.ACTIONS && columnDef !== ColumnType.STATUS;
	}

	public isColumnType(columnDef: string, type: string): boolean {
		return columnDef === type;
	}

	public openInviteMerchantsDialog(): void {
		this.dialog.open(InviteMerchantDialogComponent, CustomDialogConfigUtil.GENERIC_MODAL_CONFIG);
	}

	public approveMerchant(merchant: MerchantDto): void {
		this.dialog
			.open(MerchantDialogComponent, {
				data: { dialogType: MerchantDialogType.APPROVAL, merchant: merchant },
				...CustomDialogConfigUtil.GENERIC_MODAL_CONFIG
			})
			.afterClosed()
			.subscribe((result) => {
				if (result === SUCCESS_CODE) {
					this.initData(this.currentPageIndex, this.currentPageSize);
				}
			});
	}

	public rejectMerchant(merchant: MerchantDto): void {
		this.dialog
			.open(MerchantDialogComponent, {
				data: { dialogType: MerchantDialogType.REJECTION, merchant: merchant },
				...CustomDialogConfigUtil.GENERIC_MODAL_CONFIG
			})
			.afterClosed()
			.subscribe((result) => {
				if (result === SUCCESS_CODE) {
					this.initData(this.currentPageIndex, this.currentPageSize);
				}
			});
	}

	private initData(pageIndex: number, pageSize: number): void {
		forkJoin({
			merchants: this.merchantsService.getPaginatedMerchants(pageIndex, pageSize),
			count: this.merchantsService.countAllMerchants()
		}).subscribe(({ merchants, count }) => {
			this.data = merchants;
			this.dataSource = new MatTableDataSource<MerchantDto>(merchants);
			this.noOfMerchants = count;
		});
	}
}
