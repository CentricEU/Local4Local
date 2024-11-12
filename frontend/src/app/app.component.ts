import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { SidenavService } from './services/sidenav.service';
import { MultilanguageService } from './services/multilanguage.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
	private sidenavService = inject(SidenavService);
	private multilanguageService = inject(MultilanguageService);
	private cdr = inject(ChangeDetectorRef);

	private translationsSubscription: Subscription;
	public tranlationsLoaded = false;

	public get shouldShowSidenav(): boolean {
		return this.sidenavService.isRouteWithNavigation;
	}

	public ngOnInit(): void {
		this.subscribeToTranslationsLoad();
		this.multilanguageService.setupLanguage();
	}

	public ngOnDestroy(): void {
		this.translationsSubscription?.unsubscribe();
	}

	private subscribeToTranslationsLoad(): void {
		this.translationsSubscription = this.multilanguageService.translationsLoadedEventEmitter.subscribe(() => {
			this.tranlationsLoaded = true;
			this.cdr.detectChanges();
		});
	}
}
