import { Component } from '@angular/core';

@Component({
	selector: 'app-section-info',
	templateUrl: './section-info.component.html',
	styleUrl: './section-info.component.scss'
})
export class SectionInfoComponent {
	public sections = [
		{
			class: 'applications',
			title: 'presentation.info.applications.title',
			text: 'presentation.info.applications.text'
		},
		{
			class: 'platform',
			title: 'presentation.info.buildingBlocks.title',
			text: 'presentation.info.buildingBlocks.text'
		},
		{
			class: 'infrastructure',
			title: 'presentation.info.infrastructure.title',
			text: 'presentation.info.infrastructure.text'
		}
	];
}
