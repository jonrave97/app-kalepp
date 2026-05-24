import { useState, useCallback, useRef } from 'react';
import { getTeamMemberRequests } from '@/services/requestServices';
import type { AdminRequest } from '@/services/requestServices';

export type EmployeeRequestStatus = '' | 'Pendiente' | 'Aprobada' | 'Sin Stock' | 'Entregada' | 'Cambios solicitados';

export function useEmployeeRequests(employeeId: string) {
    const [requests, setRequests]         = useState<AdminRequest[]>([]);
    const [total, setTotal]               = useState(0);
    const [pages, setPages]               = useState(1);
    const [page, setPage]                 = useState(1);
    const [inputSearch, setInputSearch]   = useState('');
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState<EmployeeRequestStatus>('');
    const [loading, setLoading]           = useState(false);

    const statusFilterRef = useRef<EmployeeRequestStatus>(statusFilter);
    statusFilterRef.current = statusFilter;

    const fetchRequests = useCallback(async (p: number, s: string, st?: EmployeeRequestStatus) => {
        const status = st !== undefined ? st : statusFilterRef.current;
        try {
            setLoading(true);
            const data = await getTeamMemberRequests(employeeId, p, s, 10, status);
            setRequests(data.requests);
            setTotal(data.total);
            setPages(data.pages);
            setPage(data.page);
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    const handleSearch = () => {
        setSearch(inputSearch);
        fetchRequests(1, inputSearch, statusFilter);
    };

    const handlePageChange = (newPage: number) => {
        fetchRequests(newPage, search, statusFilter);
    };

    const handleStatusChange = (newStatus: EmployeeRequestStatus) => {
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

