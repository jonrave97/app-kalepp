import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Trash2, ArrowLeft, Eye, X, PackageCheck, ChevronDown, PackageOpen, CheckCircle2, CalendarClock, Ban } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '@/context/Authcontext';
import { useWarehouseRequests } from '@/hooks/requests/useWarehouseRequests';
import type { RequestStatus } from '@/hooks/requests/useWarehouseRequests';
import { usePendingDeliveryCount } from '@/hooks/requests/usePendingDeliveryCount';
import * as warehouseServices from '@/services/warehouseServices';
import * as requestServices from '@/services/requestServices';
import type { Warehouse } from '@/types/warehouse';
import type { AdminRequest } from '@/services/requestServices';

// Normaliza valores legacy de la BD hacia el nombre de display actual
function normalizeStatus(status: string): string {
    const aliases: Record<string, string> = {
        Anulada: 'Cambios solicitados',
        Entregado: 'Entregada',
    };
    return aliases[status] ?? status;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const normalized = normalizeStatus(status);
    const styles: Record<string, string> = {
        Pendiente:             'bg-yellow-100 text-yellow-700',
        Aprobada:              'bg-blue-100 text-blue-700',
        Entregada:             'bg-green-100 text-green-700',
        'Sin Stock':           'bg-orange-100 text-orange-700',
        'Cambios solicitados': 'bg-red-100 text-red-700',
        Rechazada:             'bg-red-100 text-red-700',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[normalized] ?? 'bg-gray-100 text-gray-600'}`}>
            {normalized}
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

                    {/* Motivo de cambios solicitados */}
                    {(req.status === 'Cambios solicitados' || req.status === 'Anulada') && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Motivo de cambios solicitados</p>
                            <table className="w-full text-sm border border-orange-100 rounded-xl overflow-hidden border-collapse">
                                <tbody>
                                    <tr className="bg-orange-50">
                                        <td className="px-4 py-2.5 text-orange-800">
                                            {req.annulReason
                                                ? req.annulReason
                                                : <span className="text-gray-400">Sin motivo registrado</span>}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

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

// ─── Modal entrega ────────────────────────────────────────────────────────────
interface DeliverModalProps {
    req: AdminRequest;
    onClose: () => void;
    onSuccess: () => void;
}

function SizeRow({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
        <tr>
            <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-2/5 bg-gray-50">{label}</td>
            <td className="px-4 py-2.5 text-gray-800">{value}</td>
        </tr>
    );
}

export function DeliverModal({ req, onClose, onSuccess }: DeliverModalProps) {
    const [annulReason,   setAnnulReason]   = useState('');
    const [expectedDate,  setExpectedDate]  = useState('');
    const [loadingAction, setLoadingAction] = useState<'deliver' | 'nostock' | 'annul' | null>(null);

    const employee    = typeof req.employee === 'object' ? req.employee : null;
    const approver    = typeof req.approver === 'object' ? req.approver : null;
    const sizes       = employee?.sizes;
    const pantSize    = [sizes?.pants?.letter, sizes?.pants?.number].filter(Boolean).join(' / ');
    const hasSizes    = !!(sizes?.footwear || sizes?.gloves || pantSize || sizes?.shirtJacket);

    const eppLabel = (epp: AdminRequest['epps'][number]['epp']): string =>
        epp && typeof epp === 'object' && epp.name ? epp.name : '—';

    // ── Acción: Confirmar entrega con stock ──────────────────────────────────
    const handleDeliver = async () => {
        const result = await Swal.fire({
            icon:              'question',
            title:             '¿Confirmas que hay stock?',
            text:              `Se registrará la entrega de la solicitud #${req.code}.`,
            showCancelButton:  true,
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText:  'Cancelar',
            confirmButtonColor: '#16a34a',
        });
        if (!result.isConfirmed) return;

        setLoadingAction('deliver');
        try {
            await requestServices.deliverRequest(req._id);
            onClose();
            await Swal.fire({ icon: 'success', title: 'Entrega registrada', timer: 1400, showConfirmButton: false });
            onSuccess();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Error', text: msg || 'No se pudo registrar la entrega' });
        } finally {
            setLoadingAction(null);
        }
    };

    // ── Acción: Marcar sin stock ─────────────────────────────────────────────
    const handleNoStock = async () => {
        if (!expectedDate) {
            Swal.fire({ icon: 'warning', title: 'Fecha requerida', text: 'Selecciona la fecha estimada de llegada del stock.' });
            return;
        }
        setLoadingAction('nostock');
        try {
            await requestServices.reportNoStock(req._id, expectedDate);
            onClose();
            await Swal.fire({ icon: 'success', title: 'Notificación enviada', text: 'Se notificó al trabajador por correo.', timer: 1800, showConfirmButton: false });
            onSuccess();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Error', text: msg || 'No se pudo notificar la falta de stock' });
        } finally {
            setLoadingAction(null);
        }
    };

    // ── Acción: Anular solicitud ─────────────────────────────────────────────
    const handleAnnul = async () => {
        if (annulReason.trim().length < 5) {
            Swal.fire({ icon: 'warning', title: 'Motivo requerido', text: 'Ingresa un motivo de anulación (mínimo 5 caracteres).' });
            return;
        }
        setLoadingAction('annul');
        try {
            await requestServices.annulRequest(req._id, annulReason);
            onClose();
            await Swal.fire({ icon: 'success', title: 'Cambios solicitados', timer: 1400, showConfirmButton: false });
            onSuccess();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Error', text: msg || 'No se pudo anular la solicitud' });
        } finally {
            setLoadingAction(null);
        }
    };

    const isLoading = loadingAction !== null;

    // Fecha mínima del date picker: mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-base font-semibold text-gray-900">
                        Registrar Entrega <span className="font-mono">#{req.code}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

                    {/* Información de la solicitud */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Información</p>
                        <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden border-collapse">
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-2/5 bg-gray-50">Trabajador</td>
                                    <td className="px-4 py-2.5 text-gray-800">{employee?.name ?? '—'}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">Aprobado por</td>
                                    <td className="px-4 py-2.5 text-gray-800">{approver?.name ?? '—'}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">Fecha aprobación</td>
                                    <td className="px-4 py-2.5 text-gray-800">
                                        {req.approveDate ? formatDate(req.approveDate) : <span className="text-gray-400">—</span>}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Tallas */}
                    {hasSizes && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tallas del trabajador</p>
                            <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden border-collapse">
                                <tbody className="divide-y divide-gray-100">
                                    <SizeRow label="Calzado"       value={sizes?.footwear} />
                                    <SizeRow label="Guantes"       value={sizes?.gloves} />
                                    <SizeRow label="Pantalón"      value={pantSize || undefined} />
                                    <SizeRow label="Ropa superior" value={sizes?.shirtJacket} />
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* EPPs */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">EPPs solicitados</p>
                        <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">EPP</th>
                                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Cant.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {req.epps.map((e, i) => (
                                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                                        <td className="px-4 py-2.5 text-gray-800">{eppLabel(e.epp)}</td>
                                        <td className="px-4 py-2.5 text-center text-gray-800">{e.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Acción 1: Stock disponible */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            Stock disponible
                        </p>
                        <button
                            onClick={handleDeliver}
                            disabled={isLoading}
                            className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:opacity-85 disabled:opacity-50 transition-opacity cursor-pointer"
                        >
                            {loadingAction === 'deliver' ? 'Registrando…' : 'Confirmar entrega con stock'}
                        </button>
                    </div>

                    {/* Acción 2: Falta stock */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <CalendarClock className="w-3.5 h-3.5 text-primary" />
                            Falta Stock — Notificar al trabajador
                        </p>
                        <input
                            type="date"
                            min={minDate}
                            value={expectedDate}
                            onChange={e => setExpectedDate(e.target.value)}
                            disabled={isLoading}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                        />
                        <button
                            onClick={handleNoStock}
                            disabled={isLoading || !expectedDate}
                            className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:opacity-85 disabled:opacity-40 transition-opacity cursor-pointer"
                        >
                            {loadingAction === 'nostock' ? 'Enviando notificación…' : 'Notificar y marcar Sin Stock'}
                        </button>
                    </div>

                    {/* Acción 3: Solicitar cambios */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Ban className="w-3.5 h-3.5 text-primary" />
                            Solicitar cambios
                        </p>
                        <textarea
                            value={annulReason}
                            onChange={e => setAnnulReason(e.target.value)}
                            disabled={isLoading}
                            placeholder="Motivo de los cambios solicitados…"
                            rows={2}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none
                                       focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                        />
                        <button
                            onClick={handleAnnul}
                            disabled={isLoading || annulReason.trim().length < 5}
                            className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:opacity-85 disabled:opacity-40 transition-opacity cursor-pointer"
                        >
                            {loadingAction === 'annul' ? 'Procesando…' : 'Solicitar cambios'}
                        </button>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Cancelar
                    </button>
                </div>

            </div>
        </div>
    );
}

// ─── Página ───────────────────────────────────────────────────────────────────
function WarehouseDetailPage({ warehouseId }: { warehouseId?: string } = {}) {
    const { id: paramId } = useParams<{ id: string }>();
    const id = warehouseId ?? paramId;
    const navigate = useNavigate();
    const { auth } = useAuth();

    const [warehouse, setWarehouse]               = useState<Warehouse | null>(null);
    const [warehouseLoading, setWarehouseLoading] = useState(true);
    const [selectedRequest, setSelectedRequest]   = useState<AdminRequest | null>(null);
    const [deliverTarget, setDeliverTarget]       = useState<AdminRequest | null>(null);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const isAdmin     = auth?.rol === 'Administrador'       || auth?.role === 'Administrador';
    const isEncargado = auth?.rol === 'Encargado de Bodega' || auth?.role === 'Encargado de Bodega';

    const {
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
    } = useWarehouseRequests(id!);

    const { pendingCount, refresh: refreshPendingCount } = usePendingDeliveryCount(id!);

    // Carga los datos de la bodega — solo cuando cambia el id
    useEffect(() => {
        if (!id) return;
        warehouseServices.getWarehouseById(id)
            .then(setWarehouse)
            .catch(() => setWarehouse(null))
            .finally(() => setWarehouseLoading(false));
    }, [id]);

    // Carga inicial de solicitudes — fetchRequests es estable (no cambia con statusFilter)
    useEffect(() => {
        if (!id) return;
        fetchRequests(1, '');
    }, [id, fetchRequests]);

    // Cerrar dropdown de estado al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
                setStatusDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeliverSuccess = () => {
        fetchRequests(page, inputSearch);
        refreshPendingCount();
    };

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
                    {isAdmin && (
                    <button
                        onClick={() => navigate('/admin/warehouses')}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-3 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Bodegas
                    </button>
                    )}
                    <h1 className="text-xl font-semibold text-gray-900">
                        {warehouseLoading ? '…' : warehouse ? `Bodega: ${warehouse.name}` : 'Bodega no encontrada'}
                    </h1>
                    <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-gray-400">
                            {total} solicitud{total !== 1 ? 'es' : ''}
                        </p>
                        {isEncargado && pendingCount !== null && pendingCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 text-primary border border-orange-200">
                                <PackageOpen className="w-3.5 h-3.5" />
                                {pendingCount} por entregar
                            </span>
                        )}
                    </div>
                </div>

                {/* Buscador + Filtro de estado */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={inputSearch}
                            onChange={e => setInputSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Buscar por código o trabajador…"
                            className="w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                        />
                        {inputSearch && (
                            <button
                                onClick={handleClear}
                                title="Limpiar búsqueda"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400
                                           hover:text-gray-600 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleSearch}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                                   text-white bg-primary rounded-xl hover:opacity-85 transition-opacity"
                    >
                        <Search className="w-4 h-4" />
                        Buscar
                    </button>

                    {/* Dropdown filtro por estado */}
                    <div className="relative" ref={statusDropdownRef}>
                        <button
                            onClick={() => setStatusDropdownOpen(prev => !prev)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-xl border transition-colors
                                ${statusFilter
                                    ? 'border-primary bg-primary/10 text-primary font-medium'
                                    : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                                }`}
                        >
                            {statusFilter || 'Estado'}
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {statusDropdownOpen && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
                                {(['', 'Pendiente', 'Aprobada', 'Sin Stock', 'Entregada'] as RequestStatus[]).map(option => (
                                    <button
                                        key={option || 'todas'}
                                        onClick={() => {
                                            handleStatusChange(option);
                                            setStatusDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                                            ${statusFilter === option
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {option || 'Todas'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
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
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Trabajador</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha de Entrega</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Ver</th>
                                        {(isAdmin || isEncargado) && (
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {requests.map(req => (
                                        <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-gray-600">#{req.code}</td>
                                            <td className="px-4 py-3 text-gray-700">{formatDate(req.date)}</td>
                                            <td className="px-4 py-3 text-gray-700">{employeeName(req.employee)}</td>
                                            <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
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
                                            {isEncargado && (
                                                <td className="px-4 py-3 text-center">
                                                    {(req.status === 'Aprobada' || req.status === 'Sin Stock') && (
                                                        <button
                                                            onClick={() => setDeliverTarget(req)}
                                                            title="Registrar entrega"
                                                            className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                                                        >
                                                            <PackageCheck className="w-4 h-4" />
                                                        </button>
                                                    )}
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

        {/* Modal entrega */}
        {deliverTarget && (
            <DeliverModal
                req={deliverTarget}
                onClose={() => setDeliverTarget(null)}
                onSuccess={handleDeliverSuccess}
            />
        )}
        </>
    );
}

export default WarehouseDetailPage;
