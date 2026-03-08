import { useState, useCallback } from 'react';
import type { Epp } from '@/types/epp';
import * as eppServices from '@/services/eppServices';

export function useEpps() {
    const [epps, setEpps]             = useState<Epp[]>([]);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage]             = useState(1);
    const [search, setSearch]         = useState('');
    const [inputSearch, setInputSearch] = useState('');
    const [loading, setLoading]       = useState(false);

    const fetchEpps = useCallback(async (p: number, s: string) => {
        try {
            setLoading(true);
            const data = await eppServices.getEpps(p, s);
            setEpps(data.epps);
            setTotal(data.total);
            setTotalPages(data.totalPages);
            setPage(data.page);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = () => {
        setSearch(inputSearch);
        fetchEpps(1, inputSearch);
    };

    const handlePageChange = (newPage: number) => {
        fetchEpps(newPage, search);
    };

    return {
        epps,
        total,
        totalPages,
        page,
        search,
        inputSearch,
        setInputSearch,
        loading,
        fetchEpps,
        handleSearch,
        handlePageChange,
    };
}
