import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Search, Pencil, X, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';
import { useKits } from '@/hooks/kits/useKits';
import * as kitServices from '@/services/kitServices';
import { getAllEpps } from '@/services/eppServices';
import type { Kit } from '@/types/kit';
import type { Epp } from '@/types/epp';

// ─── SearchSelect (same pattern as NewRequest) ────────────────────────────────
interface SelectOption { label: string; value: string; }
function SearchSelect({ options, value, onChange, placeholder = 'Seleccionar...', disabled }: {
    options: SelectOption[]; value: string; onChange: (v: string) => void;
    placeholder?: string; disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const filtered = query ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())) : options;
    const selectedLabel = options.find(o => o.value === value)?.label ?? '';

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button type="button" disabled={disabled}
                onClick={() => { setOpen(p => !p); setQuery(''); }}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200
                           rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40
                           disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <span className={selectedLabel ? 'text-gray-800' : 'text-gray-400'}>{selectedLabel || placeholder}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar..." autoFocus
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg
                                       focus:outline-none focus:ring-1 focus:ring-primary/40" />
                    </div>
                    <ul className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-400 text-center">Sin resultados</li>
                        ) : filtered.map(o => (
                            <li key={o.value} onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors
                                            ${o.value === value ? 'text-primary font-medium bg-primary/5' : 'text-gray-700'}`}>
                                {o.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─── Kit Modal (create / edit) ────────────────────────────────────────────────
interface KitModalProps {
    kit?: Kit | null;
    onClose: () => void;
    onSaved: () => void;
}

interface CartItem { eppId: string; eppName: string; eppCode: string; quantity: number; }

function KitModal({ kit, onClose, onSaved }: KitModalProps) {
    const [name,        setName]        = useState(kit?.name ?? '');
    const [description, setDescription] = useState(kit?.description ?? '');
    const [eppCart,     setEppCart]     = useState<CartItem[]>(() => {
        if (!kit) return [];
        return kit.epps
            .map(ke => {
                if (typeof ke.epp === 'string') return null;
                const e = ke.epp as { _id: string; name: string; code?: string };
                return { eppId: e._id, eppName: e.name, eppCode: e.code ?? '', quantity: ke.quantity };
            })
            .filter((x): x is CartItem => x !== null);
    });

    const [allEpps,      setAllEpps]      = useState<Pick<Epp, '_id' | 'code' | 'name'>[]>([]);
    const [loadingEpps,  setLoadingEpps]  = useState(false);
    const [selectedEpp,  setSelectedEpp]  = useState('');
    const [eppQty,       setEppQty]       = useState(1);
    const [error,        setError]        = useState('');
    const [loading,      setLoading]      = useState(false);

    useEffect(() => {
        setLoadingEpps(true);
        getAllEpps()
            .then(data => setAllEpps(data))
            .finally(() => setLoadingEpps(false));
    }, []);

    const addEpp = () => {
        if (!selectedEpp || eppQty < 1) return;
        const info = allEpps.find(e => e._id === selectedEpp);
        if (!info) return;
        setEppCart(prev => {
            const existing = prev.find(c => c.eppId === selectedEpp);
            if (existing) return prev.map(c => c.eppId === selectedEpp ? { ...c, quantity: eppQty } : c);
            return [...prev, { eppId: selectedEpp, eppName: info.name, eppCode: info.code, quantity: eppQty }];
        });
        setSelectedEpp('');
        setEppQty(1);
    };

    const removeEpp = (eppId: string) => setEppCart(prev => prev.filter(c => c.eppId !== eppId));

    const updateQty = (eppId: string, qty: number) => {
        if (qty < 1) return;
        setEppCart(prev => prev.map(c => c.eppId === eppId ? { ...c, quantity: qty } : c));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError('El nombre es obligatorio'); return; }
        try {
            setLoading(true);
            const payload = {
                name:        name.trim(),
                description: description.trim(),
                epps:        eppCart.map(c => ({ epp: c.eppId, quantity: c.quantity })),
            };
            if (kit) {
                await kitServices.updateKit(kit._id, payload);
            } else {
                await kitServices.createKit(payload);
            }
            await Swal.fire({ icon: 'success', title: kit ? 'Kit actualizado' : 'Kit creado', timer: 1600, showConfirmButton: false });
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al guardar el kit');
        } finally {
            setLoading(false);
        }
    };

    const eppOptions: SelectOption[] = allEpps
        .filter(e => !eppCart.some(c => c.eppId === e._id))
        .map(e => ({ value: e._id, label: e.name }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-semibold text-gray-900">{kit ? 'Editar kit' : 'Nuevo kit'}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                        {/* Nombre */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Nombre</label>
                            <input type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                                placeholder="Ej: Kit Inicial Operaciones"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                           focus:outline-none focus:ring-2 focus:ring-primary/40" autoFocus />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Descripción</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Descripción opcional del kit…" rows={2}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none
                                           focus:outline-none focus:ring-2 focus:ring-primary/40" />
                        </div>

                        {/* Agregar EPPs */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">EPPs del kit</label>
                            {loadingEpps ? (
                                <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                            ) : (
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <SearchSelect options={eppOptions} value={selectedEpp}
                                            onChange={setSelectedEpp} placeholder="Buscar EPP..." />
                                    </div>
                                    <div className="w-20">
                                        <input type="number" min={1} value={eppQty}
                                            onChange={e => setEppQty(Math.max(1, Number(e.target.value)))}
                                            className="w-full px-2 py-2.5 border border-gray-200 rounded-xl text-sm
                                                       focus:outline-none focus:ring-2 focus:ring-primary/40 text-center" />
                                    </div>
                                    <button type="button" onClick={addEpp} disabled={!selectedEpp}
                                        className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium
                                                   text-white bg-primary rounded-xl hover:opacity-85 transition-opacity
                                                   disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* EPP list */}
                            {eppCart.length > 0 ? (
                                <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">EPP</th>
                                                <th className="text-center px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Cant.</th>
                                                <th className="px-4 py-2 w-10" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {eppCart.map(item => (
                                                <tr key={item.eppId} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2.5 text-gray-800">{item.eppName}</td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <input type="number" min={1} value={item.quantity}
                                                            onChange={e => updateQty(item.eppId, Math.max(1, Number(e.target.value)))}
                                                            className="w-14 text-center px-2 py-1 border border-gray-200 rounded-lg text-sm
                                                                       focus:outline-none focus:ring-1 focus:ring-primary/40" />
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <button type="button" onClick={() => removeEpp(item.eppId)}
                                                            className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="mt-3 flex items-center justify-center py-5 border border-dashed border-gray-200 rounded-xl text-gray-300 text-sm">
                                    Sin EPPs agregados
                                </div>
                            )}
                        </div>

                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button type="button" onClick={onClose} disabled={loading}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-40">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl
                                       hover:opacity-85 transition-opacity disabled:opacity-40">
                            {loading ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────
function KitsPage() {
    const {
        kits, total, totalPages, page,
        inputSearch, setInputSearch, loading,
        fetchKits, handleSearch, handlePageChange,
    } = useKits();

    const [modalOpen,  setModalOpen]  = useState(false);
    const [editTarget, setEditTarget] = useState<Kit | null>(null);

    useEffect(() => { fetchKits(1, ''); }, [fetchKits]);

    const openCreate = () => { setEditTarget(null); setModalOpen(true); };
    const openEdit   = (k: Kit) => { setEditTarget(k); setModalOpen(true); };
    const closeModal = () => setModalOpen(false);
    const refresh    = () => fetchKits(page, inputSearch);

    const handleDelete = async (kit: Kit) => {
        const result = await Swal.fire({
            icon: 'warning', title: '¿Eliminar kit?',
            text: `Se eliminará "${kit.name}" de forma permanente.`,
            showCancelButton: true, confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar', confirmButtonColor: '#e3342f',
        });
        if (!result.isConfirmed) return;
        try {
            await kitServices.deleteKit(kit._id);
            await Swal.fire({ icon: 'success', title: 'Kit eliminado', timer: 1400, showConfirmButton: false });
            refresh();
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo eliminar' });
        }
    };

    const handleToggle = async (kit: Kit) => {
        const action = kit.active ? 'deshabilitar' : 'habilitar';
        const result = await Swal.fire({
            icon: 'question',
            title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} kit?`,
            text: `"${kit.name}" quedará ${kit.active ? 'deshabilitado' : 'habilitado'}.`,
            showCancelButton: true, confirmButtonText: `Sí, ${action}`, cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        try {
            await kitServices.toggleKit(kit._id);
            refresh();
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo cambiar el estado' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-4">

                {/* Encabezado */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Kits de EPP</h1>
                        <p className="text-xs text-gray-400 mt-0.5">{total} registro{total !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={openCreate}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                                   text-white bg-primary rounded-xl hover:opacity-85 transition-opacity">
                        <Plus className="w-4 h-4" />
                        Nuevo kit
                    </button>
                </div>

                {/* Buscador */}
                <div className="flex gap-2">
                    <input type="text" value={inputSearch}
                        onChange={e => setInputSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar por nombre…"
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                   focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white" />
                    <button onClick={handleSearch}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                                   text-white bg-primary rounded-xl hover:opacity-85 transition-opacity">
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
                                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                                    <div className="h-4 bg-gray-200 rounded w-16" />
                                </div>
                            ))}
                        </div>
                    ) : kits.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-gray-400 text-sm">No se encontraron kits</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Descripción</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">EPPs</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {kits.map(kit => (
                                    <tr key={kit._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`font-medium ${!kit.active ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                {kit.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 hidden sm:table-cell text-xs max-w-xs truncate">
                                            {kit.description || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600">{kit.epps.length}</td>
                                        <td className="px-6 py-4 text-center">
                                            {kit.active ? (
                                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Activo</span>
                                            ) : (
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full font-medium">Inactivo</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleToggle(kit)} title={kit.active ? 'Deshabilitar' : 'Habilitar'}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors">
                                                    {kit.active ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                                                </button>
                                                <button onClick={() => openEdit(kit)} title="Editar"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(kit)} title="Eliminar"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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
                        <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1}
                            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl
                                       hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            Anterior
                        </button>
                        <span className="text-xs text-gray-400">Página {page} de {totalPages}</span>
                        <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}
                            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl
                                       hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {modalOpen && (
                <KitModal kit={editTarget} onClose={closeModal} onSaved={refresh} />
            )}
        </div>
    );
}

export default KitsPage;
