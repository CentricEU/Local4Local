import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { HomeComponent } from './components/home/home.component';
import { SidenavService } from './services/sidenav.service';
import { MultilanguageService } from './services/multilanguage.service';
import { MatNativeDateModule } from '@angular/material/core';
import { of } from 'rxjs';

describe('AppComponent', () => {
	let sidenavService: any;
	let multilanguageService: any;
	let component: AppComponent;
	let fixture: any;
	let cdrSpy: jest.SpyInstance;

	beforeEach(async () => {
		const mockSidenavService = {
			isRouteWithNavigation: true
		};

		const mockMultilanguageService = {
			setupLanguage: jest.fn(),
			translationsLoadedEventEmitter: of(true)
		};

		await TestBed.configureTestingModule({
			imports: [RouterModule.forRoot([])],
			declarations: [AppComponent]
		}).compileComponents();

		await TestBed.configureTestingModule({
			imports: [HttpClientModule, BrowserAnimationsModule, MatNativeDateModule, TranslateModule.forRoot()],
			schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
			declarations: [AppComponent, HomeComponent],
			providers: [
				TranslateService,
				{ provide: MultilanguageService, useValue: mockMultilanguageService },
				{ provide: SidenavService, useValue: mockSidenavService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(AppComponent);
		component = fixture.componentInstance;
		cdrSpy = jest.spyOn(component['cdr'], 'detectChanges');
		sidenavService = TestBed.inject(SidenavService);
		multilanguageService = TestBed.inject(MultilanguageService);
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it('should return the value of sidenavService.isRouteWithNavigation', () => {
		sidenavService.isRouteWithNavigation = true;

		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;
		expect(app.shouldShowSidenav).toBeTruthy();
	});

	it('should call setupLanguage and subscribe to translations loaded event in ngOnInit', () => {
		component.ngOnInit();

		expect(multilanguageService.setupLanguage).toHaveBeenCalled();

		expect(cdrSpy).toHaveBeenCalled();
	});

	it('should subscribe to translationsLoadedEventEmitter and trigger change detection in subscribeToTranslationsLoad', () => {
		component.ngOnInit();

		multilanguageService.translationsLoadedEventEmitter.subscribe(() => {
			expect(component.tranlationsLoaded).toBe(true);

			expect(cdrSpy).toHaveBeenCalled();
		});
	});
});
