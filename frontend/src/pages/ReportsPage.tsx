import { useState, useEffect } from 'react';
import { FileSpreadsheet, Users, ClipboardList, Download, Calendar, Filter } from 'lucide-react';
import Swal from 'sweetalert2';
import { downloadUsersReport, downloadRequestsReport } from '@/services/reportServices';
import { getAllWarehouses } from '@/services/warehouseServices';

// ─── Constantes ───────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
    'Todos',
    'Pendiente',
    'Aprobada',
    'Rechazada',
    'Entregada',
    'Sin Stock',
    'Cambios solicitados',
];

// ─── Componente de tarjeta de reporte ─────────────────────────────────────────
interface ReportCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    children?: React.ReactNode;
    onDownload: () => void;
    loading: boolean;
}

function ReportCard({ icon, title, description, children, onDownload, loading }: ReportCardProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    {icon}
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                </div>
            </div>

            {children && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                    {children}
                </div>
            )}

            <button
                onClick={onDownload}
                disabled={loading}
                className="mt-auto flex items-center justify-center gap-2 w-full px-4 py-2.5
                           text-sm font-medium text-white bg-primary rounded-xl
                           hover:opacity-85 transition-opacity disabled:opacity-40"
            >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Generando…
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        Descargar Excel
                    </>
                )}
            </button>
        </div>
    );
}

// ─── Página ────────────────────────────────────────────────────────────────────
function ReportsPage() {
    // ─ Estado reporte usuarios ─
    const [usersLoading, setUsersLoading] = useState(false);

    // ─ Estado reporte solicitudes ─
    const [reqLoading,    setReqLoading]   = useState(false);
    const [reqFrom,       setReqFrom]      = useState('');
    const [reqTo,         setReqTo]        = useState('');
    const [reqStatus,     setReqStatus]    = useState('Todos');
    const [reqWarehouse,  setReqWarehouse] = useState('');
    const [warehouses,    setWarehouses]   = useState<{ _id: string; code: string; name: string }[]>([]);

    useEffect(() => {
        getAllWarehouses()
            .then(setWarehouses)
            .catch(() => { /* silenciar error */ });
    }, []);

    // ─ Helpers ─
    const showError = (msg: string) =>
        Swal.fire({ icon: 'error', title: 'Error', text: msg });

    // ─ Handlers ─
    const handleUsersReport = async () => {
        try {
            setUsersLoading(true);
            const meta = await downloadUsersReport();
            if (meta.truncated) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Reporte parcial',
                    html: `Se encontraron <strong>${meta.total.toLocaleString('es-CL')}</strong> usuarios.<br>
                           El archivo contiene los <strong>${meta.limit.toLocaleString('es-CL')} más recientemente creados</strong>.`,
                    confirmButtonColor: '#DD6B20',
                    confirmButtonText: 'Entendido',
                });
            } else {
                await Swal.fire({
                    icon: 'success',
                    title: 'Reporte generado',
                    text: `El archivo Excel contiene ${meta.total.toLocaleString('es-CL')} usuarios.`,
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;
            showError(msg || 'No se pudo generar el reporte de usuarios');
        } finally {
            setUsersLoading(false);
        }
    };

    const handleRequestsReport = async () => {
        if (reqFrom && reqTo && new Date(reqFrom) > new Date(reqTo)) {
            showError('La fecha de inicio no puede ser mayor a la fecha de fin');
            return;
        }
        try {
            setReqLoading(true);
            const meta = await downloadRequestsReport({
                from:      reqFrom      || undefined,
                to:        reqTo        || undefined,
                status:    reqStatus !== 'Todos' ? reqStatus : undefined,
                warehouse: reqWarehouse || undefined,
            });
            if (meta.truncated) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Reporte parcial',
                    html: `Se encontraron <strong>${meta.total.toLocaleString('es-CL')}</strong> solicitudes.<br>
                           El archivo contiene las <strong>${meta.limit.toLocaleString('es-CL')} más recientes</strong>.<br>
                           <span style="font-size:0.85em;color:#6b7280">Usa los filtros de fecha para acotar el resultado.</span>`,
                    confirmButtonColor: '#DD6B20',
                    confirmButtonText: 'Entendido',
                });
            } else {
                await Swal.fire({
                    icon: 'success',
                    title: 'Reporte generado',
                    text: `El archivo Excel contiene ${meta.total.toLocaleString('es-CL')} solicitudes.`,
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;
            showError(msg || 'No se pudo generar el reporte de solicitudes');
        } finally {
            setReqLoading(false);
        }
    };

    // ─ Clases reutilizables ─
    const labelClass = 'text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1';
    const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Encabezado */}
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                        Reportes
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Descarga los datos del sistema en formato Excel (.xlsx)
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* ── Tarjeta Usuarios ── */}
                    <ReportCard
                        icon={<Users className="w-5 h-5" />}
                        title="Reporte de Usuarios"
                        description="Exporta el listado completo de usuarios con nombre, correo, rol, cargo, empresa y estado."
                        onDownload={handleUsersReport}
                        loading={usersLoading}
                    />

                    {/* ── Tarjeta Solicitudes ── */}
                    <ReportCard
                        icon={<ClipboardList className="w-5 h-5" />}
                        title="Reporte de Solicitudes EPP"
                        description="Exporta las solicitudes con filtros opcionales de fechas, estado y bodega."
                        onDownload={handleRequestsReport}
                        loading={reqLoading}
                    >
                        {/* Filtros */}
                        <div className="grid grid-cols-2 gap-3">

                            {/* Desde */}
                            <div>
                                <label className={labelClass}>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Desde
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    value={reqFrom}
                                    onChange={e => setReqFrom(e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            {/* Hasta */}
                            <div>
                                <label className={labelClass}>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Hasta
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    value={reqTo}
                                    onChange={e => setReqTo(e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            {/* Estado */}
                            <div>
                                <label className={labelClass}>
                                    <span className="flex items-center gap-1">
                                        <Filter className="w-3 h-3" /> Estado
                                    </span>
                                </label>
                                <select
                                    value={reqStatus}
                                    onChange={e => setReqStatus(e.target.value)}
                                    className={`${inputClass} cursor-pointer`}
                                >
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Bodega */}
                            <div>
                                <label className={labelClass}>
                                    <span className="flex items-center gap-1">
                                        <Filter className="w-3 h-3" /> Bodega
                                    </span>
                                </label>
                                <select
                                    value={reqWarehouse}
                                    onChange={e => setReqWarehouse(e.target.value)}
                                    className={`${inputClass} cursor-pointer`}
                                >
                                    <option value="">Todas</option>
                                    {warehouses.map(w => (
                                        <option key={w._id} value={w._id}>
                                            {w.code} — {w.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                        </div>
                    </ReportCard>

                </div>
            </div>
        </div>
    );
}

export default ReportsPage;

