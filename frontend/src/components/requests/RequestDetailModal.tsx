import { X } from 'lucide-react';
import type { AdminRequest } from '@/services/requestServices';
import { normalizeStatus, formatDate, employeeName } from './requestHelpers';

export function StatusBadge({ status }: { status: string }) {
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

export function StockBadge({ stock }: { stock?: string }) {
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

// ─── Modal detalle + seguimiento ─────────────────────────────────────────────
interface Props {
    req: AdminRequest;
    onClose: () => void;
}

export function RequestDetailModal({ req, onClose }: Props) {
    function approverName(a: AdminRequest['approver']): string {
        if (!a) return '';
        if (typeof a === 'object' && a.name) return a.name;
        return '';
    }

    function eppLabel(epp: AdminRequest['epps'][number]['epp']): string {
        if (epp && typeof epp === 'object' && epp.name) return epp.name;
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


