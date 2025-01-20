import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RecoverPasswordDto } from '../models/recover-password-dto.model';
import { ChangePasswordDto } from '../models/change-password-dto.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private http: HttpClient) { }

    public getRecoverByToken(token: string): Observable<RecoverPasswordDto> {
        const params = new HttpParams().set('token', token)
        const url = `${environment.apiPath}/public/user/recover`;
        return this.http.get(url, { params: params })
            .pipe(map((result) => result as RecoverPasswordDto));
    }

    public recoverPassword(recoverPassword: RecoverPasswordDto): Observable<string> {
        const url = `${environment.apiPath}/public/user/recover`;
        return this.http.post<string>(url, recoverPassword, {});
    }

    public changePassword(changePassword: ChangePasswordDto): Observable<ChangePasswordDto> {
        const url = `${environment.apiPath}/public/user/recover/reset-password`;
        return this.http.put<ChangePasswordDto>(url, changePassword);
    }
}
