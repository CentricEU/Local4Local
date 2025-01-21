import { inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { commonRoutingConstants } from "../_constants/common-routing.constants";

@Injectable({
	providedIn: 'root'
})
export class SidenavService {
	private router = inject(Router);

	public get isRouteWithNavigation(): boolean {
		const currentUrlTree = this.router.parseUrl(this.router.url);
		const currentPath = currentUrlTree.root.children['primary']?.segments.map(segment => segment.path).join('/');

		let hidden = false;

		if (!currentPath || currentPath.length === 0) {
			hidden = true;
		}

		const pathsToHideFor = [
			commonRoutingConstants.login,
			commonRoutingConstants.recover,
			commonRoutingConstants.changePassword,
			commonRoutingConstants.mfa,
			commonRoutingConstants.register
		];

		pathsToHideFor.forEach(pathToHideFor => {
			if (currentPath?.startsWith(pathToHideFor)) {
				hidden = true;
			}
		});

		return !hidden;
	}
}