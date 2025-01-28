import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-no-data',
	templateUrl: './no-data.component.html',
	styleUrl: './no-data.component.scss'
})
export class NoDataComponent {
	@Input() noDataTitle: string;
	@Input() noDataDescription: string;
	@Input() imageName = 'no_data.svg';

	private imagePath = '/assets/images/';

	public getImagePath(): string {
		return `${this.imagePath}${this.imageName}`;
	}

	public isNoLocationImage(): boolean {
		return this.imageName === 'no-location.svg';
	}
}
