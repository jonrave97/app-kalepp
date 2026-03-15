import { useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { useMyRequests } from '@/hooks/requests/useMyRequests';
import { RequestDetailModal } from '@/pages/WarehouseDetailPage';
import type { AdminRequest } from '@/services/requestServices';

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        Pendiente:            'bg-yellow-100 text-yellow-700',
        Aprobada:             'bg-blue-100 text-blue-700',
        'Cambios solicitados': 'bg-red-100 text-red-700',
        Entregado:            'bg-green-100 text-green-700',
        // backward-compat aliases
        Rechazada:            'bg-red-100 text-red-700',
        Entregada:            'bg-green-100 text-green-700',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CL', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

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

    const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);

    useEffect(() => {
        fetchRequests(1, '');
    }, [fetchRequests]);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-4">

                {/* Encabezado */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Mis Solicitudes</h1>
                        <p className="text-xs text-gray-400 mt-0.5">{total} registro{total !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {/* Buscador */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputSearch}
                        onChange={e => setInputSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar por código…"
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                   focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                    />
                    <button
                        onClick={handleSearch}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                                   text-white bg-primary rounded-xl hover:opacity-85 transition-opacity"
                    >
                        <Search className="w-4 h-4" />
                        Buscar
                    </button>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="animate-pulse divide-y divide-gray-100">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="px-6 py-4 flex justify-between items-center">
                                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                                    <div className="h-4 bg-gray-200 rounded w-16" />
                                    <div className="h-4 bg-gray-200 rounded w-8" />
                                </div>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-gray-400 text-sm">No se encontraron solicitudes</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Código</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map(req => (
                                    <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-gray-800">#{req.code}</td>
                                        <td className="px-6 py-4 text-gray-600">{formatDate(req.date)}</td>
                                        <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                title="Ver detalle"
                                                className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-1">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1}
                            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl
                                       hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>
                        <span className="text-xs text-gray-400">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl
                                       hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                )}

            </div>

            {/* Modal detalle */}
            {selectedRequest && (
                <RequestDetailModal
                    req={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                />
            )}
        </div>
    );
}

export default MyRequestsPage;
