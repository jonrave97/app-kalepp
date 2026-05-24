import { useEffect } from 'react';
import { useMyRequests } from '@/hooks/requests/useMyRequests';
import { RequestList } from '@/components/requests/RequestList';

const KIT_REASON = 'Kit Inicial Trabajador Nuevo';

function MyKitRequestsPage() {
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
    } = useMyRequests(KIT_REASON);

    useEffect(() => {
        fetchRequests(1, '');
    }, [fetchRequests]);

    return (
        <RequestList
            title="Mis Solicitudes de Kit Inicial"
            requests={requests}
            loading={loading}
            total={total}
            page={page}
            totalPages={totalPages}
            inputSearch={inputSearch}
            onSearchChange={setInputSearch}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            searchPlaceholder="Buscar por código…"
            emptyMessage="No se encontraron solicitudes de kit inicial"
            workerView
        />
    );
}

export default MyKitRequestsPage;
