import { Component } from '@angular/core';

@Component({
	selector: 'app-description',
	templateUrl: './description.component.html',
	styleUrl: './description.component.scss'
})
export class DescriptionComponent {
	public descriptionKeys = [
		'presentation.description.platformOverview',
		'presentation.description.currentChallenges',
		'presentation.description.communityBenefits'
	];
}
