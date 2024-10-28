import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InviteMerchantDialogComponent } from '../invite-merchant-dialog/invite-merchant-dialog.component';
import { CustomDialogConfigUtil } from '../../config/custom-dialog-config';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { forkJoin } from 'rxjs';
import { MerchantService } from '../../services/merchant.service';
import { MatTableDataSource } from '@angular/material/table';
import { InvitationDto } from '../../models/invitation-dto.model';
import { ColumnType } from '../../enums/column.enum';
import { ColumnConfig } from '../../models/column-config.model';

@Component({
	selector: 'app-invitations',
	templateUrl: './invitations.component.html',
	styleUrl: './invitations.component.scss'
})
export class InvitationsComponent implements OnInit {
	@ViewChild(MatPaginator) paginator: MatPaginator;

	public readonly noDataTitle: string = 'inviteMerchants.noData.title';
	public readonly noDataDescription: string = 'inviteMerchants.noData.description';

	public displayedColumns: string[] = [ColumnType.EMAIL, ColumnType.SENDING_DATE];

	public dataSource: MatTableDataSource<InvitationDto>;
	public data: InvitationDto[] = [];
	public noOfInvitations = 0;

	public readonly PAGE_SIZE_OPTIONS = [10, 25, 50];

	public columnConfigs: ColumnConfig<InvitationDto>[] = [
		{ columnDef: ColumnType.EMAIL, header: 'table.column.email', cell: (element) => element.email },
		{
			columnDef: ColumnType.SENDING_DATE,
			header: 'table.column.sendingDate',
			cell: (element) => this.formatDate(element.createdDate)
		}
	];

	private currentPageIndex = 0;
	private currentPageSize = 10;

	private readonly dialog = inject(MatDialog);
	private readonly merchantsService = inject(MerchantService);

	public ngOnInit(): void {
		this.initData(this.currentPageIndex, this.currentPageSize);
	}

	public openInviteMerchantsDialog(): void {
		this.dialog
			.open(InviteMerchantDialogComponent, CustomDialogConfigUtil.GENERIC_MODAL_CONFIG)
			.afterClosed()
			.subscribe((result) => {
				if (!result) {
					return;
				}

				this.initData(0, this.currentPageSize);
			});
	}

	public onPageChange(event: PageEvent): void {
		this.currentPageIndex = event.pageIndex;
		this.currentPageSize = event.pageSize;
		this.initData(event.pageIndex, event.pageSize);
	}

	private initData(pageIndex: number, pageSize: number): void {
		forkJoin({
			invitations: this.merchantsService.getPaginatedInvitations(pageIndex, pageSize),
			count: this.merchantsService.countAllInvitations()
		}).subscribe(({ invitations, count }) => {
			this.data = invitations;
			this.dataSource = new MatTableDataSource<InvitationDto>(invitations);
			this.noOfInvitations = count;
		});
	}

	private formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB');
	}
}
