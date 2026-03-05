export interface Position {
    _id: string;
    name: string;
    disabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PositionsResponse {
    positions: Position[];
    total: number;
    page: number;
    totalPages: number;
}
