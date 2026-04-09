import { useState, useCallback } from 'react';
import type { Kit } from '@/types/kit';
import * as kitServices from '@/services/kitServices';

export function useKits() {
    const [kits, setKits]             = useState<Kit[]>([]);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage]             = useState(1);
    const [search, setSearch]         = useState('');
    const [inputSearch, setInputSearch] = useState('');
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);

    const fetchKits = useCallback(async (p: number, s: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await kitServices.getKits(p, s);
            setKits(data.kits);
            setTotal(data.total);
            setTotalPages(data.totalPages);
            setPage(data.page);
        } catch (err) {
            console.error('Error al cargar kits:', err);
            setError('No se pudieron cargar los kits. Verifica tu conexión e intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = () => {
        setSearch(inputSearch);
        fetchKits(1, inputSearch);
    };

    const handlePageChange = (newPage: number) => {
        fetchKits(newPage, search);
    };

    return {
        kits,
        total,
        totalPages,
        page,
        search,
        inputSearch,
        setInputSearch,
        loading,
        error,
        fetchKits,
        handleSearch,
        handlePageChange,
    };
}
