import { Component } from '@angular/core';

@Component({
	selector: 'app-members-info',
	templateUrl: './members-info.component.html',
	styleUrl: './members-info.component.scss'
})
export class MembersInfoComponent {
	//TO REACTOR WHEN WE KNOW THE MEMBERS
	public members = Array(4).fill(null).map((_, index) => ({
		name: 'Company name',
		description:
			'Lorem ipsum dolor sit amet consectetur. Pellentesque senectus habitant diam pellentesque egestas. Et nisl senectus neque enim feugiat mauris augue. Ultrices aliquam pretium morbi morbi id semper. Varius malesuada gravida egestas pulvinar. Gravida in est leo cursus volutpat at nibh lacus in. Tristique sit nunc neque morbi gravida etiam. Iaculis euismod tellus gravida ante non varius mauris. Sed donec tellus commodo a turpis nullam parturient. Ut aenean diam posuere ultricies congue.',
		index: index 
	}));
	
}
