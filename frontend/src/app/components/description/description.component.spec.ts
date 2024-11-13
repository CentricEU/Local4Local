import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DescriptionComponent } from './description.component';
import { TranslateService, TranslateModule, LangChangeEvent } from '@ngx-translate/core';
import { EventEmitter } from '@angular/core';

describe('DescriptionComponent', () => {
	let component: DescriptionComponent;
	let fixture: ComponentFixture<DescriptionComponent>;
	let translateService: TranslateService;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [DescriptionComponent],
			imports: [TranslateModule.forRoot()],
			providers: [TranslateService]
		}).compileComponents();

		fixture = TestBed.createComponent(DescriptionComponent);
		component = fixture.componentInstance;
		translateService = TestBed.inject(TranslateService);

		jest.spyOn(translateService, 'currentLang', 'get').mockReturnValue('en');

		const langChangeEmitter = new EventEmitter<LangChangeEvent>();
		jest.spyOn(translateService, 'onLangChange', 'get').mockReturnValue(langChangeEmitter);

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should set imagePath based on initial language', () => {
		component.ngOnInit();
		expect(component.imagePath).toBe('../../../../assets/images/description-en.svg');
	});

	it('should update imagePath when language changes', () => {
		const langChangeEvent: LangChangeEvent = {
			lang: 'nl',
			translations: {}
		};

		translateService.onLangChange.emit(langChangeEvent);
		component.ngOnInit();

		expect(component.imagePath).toBe('../../../../assets/images/description-en.svg');
	});
});
