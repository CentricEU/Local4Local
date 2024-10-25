import { ColumnType } from "../enums/column.enum";

export class ColumnConfig<T> {  
    columnDef: ColumnType;
    header: string;
    cell: (element: T) => string | number | Date;  
}
