import { useState, useCallback } from 'react';
import { useAuth } from '@/context/Authcontext';
import * as requestServices from '@/services/requestServices';
import type { AdminRequest } from '@/services/requestServices';

export function useMyRequests() {
    const { auth } = useAuth();
    const [requests, setRequests]     = useState<AdminRequest[]>([]);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage]             = useState(1);
    const [search, setSearch]         = useState('');
    const [inputSearch, setInputSearch] = useState('');
    const [loading, setLoading]       = useState(false);

    const fetchRequests = useCallback(async (p: number, s: string) => {
        if (!auth?._id) return;
        try {
            setLoading(true);
            const data = await requestServices.getMyRequests(auth._id, p, s);
            setRequests(data.requests);
            setTotal(data.total);
            setTotalPages(data.pages);
            setPage(data.page);
        } finally {
            setLoading(false);
        }
    }, [auth?._id]);

    const handleSearch = () => {
        setSearch(inputSearch);
        fetchRequests(1, inputSearch);
    };

    const handlePageChange = (newPage: number) => {
        fetchRequests(newPage, search);
    };

    return {
        requests,
        total,
        totalPages,
        page,
        inputSearch,
        setInputSearch,
        loading,
        fetchRequests,
        handleSearch,
        handlePageChange,
    };
}
