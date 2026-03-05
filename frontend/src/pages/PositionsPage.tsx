import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePositions } from '@/hooks/positions/usePositions';
import * as positionServices from '@/services/positionServices';
import type { Position } from '@/types/position';

// ─── Modal crear / editar ────────────────────────────────────────────────────
interface PositionModalProps {
    position?: Position | null;
    onClose: () => void;
    onSaved: () => void;
}

function PositionModal({ position, onClose, onSaved }: PositionModalProps) {
    const [name, setName] = useState(position?.name ?? '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError('El nombre es obligatorio'); return; }
        try {
            setLoading(true);
            if (position) {
                await positionServices.updatePosition(position._id, name.trim());
            } else {
                await positionServices.createPosition(name.trim());
            }
            await Swal.fire({
                icon: 'success',
                title: position ? 'Cargo actualizado' : 'Cargo creado',
                timer: 1600,
                showConfirmButton: false,
            });
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al guardar el cargo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                <h2 className="text-base font-semibold text-gray-900 mb-5">
                    {position ? 'Editar cargo' : 'Nuevo cargo'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => { setName(e.target.value); setError(''); }}
                            placeholder="Ej: Operador de planta"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-primary/40"
                            autoFocus
                        />
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
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
function PositionsPage() {
    const {
        positions,
        total,
        totalPages,
        page,
        inputSearch,
        setInputSearch,
        loading,
        fetchPositions,
        handleSearch,
        handlePageChange,
    } = usePositions();

    const [modalOpen, setModalOpen]       = useState(false);
    const [editTarget, setEditTarget]     = useState<Position | null>(null);

    // Carga inicial
    useEffect(() => {
        fetchPositions(1, '');
    }, [fetchPositions]);

    const openCreate = () => { setEditTarget(null); setModalOpen(true); };
    const openEdit   = (p: Position) => { setEditTarget(p); setModalOpen(true); };
    const closeModal = () => setModalOpen(false);
    const refresh    = () => fetchPositions(page, inputSearch);

    const handleDelete = async (position: Position) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar cargo?',
            text: `Se eliminará "${position.name}" de forma permanente.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#e3342f',
        });
        if (!result.isConfirmed) return;
        try {
            await positionServices.deletePosition(position._id);
            await Swal.fire({ icon: 'success', title: 'Cargo eliminado', timer: 1400, showConfirmButton: false });
            refresh();
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo eliminar' });
        }
    };

    const handleToggle = async (position: Position) => {
        const action = position.disabled ? 'habilitar' : 'deshabilitar';
        const result = await Swal.fire({
            icon: 'question',
            title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} cargo?`,
            text: `"${position.name}" quedará ${position.disabled ? 'habilitado' : 'deshabilitado'}.`,
            showCancelButton: true,
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        try {
            await positionServices.togglePosition(position._id);
            refresh();
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo cambiar el estado' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-4">

                {/* Encabezado */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Cargos</h1>
                        <p className="text-xs text-gray-400 mt-0.5">{total} registro{total !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                                   text-white bg-primary rounded-xl hover:opacity-85 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo cargo
                    </button>
                </div>

                {/* Buscador */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputSearch}
                        onChange={e => setInputSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar por nombre…"
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

                {/* Tabla / Lista */}
                <div className="bg-white rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="animate-pulse divide-y divide-gray-100">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="px-6 py-4 flex justify-between items-center">
                                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                                    <div className="h-4 bg-gray-200 rounded w-16" />
                                </div>
                            ))}
                        </div>
                    ) : positions.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-gray-400 text-sm">No se encontraron cargos</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {positions.map(position => (
                                <li
                                    key={position._id}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-medium ${position.disabled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {position.name}
                                        </span>
                                        {position.disabled && (
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                                                Deshabilitado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleToggle(position)}
                                            title={position.disabled ? 'Habilitar' : 'Deshabilitar'}
                                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                        >
                                            {position.disabled
                                                ? <ToggleLeft className="w-5 h-5" />
                                                : <ToggleRight className="w-5 h-5 text-primary" />}
                                        </button>
                                        <button
                                            onClick={() => openEdit(position)}
                                            title="Editar"
                                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(position)}
                                            title="Eliminar"
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
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
                <PositionModal
                    position={editTarget}
                    onClose={closeModal}
                    onSaved={refresh}
                />
            )}
        </div>
    );
}

export default PositionsPage;
