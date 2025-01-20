export class InvitationDto {
    public email: string;
    public createdDate: string;
    public registered: boolean;

    constructor(email: string, createdDate: string, registered: boolean) {
        this.email = email;
        this.createdDate = createdDate;
        this.registered = registered;
    }
}