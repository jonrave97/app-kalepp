import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Trash2, ArrowLeft, Eye, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '@/context/Authcontext';
import { useWarehouseRequests } from '@/hooks/requests/useWarehouseRequests';
import * as warehouseServices from '@/services/warehouseServices';
import * as requestServices from '@/services/requestServices';
import type { Warehouse } from '@/types/warehouse';
import type { AdminRequest } from '@/services/requestServices';

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Modal detalle + seguimiento ─────────────────────────────────────────────
export function RequestDetailModal({ req, onClose }: { req: AdminRequest; onClose: () => void }) {
    function approverName(a: AdminRequest['approver']): string {
        if (!a) return '';
        if (typeof a === 'object' && a.name) return a.name;
        return '';
    }

    function eppLabel(epp: AdminRequest['epps'][number]['epp']): string {
        if (epp && typeof epp === 'object' && epp.name) {
            // return epp.code ? `${epp.code} —xd ${epp.name}` : epp.name;
            return epp.code ? `${epp.name}` : epp.name;
        }
        return '—';
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-base font-semibold text-gray-900">
                        Solicitud <span className="font-mono">#{req.code}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
                    {/* Información general */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Información general</p>
                        <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden border-collapse">
                            <tbody className="divide-y divide-gray-100">
                                <tr className="bg-gray-50">
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-2/5">Trabajador</td>
                                    <td className="px-4 py-2.5 text-gray-800">{employeeName(req.employee)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</td>
                                    <td className="px-4 py-2.5"><StatusBadge status={req.status} /></td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha solicitud</td>
                                    <td className="px-4 py-2.5 text-gray-800">{formatDate(req.date)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Motivo</td>
                                    <td className="px-4 py-2.5 text-gray-800">{req.reason || '—'}</td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</td>
                                    <td className="px-4 py-2.5"><StockBadge stock={req.stock} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Seguimiento */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Seguimiento de la solicitud</p>
                        <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden border-collapse">
                            <tbody className="divide-y divide-gray-100">
                                <tr className="bg-gray-50">
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-2/5">Fecha aprobación</td>
                                    <td className="px-4 py-2.5 text-gray-800">
                                        {req.approveDate
                                            ? formatDate(req.approveDate)
                                            : <span className="text-yellow-600 text-xs font-medium">Aprobación pendiente</span>}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Aprobado por</td>
                                    <td className="px-4 py-2.5 text-gray-800">
                                        {approverName(req.approver) || <span className="text-gray-400">—</span>}
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha entrega</td>
                                    <td className="px-4 py-2.5 text-gray-800">
                                        {req.deliveryDate
                                            ? formatDate(req.deliveryDate)
                                            : <span className="text-yellow-600 text-xs font-medium">Entrega pendiente</span>}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Observación */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Observación</p>
                        <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden border-collapse">
                            <tbody className="divide-y divide-gray-100">
                                <tr className="bg-gray-50">
                                    <td className="px-4 py-2.5 text-gray-800">
                                        {req.observation
                                            ? req.observation
                                            : <span className="text-gray-400">Sin observaciones</span>}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* EPPs solicitados */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">EPPs solicitados</p>
                        <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">EPP</th>
                                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Cant.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {req.epps.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-center text-gray-400 text-xs">Sin EPPs</td>
                                    </tr>
                                ) : req.epps.map((e, i) => (
                                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                                        <td className="px-4 py-2.5 text-gray-800">{eppLabel(e.epp)}</td>
                                        <td className="px-4 py-2.5 text-center text-gray-800">{e.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Página ───────────────────────────────────────────────────────────────────
function WarehouseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { auth } = useAuth();

    const [warehouse, setWarehouse]             = useState<Warehouse | null>(null);
    const [warehouseLoading, setWarehouseLoading] = useState(true);    const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
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
        <>
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
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Ver</th>
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
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setSelectedRequest(req)}
                                                    title="Ver detalle"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
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

        {/* Modal detalle */}
        {selectedRequest && (
            <RequestDetailModal
                req={selectedRequest}
                onClose={() => setSelectedRequest(null)}
            />
        )}
        </>
    );
}

export default WarehouseDetailPage;
