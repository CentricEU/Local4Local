import { TestBed } from '@angular/core/testing';

import { MultilanguageService } from './multilanguage.service';
import { TranslateService } from '@ngx-translate/core';
import { Languages } from '../enums/language.enum';
import { DateAdapter } from '@angular/material/core';

describe('MultilanguageService', () => {
	let service: MultilanguageService;
	let translateService: TranslateService;
	beforeEach(() => {
		const translateServiceStub = () => ({
			addLangs: () => ({}),
			setDefaultLang: () => ({}),
			use: () => ({
				subscribe: (f: () => void) => f()
			})
		});

		TestBed.configureTestingModule({
			providers: [
				MultilanguageService,
				{ provide: TranslateService, useFactory: translateServiceStub },
				DateAdapter
			]
		});
		service = TestBed.inject(MultilanguageService);
		translateService = TestBed.inject(TranslateService);

		jest.spyOn(translateService, 'addLangs');
		jest.spyOn(translateService, 'setDefaultLang');
	});

	it('can load instance', () => {
		expect(service).toBeTruthy();
	});

	it('defLang has default value', () => {
		expect(service.defLang).toEqual('nl-NL');
	});

	it('should set up the default language and use the stored language if available', () => {
		const storedLanguage = Languages.en;
		localStorage.setItem('Br_Lang', storedLanguage);
		service.setupLanguage();

		expect(translateService.addLangs).toHaveBeenCalledWith([Languages.en, Languages.nl]);
		expect(translateService.setDefaultLang).toHaveBeenCalledWith(Languages.nl);
		expect(service.usedLang).toBe(storedLanguage);
		localStorage.clear();
	});

	describe('setupLanguage', () => {
		it('makes expected calls', () => {
			const translateServiceStub: TranslateService = TestBed.inject(TranslateService);
			jest.spyOn(translateServiceStub, 'addLangs');
			jest.spyOn(translateServiceStub, 'setDefaultLang');
			service.setupLanguage();

			expect(translateServiceStub.addLangs).toHaveBeenCalled();
			expect(translateServiceStub.setDefaultLang).toHaveBeenCalled();
		});
	});
});
