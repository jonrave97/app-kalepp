export interface Category {
    _id: string;
    name: string;
    disabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CategoriesResponse {
    categories: Category[];
    total: number;
    page: number;
    totalPages: number;
}
