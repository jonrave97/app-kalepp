import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, Search, ChevronDown, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { useUsers } from '@/hooks/users/useUsers';
import * as userAdminServices from '@/services/userAdminServices';
import { getAllPositions } from '@/services/positionServices';
import { getAllWarehouses } from '@/services/warehouseServices';
import type { User } from '@/types/user';

// ─── Constantes de opciones estáticas ────────────────────────────────────────────
const ROL_OPTIONS = ['Trabajador', 'Jefatura', 'Encargado de Bodega', 'Administrador'];
const COMPANY_OPTIONS = ['Kal Tire', 'Kal Tire Recycling'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string; }

const getPositionId = (position: User['position']): string => {
    if (!position) return '';
    if (typeof position === 'object' && '_id' in position) return position._id;
    return '';
};

const getBossIds = (bosses: User['bosses']): string[] => {
    if (!bosses) return [];
    return bosses.map(b => {
        if (typeof b._id === 'string') return b._id;
        return (b._id as { _id: string })._id;
    }).filter(Boolean);
};

const getPositionName = (position: User['position']): string => {
    if (!position) return '';
    if (typeof position === 'object' && 'name' in position) return position.name;
    if (typeof position === 'string') return position;
    return '';
};

// ─── SearchSelect (select simple con buscador local) ─────────────────────────
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

// ─── MultiSearchSelect (select múltiple con buscador local) ──────────────────
interface MultiSearchSelectProps {
    options: SelectOption[];
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
}

function MultiSearchSelect({ options, values, onChange, placeholder = 'Seleccionar...' }: MultiSearchSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const filtered = query
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

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

    const toggle = (val: string) => {
        onChange(values.includes(val) ? values.filter(v => v !== val) : [...values, val]);
    };

    return (
        <div className="relative" ref={ref}>
            <div
                onClick={() => { setOpen(prev => !prev); setQuery(''); }}
                className="w-full min-h-10.5 flex flex-wrap items-center gap-1.5 px-3 py-2 border
                           border-gray-200 rounded-xl text-sm bg-white cursor-pointer"
            >
                {values.length === 0 ? (
                    <span className="text-gray-400">{placeholder}</span>
                ) : (
                    values.map(v => {
                        const label = options.find(o => o.value === v)?.label;
                        return label ? (
                            <span key={v} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                {label}
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); onChange(values.filter(x => x !== v)); }}
                                    className="hover:text-red-500 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ) : null;
                    })
                )}
                <ChevronDown className={`ml-auto w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
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
                                    onClick={() => toggle(o.value)}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center
                                                justify-between transition-colors
                                                ${values.includes(o.value) ? 'text-primary font-medium' : 'text-gray-700'}`}
                                >
                                    {o.label}
                                    {values.includes(o.value) && (
                                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─── Modal crear / editar ────────────────────────────────────────────────────
interface UserModalProps {
    user?: User | null;
    onClose: () => void;
    onSaved: () => void;
}

function UserModal({ user, onClose, onSaved }: UserModalProps) {
    const [name,       setName]       = useState(user?.name ?? '');
    const [email,      setEmail]      = useState(user?.email ?? '');
    const [password,   setPassword]   = useState('');
    const [rol,        setRol]        = useState(user?.rol ?? '');
    const [position,   setPosition]   = useState<string>(() => getPositionId(user?.position));
    const [company,    setCompany]    = useState(user?.company ?? '');
    const [area,       setArea]       = useState(user?.area ?? '');
    const [warehouses, setWarehouses] = useState(user?.warehouses ?? '');
    const [bosses,     setBosses]     = useState<string[]>(() => getBossIds(user?.bosses));

    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState('');
    const [positionOpts,  setPositionOpts]  = useState<SelectOption[]>([]);
    const [warehouseOpts, setWarehouseOpts] = useState<SelectOption[]>([]);
    const [userOpts,      setUserOpts]      = useState<SelectOption[]>([]);
    const [selectsLoading, setSelectsLoading] = useState(true);

    // Cargar datos de selects una única vez al montar el modal
    useEffect(() => {
        const load = async () => {
            try {
                const [positions, users, wh] = await Promise.all([
                    getAllPositions(),
                    userAdminServices.getAllUsersMin(),
                    getAllWarehouses(),
                ]);
                setPositionOpts(positions.map(p => ({ value: p._id, label: p.name })));
                setUserOpts(
                    users
                        .filter(u => u._id !== user?._id)
                        .map(u => ({ value: u._id, label: `${u.name} (${u.email})` }))
                );
                setWarehouseOpts(wh.map(w => ({ value: w._id, label: `${w.code} — ${w.name}` })));
            } finally {
                setSelectsLoading(false);
            }
        };
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim())  { setError('El nombre es obligatorio'); return; }
        if (!email.trim()) { setError('El correo es obligatorio'); return; }
        if (!user && !password) { setError('La contraseña es obligatoria'); return; }
        if (!rol) { setError('El rol es obligatorio'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) { setError('Formato de correo inválido'); return; }

        try {
            setLoading(true);
            const data: userAdminServices.UserFormData = {
                name:       name.trim().toLowerCase(),
                email:      email.trim().toLowerCase(),
                rol,
                ...(password    && { password }),
                ...(position    && { position }),
                ...(company     && { company }),
                ...(area.trim() && { area: area.trim() }),
                ...(warehouses  && { warehouses }),
                bosses,
            };
            if (user) {
                await userAdminServices.updateUser(user._id, data);
            } else {
                await userAdminServices.createUser(data);
            }
            await Swal.fire({
                icon: 'success',
                title: user ? 'Usuario actualizado' : 'Usuario creado',
                timer: 1600,
                showConfirmButton: false,
            });
            onSaved();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg || 'Error al guardar el usuario');
        } finally {
            setLoading(false);
        }
    };

    const labelClass = 'text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5';
    const inputClass  = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-base font-semibold text-gray-900 mb-5">
                    {user ? 'Editar usuario' : 'Nuevo usuario'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Nombre */}
                        <div>
                            <label className={labelClass}>Nombre *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => { setName(e.target.value.toLowerCase()); setError(''); }}
                                placeholder="Ej: juan pérez"
                                className={inputClass}
                                autoFocus
                            />
                        </div>

                        {/* Correo */}
                        <div>
                            <label className={labelClass}>Correo *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value.toLowerCase()); setError(''); }}
                                placeholder="usuario@empresa.com"
                                className={inputClass}
                            />
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className={labelClass}>
                                {user ? 'Contraseña (vacío = sin cambios)' : 'Contraseña *'}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError(''); }}
                                placeholder="Mínimo 8 caracteres"
                                className={inputClass}
                            />
                        </div>

                        {/* Rol */}
                        <div>
                            <label className={labelClass}>Rol *</label>
                            <SearchSelect
                                options={ROL_OPTIONS.map(r => ({ value: r, label: r }))}
                                value={rol}
                                onChange={v => { setRol(v); setError(''); }}
                                placeholder="Seleccionar rol"
                            />
                        </div>

                        {/* Cargo */}
                        <div>
                            <label className={labelClass}>Cargo</label>
                            <SearchSelect
                                options={positionOpts}
                                value={position}
                                onChange={setPosition}
                                placeholder="Seleccionar cargo"
                                disabled={selectsLoading}
                            />
                        </div>

                        {/* Empresa */}
                        <div>
                            <label className={labelClass}>Empresa</label>
                            <select
                                value={company}
                                onChange={e => setCompany(e.target.value)}
                                className={`${inputClass} bg-white`}
                            >
                                <option value="">Seleccionar empresa</option>
                                {COMPANY_OPTIONS.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Área */}
                        <div>
                            <label className={labelClass}>Área</label>
                            <input
                                type="text"
                                value={area}
                                onChange={e => setArea(e.target.value)}
                                placeholder="Ej: Operaciones"
                                className={inputClass}
                            />
                        </div>

                        {/* Bodega */}
                        <div>
                            <label className={labelClass}>Bodega</label>
                            <SearchSelect
                                options={warehouseOpts}
                                value={warehouses}
                                onChange={setWarehouses}
                                placeholder="Seleccionar bodega"
                                disabled={selectsLoading}
                            />
                        </div>

                    </div>

                    {/* Jefes — ancho completo */}
                    <div>
                        <label className={labelClass}>Jefes</label>
                        <MultiSearchSelect
                            options={userOpts}
                            values={bosses}
                            onChange={setBosses}
                            placeholder="Seleccionar jefes"
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
function UsersPage() {
    const {
        users,
        total,
        totalPages,
        page,
        inputSearch,
        setInputSearch,
        loading,
        fetchUsers,
        handleSearch,
        handlePageChange,
    } = useUsers();

    const [modalOpen,  setModalOpen]  = useState(false);
    const [editTarget, setEditTarget] = useState<User | null>(null);

    // Carga inicial
    useEffect(() => {
        fetchUsers(1, '');
    }, [fetchUsers]);

    const openCreate = () => { setEditTarget(null); setModalOpen(true); };
    const openEdit   = (u: User) => { setEditTarget(u); setModalOpen(true); };
    const closeModal = () => setModalOpen(false);
    const refresh    = () => fetchUsers(page, inputSearch);

    const handleToggle = async (u: User) => {
        const action = u.disabled ? 'habilitar' : 'deshabilitar';
        const result = await Swal.fire({
            icon: 'question',
            title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} usuario?`,
            text: `"${u.name}" quedará ${u.disabled ? 'habilitado' : 'deshabilitado'}.`,
            showCancelButton: true,
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;
        try {
            await userAdminServices.toggleUser(u._id);
            refresh();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Error', text: msg || 'No se pudo cambiar el estado' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-4">

                {/* Encabezado */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
                        <p className="text-xs text-gray-400 mt-0.5">{total} registro{total !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                                   text-white bg-primary rounded-xl hover:opacity-85 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo usuario
                    </button>
                </div>

                {/* Buscador */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputSearch}
                        onChange={e => setInputSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar por nombre o correo…"
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
                                        <div className="h-4 bg-gray-200 rounded w-32" />
                                        <div className="h-3 bg-gray-200 rounded w-48" />
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded w-16" />
                                </div>
                            ))}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-gray-400 text-sm">No se encontraron usuarios</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {users.map(u => (
                                <li
                                    key={u._id}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-sm font-medium ${u.disabled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                {u.name}
                                            </span>
                                            {u.disabled && (
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                                                    Deshabilitado
                                                </span>
                                            )}
                                            {u.rol && (
                                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                                    {u.rol}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                                        {getPositionName(u.position) && (
                                            <p className="text-xs text-gray-400">{getPositionName(u.position)}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleToggle(u)}
                                            title={u.disabled ? 'Habilitar' : 'Deshabilitar'}
                                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                        >
                                            {u.disabled
                                                ? <ToggleLeft className="w-5 h-5" />
                                                : <ToggleRight className="w-5 h-5 text-primary" />}
                                        </button>
                                        <button
                                            onClick={() => openEdit(u)}
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
                <UserModal
                    user={editTarget}
                    onClose={closeModal}
                    onSaved={refresh}
                />
            )}
        </div>
    );
}

export default UsersPage;
