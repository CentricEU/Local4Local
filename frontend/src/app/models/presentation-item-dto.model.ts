export class PresentationItem {
	public classType: string;
	public title: string;
	public text: string;
	public id: number;

	constructor(classType: string, title: string, text: string, id: number) {
		this.classType = classType;
		this.title = title;
		this.text = text;
		this.id = id;
	}
}
