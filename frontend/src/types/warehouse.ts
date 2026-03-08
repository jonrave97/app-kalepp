export interface Warehouse {
    _id: string;
    code: string;
    name: string;
    disabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface WarehousesResponse {
    warehouses: Warehouse[];
    total: number;
    page: number;
    totalPages: number;
}
