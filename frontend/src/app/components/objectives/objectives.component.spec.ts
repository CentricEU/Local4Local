import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectivesComponent } from './objectives.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('ObjectivesComponent', () => {
	let component: ObjectivesComponent;
	let fixture: ComponentFixture<ObjectivesComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ObjectivesComponent],
			imports: [TranslateModule.forRoot()],
			providers: [TranslateService]
		}).compileComponents();

		fixture = TestBed.createComponent(ObjectivesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
