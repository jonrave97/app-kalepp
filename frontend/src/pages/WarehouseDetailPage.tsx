import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Trash2, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '@/context/Authcontext';
import { useWarehouseRequests } from '@/hooks/requests/useWarehouseRequests';
import * as warehouseServices from '@/services/warehouseServices';
import * as requestServices from '@/services/requestServices';
import type { Warehouse } from '@/types/warehouse';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        Pendiente: 'bg-yellow-100 text-yellow-700',
        Aprobada:  'bg-green-100 text-green-700',
        Rechazada: 'bg-red-100 text-red-700',
        Entregada: 'bg-blue-100 text-blue-700',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
}

function employeeName(emp: { _id: string; name: string } | string | null | undefined): string {
    if (!emp) return '—';
    if (typeof emp === 'object' && emp.name) return emp.name;
    return '—';
}

function StockBadge({ stock }: { stock?: string }) {
    if (!stock) return <span className="text-gray-400 text-xs">—</span>;
    const style = stock === 'Con Stock'
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700';
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style}`}>
            {stock}
        </span>
    );
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CL', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

// ─── Página ───────────────────────────────────────────────────────────────────
function WarehouseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { auth } = useAuth();

    const [warehouse, setWarehouse]             = useState<Warehouse | null>(null);
    const [warehouseLoading, setWarehouseLoading] = useState(true);

    const isAdmin = auth?.rol === 'Administrador' || auth?.role === 'Administrador';

    const {
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
    } = useWarehouseRequests(id!);

    useEffect(() => {
        if (!id) return;
        warehouseServices.getWarehouseById(id)
            .then(setWarehouse)
            .catch(() => setWarehouse(null))
            .finally(() => setWarehouseLoading(false));
        fetchRequests(1, '');
    }, [id, fetchRequests]);

    const handleDelete = async (reqId: string) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar solicitud?',
            text: '¿Deseas eliminar esta solicitud? Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#e3342f',
        });
        if (!result.isConfirmed) return;
        try {
            await requestServices.deleteRequest(reqId);
            await Swal.fire({ icon: 'success', title: 'Solicitud eliminada', timer: 1400, showConfirmButton: false });
            fetchRequests(page, inputSearch);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Error', text: msg || 'No se pudo eliminar la solicitud' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-5xl mx-auto space-y-4">

                {/* Encabezado */}
                <div>
                    <button
                        onClick={() => navigate('/admin/warehouses')}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Bodegas
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900">
                        {warehouseLoading ? '…' : warehouse ? `Bodega: ${warehouse.name}` : 'Bodega no encontrada'}
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {total} solicitud{total !== 1 ? 'es' : ''}
                    </p>
                </div>

                {/* Buscador */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputSearch}
                        onChange={e => setInputSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar por código o trabajador…"
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
                    <button
                        onClick={handleClear}
                        className="px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl
                                   hover:bg-gray-50 transition-colors"
                    >
                        Limpiar
                    </button>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="animate-pulse divide-y divide-gray-100">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="px-6 py-4 flex gap-4">
                                    <div className="h-4 bg-gray-200 rounded w-16" />
                                    <div className="h-4 bg-gray-200 rounded w-24" />
                                    <div className="h-4 bg-gray-200 rounded w-20" />
                                    <div className="h-4 bg-gray-200 rounded w-32" />
                                </div>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-gray-400 text-sm">No se encontraron solicitudes</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Código</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Trabajador</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha de Entrega</th>
                                        {isAdmin && (
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {requests.map(req => (
                                        <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-gray-600">#{req.code}</td>
                                            <td className="px-4 py-3 text-gray-700">{formatDate(req.date)}</td>
                                            <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                                            <td className="px-4 py-3 text-gray-700">{employeeName(req.employee)}</td>
                                            <td className="px-4 py-3 text-center"><StockBadge stock={req.stock} /></td>
                                            <td className="px-4 py-3 text-gray-700">{req.deliveryDate ? formatDate(req.deliveryDate) : <span className="text-gray-400">—</span>}</td>
                                            {isAdmin && (
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleDelete(req._id)}
                                                        title="Eliminar solicitud"
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Paginación */}
                {pages > 1 && (
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
                            Página {page} de {pages}
                        </span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= pages}
                            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl
                                       hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default WarehouseDetailPage;
