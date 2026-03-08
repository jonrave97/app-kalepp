import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, Pencil, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { useEpps } from '@/hooks/epps/useEpps';
import * as eppServices from '@/services/eppServices';
import * as categoryServices from '@/services/categoryServices';
import type { Epp } from '@/types/epp';
import type { Category } from '@/types/category';

// ─── SearchSelect ─────────────────────────────────────────────────────────────
interface SelectOption { label: string; value: string; }

interface SearchSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

function SearchSelect({ options, value, onChange, placeholder = 'Seleccionar...', disabled }: SearchSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const filtered = query
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    const selectedLabel = options.find(o => o.value === value)?.label ?? '';

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => { setOpen(prev => !prev); setQuery(''); }}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200
                           rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40
                           disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <span className={selectedLabel ? 'text-gray-800' : 'text-gray-400'}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar..."
                            autoFocus
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg
                                       focus:outline-none focus:ring-1 focus:ring-primary/40"
                        />
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-400 text-center">Sin resultados</li>
                        ) : (
                            filtered.map(o => (
                                <li
                                    key={o.value}
                                    onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors
                                                ${o.value === value ? 'text-primary font-medium bg-primary/5' : 'text-gray-700'}`}
                                >
                                    {o.label}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─── Modal crear / editar ─────────────────────────────────────────────────────
interface EppModalProps {
    epp?: Epp | null;
    categories: Pick<Category, '_id' | 'name'>[];
    onClose: () => void;
    onSaved: () => void;
}

function EppModal({ epp, categories, onClose, onSaved }: EppModalProps) {
    const [code,     setCode]     = useState(epp?.code     ?? '');
    const [name,     setName]     = useState(epp?.name     ?? '');
    const [price,    setPrice]    = useState<string>(epp?.price !== undefined ? String(epp.price) : '');
    const [category, setCategory] = useState(epp?.category ?? '');
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');

    const categoryOptions: SelectOption[] = categories.map(c => ({ value: c.name, label: c.name }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim())          { setError('El código es obligatorio');    return; }
        if (!name.trim())          { setError('El nombre es obligatorio');    return; }
        if (price === '' || isNaN(Number(price))) { setError('El precio es obligatorio'); return; }
        if (!category.trim())      { setError('La categoría es obligatoria'); return; }

        try {
            setLoading(true);
            const payload = {
                code:     code.trim().toUpperCase(),
                name:     name.trim(),
                price:    Number(price),
                category: category.trim(),
            };
            if (epp) {
                await eppServices.updateEpp(epp._id, payload);
            } else {
                await eppServices.createEpp(payload);
            }
            await Swal.fire({
                icon: 'success',
                title: epp ? 'EPP actualizado' : 'EPP creado',
                timer: 1600,
                showConfirmButton: false,
            });
            onSaved();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg || 'Error al guardar el EPP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                <h2 className="text-base font-semibold text-gray-900 mb-5">
                    {epp ? 'Editar EPP' : 'Nuevo EPP'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Código */}
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Código
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                            placeholder="Ej: CAS-001"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-primary/40"
                            autoFocus
                        />
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => { setName(e.target.value); setError(''); }}
                            placeholder="Ej: Casco de seguridad"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    {/* Precio */}
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Precio
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={e => { setPrice(e.target.value); setError(''); }}
                            placeholder="0"
                            min="0"
                            step="any"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Categoría
                        </label>
                        <SearchSelect
                            options={categoryOptions}
                            value={category}
                            onChange={v => { setCategory(v); setError(''); }}
                            placeholder="Seleccionar categoría..."
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

// ─── Página principal ─────────────────────────────────────────────────────────
function EppsPage() {
    const {
        epps,
        total,
        totalPages,
        page,
        inputSearch,
        setInputSearch,
        loading,
        fetchEpps,
        handleSearch,
        handlePageChange,
    } = useEpps();

    const [modalOpen,   setModalOpen]   = useState(false);
    const [editTarget,  setEditTarget]  = useState<Epp | null>(null);
    const [categories,  setCategories]  = useState<Pick<Category, '_id' | 'name'>[]>([]);

    useEffect(() => {
        fetchEpps(1, '');
        categoryServices.getAllCategories().then(setCategories).catch(() => {});
    }, [fetchEpps]);

    const openCreate = () => { setEditTarget(null); setModalOpen(true); };
    const openEdit   = (e: Epp) => { setEditTarget(e); setModalOpen(true); };
    const closeModal = () => setModalOpen(false);
    const refresh    = () => fetchEpps(page, inputSearch);

    const handleToggle = async (epp: Epp) => {
        const action = epp.disabled ? 'habilitar' : 'deshabilitar';
        const result = await Swal.fire({
            icon: 'question',
            title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} EPP?`,
            text: `"${epp.name}" quedará ${epp.disabled ? 'habilitado' : 'deshabilitado'}.`,
            showCancelButton: true,
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        try {
            await eppServices.toggleEpp(epp._id);
            refresh();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Error', text: msg || 'No se pudo cambiar el estado' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-4">

                {/* Encabezado */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">EPPs</h1>
                        <p className="text-xs text-gray-400 mt-0.5">{total} registro{total !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                                   text-white bg-primary rounded-xl hover:opacity-85 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo EPP
                    </button>
                </div>

                {/* Buscador */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputSearch}
                        onChange={e => setInputSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar por código, nombre o categoría…"
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
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                    <div className="h-4 bg-gray-200 rounded w-16" />
                                </div>
                            ))}
                        </div>
                    ) : epps.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-gray-400 text-sm">No se encontraron EPPs</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {epps.map(epp => (
                                <li
                                    key={epp._id}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-mono text-gray-400">{epp.code}</span>
                                            <span className={`text-sm font-medium ${epp.disabled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                {epp.name}
                                            </span>
                                            {epp.disabled && (
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                                                    Deshabilitado
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-gray-400">{epp.category}</span>
                                            <span className="text-xs text-gray-500 font-medium">
                                                ${epp.price.toLocaleString('es-CL')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-4 shrink-0">
                                        <button
                                            onClick={() => handleToggle(epp)}
                                            title={epp.disabled ? 'Habilitar' : 'Deshabilitar'}
                                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                        >
                                            {epp.disabled
                                                ? <ToggleLeft className="w-5 h-5" />
                                                : <ToggleRight className="w-5 h-5 text-primary" />}
                                        </button>
                                        <button
                                            onClick={() => openEdit(epp)}
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
                <EppModal
                    epp={editTarget}
                    categories={categories}
                    onClose={closeModal}
                    onSaved={refresh}
                />
            )}
        </div>
    );
}

export default EppsPage;
