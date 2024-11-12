import { EventEmitter, Injectable } from '@angular/core';
import { Languages } from '../enums/language.enum';
import { TranslateService } from '@ngx-translate/core';
import { DateAdapter } from '@angular/material/core';

@Injectable({
	providedIn: 'root'
})
export class MultilanguageService {
	private static BROWSER_LANGUAGE_LABEL = 'Br_Lang';

	public translations: string;
	public defLang = Languages.nl;
	public usedLang: string;
	public translationsLoadedEventEmitter = new EventEmitter<boolean>();

	constructor(private _translateService: TranslateService, private _dateAdapter: DateAdapter<unknown>) {}

	public setupLanguage(): void {
		this._translateService.addLangs([Languages.en, Languages.nl]);
		this._translateService.setDefaultLang(this.defLang);

		const storedLanguage = localStorage.getItem(MultilanguageService.BROWSER_LANGUAGE_LABEL);

		if (storedLanguage) {
			this.setUsedLanguage(storedLanguage);
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
		this.usedLang = lang;
	}
}
