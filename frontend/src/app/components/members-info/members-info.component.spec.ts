import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembersInfoComponent } from './members-info.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('MembersInfoComponent', () => {
	let component: MembersInfoComponent;
	let fixture: ComponentFixture<MembersInfoComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [MembersInfoComponent],
			imports: [TranslateModule.forRoot()],
			providers: [TranslateService]
		}).compileComponents();

		fixture = TestBed.createComponent(MembersInfoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
