import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppLoaderService } from '../services/app-loader.service';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AppHttpInterceptor<T> implements HttpInterceptor {
	private totalRequests = 0;

	constructor(private readonly appLoaderService: AppLoaderService) { }

	intercept(req: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
		this.totalRequests++;
		this.appLoaderService.loaderShow(true);

		return next.handle(req).pipe(
			tap({
				next: (event: HttpEvent<T>) => this.handleResponse(event),
				error: () => this.decreaseRequests()
			}),
			// finalize(() => this.decreaseRequests())
		);
	}

	private decreaseRequests(): void {
		this.totalRequests--;
		if (this.totalRequests <= 0) {
			this.appLoaderService.loaderShow(false);
			this.totalRequests = 0;
		}
	}

	private handleResponse(event: HttpEvent<T>): void {
		if (event instanceof HttpResponse) {
			this.decreaseRequests();
		}
	}
}
