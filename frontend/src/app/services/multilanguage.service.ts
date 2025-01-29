import { EventEmitter, Injectable } from '@angular/core';
import { Languages } from '../enums/language.enum';
import { TranslateService } from '@ngx-translate/core';
import { DateAdapter } from '@angular/material/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
	providedIn: 'root'
})
export class MultilanguageService {
	private static BROWSER_LANGUAGE_LABEL = 'Br_Lang';

	public translations: string;
	public defLang = Languages.nl;
	public translationsLoadedEventEmitter = new EventEmitter<boolean>();

	constructor(
		private _translateService: TranslateService,
		private _dateAdapter: DateAdapter<unknown>,
		private _cookieService: CookieService
	) {}

	public setupLanguage(): void {
		this._translateService.addLangs([Languages.en, Languages.nl]);
		this._translateService.setDefaultLang(this.defLang);

		const recordCookie = this._cookieService.get('language');

		if (recordCookie) {
			this.setUsedLanguage(recordCookie);
			return;
		}

		this.setUsedLanguage(this.defLang);
	}

	private setUsedLanguage(lang: string): void {
		this._dateAdapter.setLocale(lang);

		localStorage.setItem(MultilanguageService.BROWSER_LANGUAGE_LABEL, lang);
		this._translateService.use(lang).subscribe((value) => {
			this.translations = value;
			this.translationsLoadedEventEmitter.emit(true);
		});
		
		this._cookieService.set('language', lang);
	}
}
