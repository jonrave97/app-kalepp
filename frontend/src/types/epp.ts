export interface Epp {
    _id: string;
    code: string;
    name: string;
    price: number;
    category: string;
    disabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface EppsResponse {
    epps: Epp[];
    total: number;
    page: number;
    totalPages: number;
}
