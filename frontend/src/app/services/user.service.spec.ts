import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';
import { RecoverPasswordDto } from '../models/recover-password-dto.model';
import { ChangePasswordDto } from '../models/change-password-dto.model';

describe('UserService', () => {
    let service: UserService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [UserService]
        });

        service = TestBed.inject(UserService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call getRecoverByToken and return RecoverPasswordDto', () => {
        const token = 'test-token';
        const mockRecoverPasswordDto: RecoverPasswordDto = { email: 'test@example.com', reCaptchaResponse: 'response' };

        service.getRecoverByToken(token).subscribe((response) => {
            expect(response).toEqual(mockRecoverPasswordDto);
        });

        const req = httpMock.expectOne(`${environment.apiPath}/public/user/recover?token=test-token`);
        expect(req.request.method).toBe('GET');
        req.flush(mockRecoverPasswordDto);
    });

    it('should call recoverPassword and return a success message', () => {
        const mockRecoverPasswordDto: RecoverPasswordDto = { email: 'test@example.com', reCaptchaResponse: 'response' };
        const mockResponse = 'Recovery initiated';

        service.recoverPassword(mockRecoverPasswordDto).subscribe((response) => {
            expect(response).toBe(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.apiPath}/public/user/recover`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockRecoverPasswordDto);
        req.flush(mockResponse);
    });

    it('should call changePassword and return ChangePasswordDto', () => {
        const mockChangePasswordDto: ChangePasswordDto = { password: 'newPassword', token: 'test-token' };

        service.changePassword(mockChangePasswordDto).subscribe((response) => {
            expect(response).toEqual(mockChangePasswordDto);
        });

        const req = httpMock.expectOne(`${environment.apiPath}/public/user/recover/reset-password`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(mockChangePasswordDto);
        req.flush(mockChangePasswordDto);
    });
});
