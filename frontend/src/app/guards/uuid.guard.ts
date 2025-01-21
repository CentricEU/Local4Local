import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { RegexUtil } from '../util/regex.util';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UUIDGuard implements CanActivate {
  readonly router = inject(Router);
  readonly location = inject(Location);

  canActivate(
    route: ActivatedRouteSnapshot,
  ): boolean | Observable<boolean> {
    const token = route.params['token'];

    if (RegexUtil.uuidRegexPattern.test(token)) {
      return true;
    }

    this.clearPath();
    return true;

  }

  private clearPath(): void {
		this.location.replaceState('');
	}
}