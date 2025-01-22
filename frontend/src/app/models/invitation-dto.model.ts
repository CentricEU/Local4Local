export class InvitationDto {
    public email: string;
    public createdDate: string;
    public isRegistered: boolean;

    constructor(email: string, createdDate: string, registered: boolean) {
        this.email = email;
        this.createdDate = createdDate;
        this.isRegistered = registered;
    }
}