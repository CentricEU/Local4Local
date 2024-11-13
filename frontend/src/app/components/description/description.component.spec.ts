import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescriptionComponent } from './description.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('DescriptionComponent', () => {
	let component: DescriptionComponent;
	let fixture: ComponentFixture<DescriptionComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [DescriptionComponent],
			imports: [TranslateModule.forRoot()],
			providers: [TranslateService]
		}).compileComponents();

		fixture = TestBed.createComponent(DescriptionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
