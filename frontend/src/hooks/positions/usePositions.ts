import { useState, useCallback } from 'react';
import type { Position } from '@/types/position';
import * as positionServices from '@/services/positionServices';

export function usePositions() {
    const [positions, setPositions]   = useState<Position[]>([]);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage]             = useState(1);
    const [search, setSearch]         = useState('');
    const [inputSearch, setInputSearch] = useState('');
    const [loading, setLoading]       = useState(false);

    const fetchPositions = useCallback(async (p: number, s: string) => {
        try {
            setLoading(true);
            const data = await positionServices.getPositions(p, s);
            setPositions(data.positions);
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
        fetchPositions(1, inputSearch);
    };

    const handlePageChange = (newPage: number) => {
        fetchPositions(newPage, search);
    };

    return {
        positions,
        total,
        totalPages,
        page,
        search,
        inputSearch,
        setInputSearch,
        loading,
        fetchPositions,
        handleSearch,
        handlePageChange,
    };
}
