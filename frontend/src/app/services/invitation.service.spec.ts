import { TestBed } from '@angular/core/testing';

import { InvitationService } from './invitation.service';
import { InviteMerchantsDto } from '../models/invite-merchants-dto.model';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('InvitationService', () => {
	let service: InvitationService;
	let httpMock: HttpTestingController;
	const environmentMock = {
		production: false,
		envName: 'dev',
		apiPath: '/api'
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [InvitationService, { provide: 'env', useValue: environmentMock }]
		});
		service = TestBed.inject(InvitationService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should send invite to merchants', () => {
		const mockInviteMerchantsDto: InviteMerchantsDto = {
			emails: ['merchant1@example.com', 'merchant2@example.com'],
			message: 'You are invited to join our platform.'
		};

		service.inviteMerchants(mockInviteMerchantsDto).subscribe(() => {
			expect(true).toBeTruthy();
		});

		const req = httpMock.expectOne(`${environmentMock.apiPath}/invitations/send`);
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toEqual(mockInviteMerchantsDto);
		req.flush(null);
	});

	it('should retrieve paginated invitations', () => {
		const pageIndex = 0;
		const pageSize = 10;
		const mockInvitations: InviteMerchantsDto[] = [
			{
				emails: ['merchant1@example.com'],
				message: 'Join our platform!'
			}
		];

		service.getPaginatedInvitations(pageIndex, pageSize).subscribe((invitations) => {
			expect(invitations).toEqual(mockInvitations);
		});

		const req = httpMock.expectOne(`${environmentMock.apiPath}/invitations?page=0&size=10`);
		expect(req.request.method).toBe('GET');
		req.flush(mockInvitations);
	});

	it('should handle error on getting paginated invitations', () => {
		const errorMessage = 'Error fetching invitations';

		service.getPaginatedInvitations(0, 10).subscribe({
			error: (error) => {
				expect(error).toBe(errorMessage);
			}
		});

		const req = httpMock.expectOne(`${environmentMock.apiPath}/invitations?page=0&size=10`);
		req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
	});

	it('should get the invitations count', () => {
		const mockInvitationsCount = 5;

		service.countAllInvitations().subscribe((count) => {
			expect(count).toEqual(mockInvitationsCount);
		});

		const req = httpMock.expectOne(`${environmentMock.apiPath}/invitations/count`);
		expect(req.request.method).toBe('GET');
		req.flush(mockInvitationsCount);
	});

	it('should handle error on counting invitations', () => {
		const errorMessage = 'Error fetching invitations count';

		service.countAllInvitations().subscribe({
			error: (error) => {
				expect(error).toBe(errorMessage);
			}
		});

		const req = httpMock.expectOne(`${environmentMock.apiPath}/invitations/count`);
		req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
	});

	it('should validate invitation token', () => {
		const token = 'valid-token';
		const mockResponse = 'Token is valid';

		service.validateInvitationToken(token).subscribe((response) => {
			expect(response).toBe(mockResponse);
		});

		const req = httpMock.expectOne(`${environmentMock.apiPath}/invitations/public/validate/${token}`);
		expect(req.request.method).toBe('POST');
		req.flush(mockResponse);
	});

	it('should handle error on validating invitation token', () => {
		const token = 'invalid-token';
		const errorMessage = 'Invalid token';

		service.validateInvitationToken(token).subscribe({
			error: (error) => {
				expect(error).toBe(errorMessage);
			}
		});

		const req = httpMock.expectOne(`${environmentMock.apiPath}/invitations/public/validate/${token}`);
		req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
	});
});
