export class MerchantDto {
    public companyName: string;
    public identifierNumber: string;
    public category: number | string;
    public latitude: number;
    public longitude: number;
    public address: string;
    public contactEmail: string;
    public website?: string;
    public token?: string;
    public id?: string;
    public status?: string;
}