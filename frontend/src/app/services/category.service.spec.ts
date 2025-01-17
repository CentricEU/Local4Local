import { CategoryService } from "./category.service";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { CategoryDto } from "../_models/category-dto.model";
import { environment } from "../../environments/environment";

describe('CategoryService', () => {
	let categoryService: CategoryService;
	let httpMock: HttpTestingController;

	const mockCategories: CategoryDto[] = [
		{ id: 0, label: 'category1' },
		{ id: 1, label: 'category2' },
	];

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [CategoryService],
		});

		categoryService = TestBed.inject(CategoryService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should be created', () => {
		expect(categoryService).toBeTruthy();
	});

	it('should GET all categories from API', () => {
		categoryService.getAllCategories().subscribe(categories => {
			expect(categories.length).toBe(2);
			expect(categories).toEqual(mockCategories);
		});

		const req = httpMock.expectOne(`${environment.apiPath}/public/category/all`);
		expect(req.request.method).toBe('GET');
		req.flush(mockCategories);
	});

	it('should use cached data when available', () => {
		categoryService.getAllCategories().subscribe(categories => {
			expect(categories).toEqual(mockCategories);
		});

		const req = httpMock.expectOne(`${environment.apiPath}/public/category/all`);
		expect(req.request.method).toBe('GET');
		req.flush(mockCategories);

		categoryService.getAllCategories().subscribe(categories => {
			expect(categories).toEqual(mockCategories);
		});

		httpMock.expectNone(`${environment.apiPath}/public/category/all`);
	});
});
