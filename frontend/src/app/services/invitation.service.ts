import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { InvitationDto } from '../models/invitation-dto.model';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { InviteMerchantsDto } from '../models/invite-merchants-dto.model';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {

  readonly httpClient = inject(HttpClient);

	public getPaginatedInvitations(page: number, size: number): Observable<InvitationDto[]> {
		const httpParams = new HttpParams().set('page', page.toString()).set('size', size.toString());
		return this.httpClient.get<InvitationDto[]>(`${environment.apiPath}/invitations`, {
			params: httpParams,
			withCredentials: true
		});
	}
  
	public countAllInvitations(): Observable<number> {
		return this.httpClient.get<number>(`${environment.apiPath}/invitations/count`, {
			withCredentials: true
		});
	}

	public inviteMerchants(inviteMerchantsDto: InviteMerchantsDto): Observable<void> {
		return this.httpClient.post<void>(`${environment.apiPath}/invitations/send`, inviteMerchantsDto, {
			withCredentials: true
		});
	}

  public validateInvitationToken(token: string): Observable<string> {
    return this.httpClient.post<string>(`${environment.apiPath}/invitations/public/validate/${token}`, {}, {});
  }
}
