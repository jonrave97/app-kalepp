import { useState, useCallback } from 'react';
import * as requestServices from '@/services/requestServices';
import type { AdminRequest } from '@/services/requestServices';

export function useWarehouseRequests(warehouseId: string) {
    const [requests, setRequests] = useState<AdminRequest[]>([]);
    const [total, setTotal]       = useState(0);
    const [pages, setPages]       = useState(1);
    const [page, setPage]         = useState(1);
    const [inputSearch, setInputSearch] = useState('');
    const [search, setSearch]     = useState('');
    const [loading, setLoading]   = useState(false);

    const fetchRequests = useCallback(async (p: number, s: string) => {
        try {
            setLoading(true);
            const data = await requestServices.getAdminRequests(warehouseId, p, s);
            setRequests(data.requests);
            setTotal(data.total);
            setPages(data.pages);
            setPage(data.page);
        } finally {
            setLoading(false);
        }
    }, [warehouseId]);

    const handleSearch = () => {
        setSearch(inputSearch);
        fetchRequests(1, inputSearch);
    };

    const handlePageChange = (newPage: number) => {
        fetchRequests(newPage, search);
    };

    const handleClear = () => {
        setInputSearch('');
        setSearch('');
        fetchRequests(1, '');
    };

    return {
        requests,
        total,
        pages,
        page,
        inputSearch,
        setInputSearch,
        loading,
        fetchRequests,
        handleSearch,
        handlePageChange,
        handleClear,
    };
}
