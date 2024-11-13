import { Component, inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-description',
	templateUrl: './description.component.html',
	styleUrls: ['./description.component.scss']
})
export class DescriptionComponent implements OnInit {
	private translateService = inject(TranslateService);

	public descriptionKeys = [
		'presentation.description.platformOverview',
		'presentation.description.currentChallenges',
		'presentation.description.communityBenefits'
	];

	public imagePath: string;

	public ngOnInit(): void {
		this.setImagePath();
		this.translateService.onLangChange.subscribe(() => this.setImagePath());
	}

	private setImagePath(): void {
		const lang = this.translateService.currentLang || 'en-US';
		this.imagePath = `../../../../assets/images/description-${lang}.svg`;
	}
}
