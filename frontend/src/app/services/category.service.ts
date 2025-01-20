import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { environment } from "../../environments/environment";
import { CategoryDto } from "../_models/category-dto.model";

@Injectable({
	providedIn: 'root'
})
export class CategoryService {
	private categorySubject = new BehaviorSubject<CategoryDto[]>([]);
	private categoryObservable: Observable<CategoryDto[]> = this.categorySubject.asObservable();

	public get categories(): Observable<CategoryDto[]> {
		return this.categorySubject;
	}

	constructor(private httpClient: HttpClient) { }

	public getAllCategories(): Observable<CategoryDto[]> {
		if (this.categorySubject.getValue().length > 0) {
			return this.categoryObservable;
		}

		return this.httpClient.get<CategoryDto[]>(`${environment.apiPath}/public/category/all`).pipe(
			tap(data => this.categorySubject.next(data)),
		);
	}
}