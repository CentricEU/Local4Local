export class InvitationDto {
    public email: string;
    public createdDate: string;

    constructor(email: string, createdDate: string) {
        this.email = email;
        this.createdDate = createdDate;
    }
}