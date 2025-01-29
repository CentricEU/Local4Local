import { TestBed } from '@angular/core/testing';

import { MultilanguageService } from './multilanguage.service';
import { TranslateService } from '@ngx-translate/core';
import { Languages } from '../enums/language.enum';
import { DateAdapter } from '@angular/material/core';
import { CookieService } from 'ngx-cookie-service';

describe('MultilanguageService', () => {
	let service: MultilanguageService;
	let translateService: TranslateService;
	let cookieService: CookieService;

	beforeEach(() => {
		const translateServiceStub = () => ({
			addLangs: () => ({}),
			setDefaultLang: () => ({}),
			use: () => ({
				subscribe: (f: () => void) => f()
			})
		});

		const cookieServiceStub = () => ({
			get: () => ({}),
			set: () => ({})
		});

		TestBed.configureTestingModule({
			providers: [
				MultilanguageService,
				{ provide: TranslateService, useFactory: translateServiceStub },
				{ provide: CookieService, useFactory: cookieServiceStub },
				DateAdapter
			]
		});
		service = TestBed.inject(MultilanguageService);
		translateService = TestBed.inject(TranslateService);
		cookieService = TestBed.inject(CookieService);
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
		cookieService.set('language', storedLanguage);
		service.setupLanguage();

		expect(translateService.addLangs).toHaveBeenCalledWith([Languages.en, Languages.nl]);
		expect(translateService.setDefaultLang).toHaveBeenCalledWith(Languages.nl);
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

	it('should set up the default language if no stored language is available', () => {
		jest.spyOn(cookieService, 'get').mockReturnValue('');
		const setUsedLanguageSpy = jest.spyOn(service as any, 'setUsedLanguage');

		service.setupLanguage();

		expect(translateService.addLangs).toHaveBeenCalledWith([Languages.en, Languages.nl]);
		expect(translateService.setDefaultLang).toHaveBeenCalledWith(Languages.nl);
		expect(setUsedLanguageSpy).toHaveBeenCalledWith(Languages.nl);
	});
});
