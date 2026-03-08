import { useState, useCallback } from 'react';
import type { Category } from '@/types/category';
import * as categoryServices from '@/services/categoryServices';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage]             = useState(1);
    const [search, setSearch]         = useState('');
    const [inputSearch, setInputSearch] = useState('');
    const [loading, setLoading]       = useState(false);

    const fetchCategories = useCallback(async (p: number, s: string) => {
        try {
            setLoading(true);
            const data = await categoryServices.getCategories(p, s);
            setCategories(data.categories);
            setTotal(data.total);
            setTotalPages(data.totalPages);
            setPage(data.page);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = () => {
        setSearch(inputSearch);
        fetchCategories(1, inputSearch);
    };

    const handlePageChange = (newPage: number) => {
        fetchCategories(newPage, search);
    };

    return {
        categories,
        total,
        totalPages,
        page,
        search,
        inputSearch,
        setInputSearch,
        loading,
        fetchCategories,
        handleSearch,
        handlePageChange,
    };
}
