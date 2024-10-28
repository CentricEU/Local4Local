import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MerchantDto } from '../models/merchant-dto.model';
import { InviteMerchantsDto } from '../models/invite-merchants-dto.model';
import { RejectMerchantDto } from '../models/reject-merchant-dto.model';
import { InvitationDto } from '../models/invitation-dto.model';

@Injectable({
	providedIn: 'root'
})
export class MerchantService {
	constructor(private httpClient: HttpClient) {}

	public getAllMerchants(): Observable<MerchantDto[]> {
		return this.httpClient.get<MerchantDto[]>(`${environment.apiPath}/merchant/all`);
	}

	public getPaginatedMerchants(page: number, size: number): Observable<MerchantDto[]> {
		const httpParams = new HttpParams().set('page', page.toString()).set('size', size.toString());
		return this.httpClient.get<MerchantDto[]>(`${environment.apiPath}/merchant/paginated`, {
			params: httpParams,
			withCredentials: true
		});
	}

	public getPaginatedInvitations(page: number, size: number): Observable<InvitationDto[]> {
		const httpParams = new HttpParams().set('page', page.toString()).set('size', size.toString());
		return this.httpClient.get<InvitationDto[]>(`${environment.apiPath}/merchant/invitations`, {
			params: httpParams,
			withCredentials: true
		});
	}

	public getMerchantsByCategory(categoryId: number): Observable<MerchantDto[]> {
		return this.httpClient.get<MerchantDto[]>(`${environment.apiPath}/merchant/filter/${categoryId}`);
	}

	public countAllMerchants(): Observable<number> {
		return this.httpClient.get<number>(`${environment.apiPath}/merchant/count/all`, { withCredentials: true });
	}

	public countAllInvitations(): Observable<number> {
		return this.httpClient.get<number>(`${environment.apiPath}/merchant/invitations/count`, {
			withCredentials: true
		});
	}

	public inviteMerchants(inviteMerchantsDto: InviteMerchantsDto): Observable<void> {
		return this.httpClient.post<void>(`${environment.apiPath}/merchant/invite`, inviteMerchantsDto, {
			withCredentials: true
		});
	}

	public registerMerchant(merchantDto: MerchantDto): Observable<MerchantDto> {
		return this.httpClient.post<MerchantDto>(`${environment.apiPath}/merchant/register`, merchantDto);
	}

	public approveMerchant(merchantId: string): Observable<void> {
		return this.httpClient.patch<void>(
			`${environment.apiPath}/merchant/approve/${merchantId}`,
			{},
			{
				withCredentials: true
			}
		);
	}

	public rejectMerchant(rejectMerchantDto: RejectMerchantDto): Observable<void> {
		return this.httpClient.post<void>(`${environment.apiPath}/merchant/reject`, rejectMerchantDto, {
			withCredentials: true
		});
	}
}
