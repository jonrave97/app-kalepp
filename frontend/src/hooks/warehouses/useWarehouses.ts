import { useState, useCallback } from 'react';
import type { Warehouse } from '@/types/warehouse';
import * as warehouseServices from '@/services/warehouseServices';

export function useWarehouses() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage]             = useState(1);
    const [search, setSearch]         = useState('');
    const [inputSearch, setInputSearch] = useState('');
    const [loading, setLoading]       = useState(false);

    const fetchWarehouses = useCallback(async (p: number, s: string) => {
        try {
            setLoading(true);
            const data = await warehouseServices.getWarehouses(p, s);
            setWarehouses(data.warehouses);
            setTotal(data.total);
            setTotalPages(data.totalPages);
            setPage(data.page);
        } finally {
            setLoading(false);
        }
    }, []);

    // Ejecutar búsqueda manual (al presionar "Buscar")
    const handleSearch = () => {
        setSearch(inputSearch);
        fetchWarehouses(1, inputSearch);
    };

    const handlePageChange = (newPage: number) => {
        fetchWarehouses(newPage, search);
    };

    return {
        warehouses,
        total,
        totalPages,
        page,
        search,
        inputSearch,
        setInputSearch,
        loading,
        fetchWarehouses,
        handleSearch,
        handlePageChange,
    };
}
