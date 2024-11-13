import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresentationComponent } from './presentation.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('SectionInfoComponent', () => {
	let component: PresentationComponent;
	let fixture: ComponentFixture<PresentationComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [PresentationComponent],
			imports: [TranslateModule.forRoot()],
			providers: [TranslateService]
		}).compileComponents();

		fixture = TestBed.createComponent(PresentationComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
