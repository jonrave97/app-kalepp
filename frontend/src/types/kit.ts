export interface KitEpp {
    epp: { _id: string; name: string; code?: string } | string;
    quantity: number;
}

export interface Kit {
    _id: string;
    name: string;
    description: string;
    epps: KitEpp[];
    active: boolean;
    createdAt: string;
}

export interface KitsResponse {
    kits: Kit[];
    total: number;
    page: number;
    totalPages: number;
}
