import { useState, useCallback } from 'react';
import type { User } from '@/types/user';
import * as userAdminServices from '@/services/userAdminServices';

export function useUsers() {
    const [users, setUsers]           = useState<User[]>([]);
    const [total, setTotal]           = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage]             = useState(1);
    const [search, setSearch]         = useState('');
    const [inputSearch, setInputSearch] = useState('');
    const [loading, setLoading]       = useState(false);

    const fetchUsers = useCallback(async (p: number, s: string) => {
        try {
            setLoading(true);
            const data = await userAdminServices.getUsers(p, s);
            setUsers(data.users);
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
        fetchUsers(1, inputSearch);
    };

    const handlePageChange = (newPage: number) => {
        fetchUsers(newPage, search);
    };

    return {
        users,
        total,
        totalPages,
        page,
        search,
        inputSearch,
        setInputSearch,
        loading,
        fetchUsers,
        handleSearch,
        handlePageChange,
    };
}
