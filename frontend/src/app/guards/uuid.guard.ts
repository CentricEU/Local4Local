import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { RegexUtil } from '../util/regex.util';
import { commonRoutingConstants } from '../_constants/common-routing.constants';

@Injectable({
  providedIn: 'root'
})
export class UUIDGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
  ): boolean | Observable<boolean> {
    const token = route.params['token'];

    if (RegexUtil.uuidRegexPattern.test(token)) {
      return true;
    }

    this.router.navigate([commonRoutingConstants.home]);
    return false;

  }
}