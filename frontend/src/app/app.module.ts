import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MerchantsMapComponent } from './components/merchants-map/merchants-map.component';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NgModule } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { GenericDialogComponent } from './components/generic-dialog/generic-dialog.component';
import { HomeComponent } from './components/home/home.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RecaptchaFormsModule, RecaptchaModule, RECAPTCHA_SETTINGS } from 'ng-recaptcha';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ErrorCatchingInterceptor } from './_interceptors/error-catching.interceptor';
import { InviteMerchantDialogComponent } from './components/invite-merchant-dialog/invite-merchant-dialog.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from './components/custom-snackbar/custom-snackbar.component';
import { MatMenuModule } from '@angular/material/menu';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { GenericFormComponent } from './components/generic-form/generic-form.component';
import { NoDataComponent } from './components/no-data/no-data.component';
import { MerchantsComponent } from './components/merchants/merchants.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { InvitationsComponent } from './components/invitations/invitations.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ProfileComponent } from './components/profile/profile.component';
import { MfaComponent } from './components/mfa/mfa.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MerchantDialogComponent } from './components/merchant-dialog/merchant-dialog.component';
import { AppHttpInterceptor } from './_interceptors/app-http.interceptor';
import { AppLoaderComponent } from './components/app-loader/app-loader.component';
import { MatNativeDateModule } from '@angular/material/core';

export function httpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
	declarations: [
		AppComponent,
		HomeComponent,
		MerchantsMapComponent,
		MerchantDialogComponent,
		GenericDialogComponent,
		LoginComponent,
		DashboardComponent,
		CustomSnackbarComponent,
		SidenavComponent,
		InviteMerchantDialogComponent,
		GenericFormComponent,
		InvitationsComponent,
		MerchantsComponent,
		NoDataComponent,
		ProfileComponent,
		MfaComponent,
  AppLoaderComponent
	],
	imports: [
		HttpClientModule,
		MatNativeDateModule,
		MatTooltipModule,
		MatExpansionModule,
		MatDividerModule,
		MatPaginatorModule,
		MatIconModule,
		MatTableModule,
		MatCardModule,
		MatDialogModule,
		BrowserModule,
		AppRoutingModule,
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		MatButtonModule,
		MatDialogTitle,
		MatDialogContent,
		MatDialogActions,
		MatDialogClose,
		MatSelectModule,
		MatAutocompleteModule,
		MatChipsModule,
		FormsModule,
		ReactiveFormsModule,
		MatCheckboxModule,
		RecaptchaModule,
		RecaptchaFormsModule,
		MatSnackBarModule,
		MatMenuModule,
		MatSidenavModule,
		MatListModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: httpLoaderFactory,
				deps: [HttpClient]
			}
		})
	],
	providers: [
		provideClientHydration(),
		provideAnimationsAsync(),
		{
			provide: RECAPTCHA_SETTINGS,
			useValue: {
				siteKey: '6Ld-jb4pAAAAAI34pOa8uqqGX407eykhcPLDTdO7'
			}
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: ErrorCatchingInterceptor,
			multi: true
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AppHttpInterceptor,
			multi: true
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {}
