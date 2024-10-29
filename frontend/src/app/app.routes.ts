import { Route } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { commonRoutingConstants } from './_constants/common-routing.constants';
import { AuthGuard } from './guards/auth.guard';
import { NonAuthGuard } from './guards/non-auth.guard';
import { GenericFormComponent } from './components/generic-form/generic-form.component';
import { MerchantsComponent } from './components/merchants/merchants.component';
import { InvitationsComponent } from './components/invitations/invitations.component';
import { ProfileComponent } from './components/profile/profile.component';
import { MfaComponent } from './components/mfa/mfa.component';
import { MfaGuard } from './guards/mfa.guard';


export const appRoutes: Route[] = [
    { path: '', component: HomeComponent, canActivate: [NonAuthGuard] },
    { path: commonRoutingConstants.recover, component: GenericFormComponent, canActivate: [NonAuthGuard] },
    { path: `${commonRoutingConstants.changePassword}/:token`, component: GenericFormComponent, canActivate: [NonAuthGuard] },
    { path: commonRoutingConstants.login, component: LoginComponent, canActivate: [NonAuthGuard] },
    { path: commonRoutingConstants.dashboard, component: DashboardComponent, canActivate: [AuthGuard] },
    { path: commonRoutingConstants.merchants, component: MerchantsComponent, canActivate: [AuthGuard] },
    { path: commonRoutingConstants.invitations, component: InvitationsComponent, canActivate: [AuthGuard] },
    { path: commonRoutingConstants.profile, component: ProfileComponent, canActivate: [AuthGuard] },
    { path: commonRoutingConstants.mfa, component: MfaComponent, canActivate: [MfaGuard] },
    { path: '**', redirectTo: '', pathMatch: 'full' }
];
