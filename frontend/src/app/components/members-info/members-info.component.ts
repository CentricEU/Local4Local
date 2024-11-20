import { Component } from '@angular/core';

@Component({
	selector: 'app-members-info',
	templateUrl: './members-info.component.html',
	styleUrl: './members-info.component.scss'
})
export class MembersInfoComponent {
	public memberData = [
		{
			name: 'presentation.members.centricMember.title',
			description: 'presentation.members.centricMember.description',
			logo: 'centric_member_logo.png'
		},
		{
			name: 'presentation.members.delftMember.title',
			description: 'presentation.members.delftMember.description',
			logo: 'delft_member_logo.png'
		},
		{
			name: 'presentation.members.aixMarseilleMember.title',
			description: 'presentation.members.aixMarseilleMember.description',
			logo: 'aix-marseille_member_logo.png'
		},
		{
			name: 'presentation.members.KTUMember.title',
			description: 'presentation.members.KTUMember.description',
			logo: 'ktu_member_logo.png'
		}
	];
}
