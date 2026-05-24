import { useState, useCallback, useRef } from 'react';
import * as requestServices from '@/services/requestServices';
import type { AdminRequest } from '@/services/requestServices';

export type RequestStatus = '' | 'Pendiente' | 'Aprobada' | 'Sin Stock' | 'Entregada';

export function useWarehouseRequests(warehouseId: string) {
    const [requests, setRequests]       = useState<AdminRequest[]>([]);
    const [total, setTotal]             = useState(0);
    const [pages, setPages]             = useState(1);
    const [page, setPage]               = useState(1);
    const [inputSearch, setInputSearch] = useState('');
    const [search, setSearch]           = useState('');
    const [statusFilter, setStatusFilter] = useState<RequestStatus>('');
    const [loading, setLoading]         = useState(false);

    // Ref para que fetchRequests nunca cambie de referencia al cambiar statusFilter
    const statusFilterRef = useRef<RequestStatus>(statusFilter);
    statusFilterRef.current = statusFilter;

    const fetchRequests = useCallback(async (p: number, s: string, st?: RequestStatus) => {
        const status = st !== undefined ? st : statusFilterRef.current;
        try {
            setLoading(true);
            const data = await requestServices.getAdminRequests(warehouseId, p, s, 10, status);
            setRequests(data.requests);
            setTotal(data.total);
            setPages(data.pages);
            setPage(data.page);
        } finally {
            setLoading(false);
        }
    }, [warehouseId]); // ← estable: solo cambia si cambia la bodega

    const handleSearch = () => {
        setSearch(inputSearch);
        fetchRequests(1, inputSearch, statusFilter);
    };

    const handlePageChange = (newPage: number) => {
        fetchRequests(newPage, search, statusFilter);
    };

    const handleStatusChange = (newStatus: RequestStatus) => {
        setStatusFilter(newStatus);
        fetchRequests(1, search, newStatus);
    };

    const handleClear = () => {
        setInputSearch('');
        setSearch('');
        setStatusFilter('');
        fetchRequests(1, '', '');
    };

    return {
        requests,
        total,
        pages,
        page,
        inputSearch,
        setInputSearch,
        statusFilter,
        loading,
        fetchRequests,
        handleSearch,
        handlePageChange,
        handleStatusChange,
        handleClear,
    };
}
