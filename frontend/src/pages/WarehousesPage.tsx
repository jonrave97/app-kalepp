import { useEffect, useState } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useWarehouses } from '@/hooks/warehouses/useWarehouses';
import * as warehouseServices from '@/services/warehouseServices';
import type { Warehouse } from '@/types/warehouse';

// ─── Modal crear / editar ────────────────────────────────────────────────────
interface WarehouseModalProps {
    warehouse?: Warehouse | null;
    onClose: () => void;
    onSaved: () => void;
}

function WarehouseModal({ warehouse, onClose, onSaved }: WarehouseModalProps) {
    const [code,    setCode]    = useState(warehouse?.code ?? '');
    const [name,    setName]    = useState(warehouse?.name ?? '');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) { setError('El código es obligatorio');  return; }
        if (!name.trim()) { setError('El nombre es obligatorio'); return; }

        try {
            setLoading(true);
            const data = { code: code.trim().toUpperCase(), name: name.trim() };
            if (warehouse) {
                await warehouseServices.updateWarehouse(warehouse._id, data);
            } else {
                await warehouseServices.createWarehouse(data);
            }
            await Swal.fire({
                icon: 'success',
                title: warehouse ? 'Bodega actualizada' : 'Bodega creada',
                timer: 1600,
                showConfirmButton: false,
            });
            onSaved();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg || 'Error al guardar la bodega');
        } finally {
            setLoading(false);
        }
    };

    const labelClass = 'text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5';
    const inputClass  = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                <h2 className="text-base font-semibold text-gray-900 mb-5">
                    {warehouse ? 'Editar bodega' : 'Nueva bodega'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Code */}
                    <div>
                        <label className={labelClass}>Código *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                            placeholder="Ej: CL_01_033"
                            className={inputClass}
                            autoFocus
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label className={labelClass}>Nombre *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => { setName(e.target.value); setError(''); }}
                            placeholder="Ej: Antucoya"
                            className={inputClass}
                        />
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-40"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl
                                       hover:opacity-85 transition-opacity disabled:opacity-40"
                        >
                            {loading ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Página principal ────────────────────────────────────────────────────────
function WarehousesPage() {
    const navigate = useNavigate();
    const {
        warehouses,
        total,
        totalPages,
        page,
        inputSearch,
        setInputSearch,
        loading,
        fetchWarehouses,
        handleSearch,
        handlePageChange,
    } = useWarehouses();

    const [modalOpen,  setModalOpen]  = useState(false);
    const [editTarget, setEditTarget] = useState<Warehouse | null>(null);

    // Carga inicial
    useEffect(() => {
        fetchWarehouses(1, '');
    }, [fetchWarehouses]);

    const openCreate = () => { setEditTarget(null); setModalOpen(true); };
    const openEdit   = (w: Warehouse) => { setEditTarget(w); setModalOpen(true); };
    const closeModal = () => setModalOpen(false);
    const refresh    = () => fetchWarehouses(page, inputSearch);

    const handleToggle = async (warehouse: Warehouse) => {
        const action = warehouse.disabled ? 'habilitar' : 'deshabilitar';
        const result = await Swal.fire({
            icon: 'question',
            title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} bodega?`,
            text: `"${warehouse.name}" quedará ${warehouse.disabled ? 'habilitada' : 'deshabilitada'}.`,
            showCancelButton: true,
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        try {
            await warehouseServices.toggleWarehouse(warehouse._id);
            refresh();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Error', text: msg || 'No se pudo cambiar el estado' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-4">

                {/* Encabezado */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Bodegas</h1>
                        <p className="text-xs text-gray-400 mt-0.5">{total} registro{total !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                                   text-white bg-primary rounded-xl hover:opacity-85 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva bodega
                    </button>
                </div>

                {/* Buscador */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputSearch}
                        onChange={e => setInputSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar por código o nombre…"
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

                {/* Lista */}
                <div className="bg-white rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="animate-pulse divide-y divide-gray-100">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="px-6 py-4 flex justify-between items-center">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-36" />
                                        <div className="h-3 bg-gray-200 rounded w-24" />
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded w-16" />
                                </div>
                            ))}
                        </div>
                    ) : warehouses.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-gray-400 text-sm">No se encontraron bodegas</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {warehouses.map(warehouse => (
                                <li
                                    key={warehouse._id}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-mono text-gray-400">{warehouse.code}</span>
                                            <span className={`text-sm font-medium ${warehouse.disabled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                {warehouse.name}
                                            </span>
                                            {warehouse.disabled && (
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                                                    Deshabilitada
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => navigate(`/admin/warehouse/${warehouse._id}`)}
                                            title="Ver solicitudes"
                                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggle(warehouse)}
                                            title={warehouse.disabled ? 'Habilitar' : 'Deshabilitar'}
                                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                        >
                                            {warehouse.disabled
                                                ? <ToggleLeft className="w-5 h-5" />
                                                : <ToggleRight className="w-5 h-5 text-primary" />}
                                        </button>
                                        <button
                                            onClick={() => openEdit(warehouse)}
                                            title="Editar"
                                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
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

            {/* Modal */}
            {modalOpen && (
                <WarehouseModal
                    warehouse={editTarget}
                    onClose={closeModal}
                    onSaved={refresh}
                />
            )}
        </div>
    );
}

export default WarehousesPage;
