import { Component } from '@angular/core';
import { PresentationItem } from '../../models/presentation-item-dto.model';

@Component({
	selector: 'app-section-info',
	templateUrl: './section-info.component.html',
	styleUrl: './section-info.component.scss'
})
export class SectionInfoComponent {
	public sections: PresentationItem[] = [
		{
			classType: 'applications',
			title: 'presentation.info.applications.title',
			text: 'presentation.info.applications.text',
			id: 0
		},
		{
			classType: 'platform',
			title: 'presentation.info.buildingBlocks.title',
			text: 'presentation.info.buildingBlocks.text',
			id: 1
		},
		{
			classType: 'infrastructure',
			title: 'presentation.info.infrastructure.title',
			text: 'presentation.info.infrastructure.text',
			id: 2
		}
	];
}
