import { useEffect } from 'react';
import { useMyRequests } from '@/hooks/requests/useMyRequests';
import { RequestList } from '@/components/requests/RequestList';

function MyRequestsPage() {
    const {
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
    } = useMyRequests();

    useEffect(() => {
        fetchRequests(1, '');
    }, [fetchRequests]);

    return (
        <RequestList
            title="Mis Solicitudes"
            requests={requests}
            loading={loading}
            total={total}
            page={page}
            totalPages={totalPages}
            inputSearch={inputSearch}
            onSearchChange={setInputSearch}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            workerView
        />
    );
}

export default MyRequestsPage;
