import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, Trash2, ShoppingCart, Send, ImagePlus, X, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNewRequest } from '@/hooks/requests/useNewRequest';
import { REQUEST_REASONS } from '@/types/request';

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
                    <ul className="max-h-48 overflow-y-auto">
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

// ─── ImageDropzone ────────────────────────────────────────────────────────────
interface ImageDropzoneProps {
    images: File[];
    onAdd: (files: File[]) => Promise<void>;
    onRemove: (index: number) => void;
    isCompressing: boolean;
    required?: boolean;
    error?: string;
}

function ImageDropzone({ images, onAdd, onRemove, isCompressing, required, error }: ImageDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;
        onAdd(Array.from(files));
    }, [onAdd]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const previews = images.map(f => URL.createObjectURL(f));

    return (
        <div className="space-y-3">
            {/* Drop area */}
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isCompressing && inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl
                            border-2 border-dashed p-6 cursor-pointer transition-colors select-none
                            ${dragging
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5'}
                            ${isCompressing ? 'opacity-60 cursor-wait' : ''}`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    className="hidden"
                    onChange={e => handleFiles(e.target.files)}
                    onClick={e => { (e.target as HTMLInputElement).value = ''; }}
                />

                {isCompressing ? (
                    <>
                        <Loader2 className="w-7 h-7 text-primary animate-spin" />
                        <p className="text-sm text-primary font-medium">Comprimiendo imágenes…</p>
                    </>
                ) : (
                    <>
                        <ImagePlus className="w-7 h-7 text-gray-300" />
                        <p className="text-sm text-gray-500">
                            <span className="text-primary font-medium">Haz clic</span> o arrastra imágenes aquí
                        </p>
                        <p className="text-xs text-gray-400">JPG, PNG, WEBP · Máx. 10 MB por imagen · Máx. 5 imágenes</p>
                        {required && images.length === 0 && (
                            <span className="text-xs text-red-500 font-medium">* Obligatorio para motivo "Deterioro"</span>
                        )}
                    </>
                )}
            </div>

            {/* Previews */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {images.map((_file, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={previews[i]}
                                alt={`Imagen ${i + 1}`}
                                className="w-full h-full object-cover"
                                onLoad={() => URL.revokeObjectURL(previews[i])}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); onRemove(i); }}
                                className="absolute top-1 right-1 p-0.5 rounded-full bg-white/90 text-gray-600
                                           opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all shadow"
                                title="Eliminar imagen"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-1 left-1 text-xs text-white font-medium
                                             bg-black/40 px-1 rounded">
                                {i + 1}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────
function NewRequestPage() {
    const {
        epps,
        warehouses,
        loadingCatalogs,
        loadCatalogs,
        selectedEppId,
        setSelectedEppId,
        quantity,
        setQuantity,
        addToCart,
        cart,
        removeFromCart,
        updateCartQuantity,
        images,
        addImages,
        removeImage,
        isCompressing,
        selectedWarehouse,
        setSelectedWarehouse,
        reason,
        setReason,
        submitting,
        setSubmitError,
        submitRequest,
    } = useNewRequest();

    // Cargar catálogos una sola vez
    useEffect(() => {
        loadCatalogs();
    }, [loadCatalogs]);

    const eppOptions: SelectOption[] = epps.map(e => ({
        value: e._id,
        label: `${e.code} — ${e.name}`,
    }));

    const warehouseOptions: SelectOption[] = warehouses.map(w => ({
        value: w._id,
        label: `${w.code} — ${w.name}`,
    }));

    const reasonOptions: SelectOption[] = REQUEST_REASONS.map(r => ({
        value: r,
        label: r,
    }));

    const handleAddToCart = () => {
        if (!selectedEppId) {
            return;
        }
        if (!quantity || quantity < 1) {
            return;
        }
        addToCart();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        const success = await submitRequest();
        if (success) {
            await Swal.fire({
                icon: 'success',
                title: 'Solicitud enviada',
                text: 'La solicitud fue enviada correctamente y será revisada por el aprobador.',
                confirmButtonText: 'Aceptar',
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Encabezado */}
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Nueva Solicitud de EPP</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Completa el formulario para solicitar equipos de protección personal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── Sección: Agregar EPPs ── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700">1. Selección de EPPs</h2>

                        {loadingCatalogs ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-10 bg-gray-100 rounded-xl" />
                                <div className="h-10 bg-gray-100 rounded-xl w-1/3" />
                            </div>
                        ) : (
                            <div className="flex gap-3 items-end">
                                {/* EPP dropdown */}
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        EPP
                                    </label>
                                    <SearchSelect
                                        options={eppOptions}
                                        value={selectedEppId}
                                        onChange={setSelectedEppId}
                                        placeholder="Buscar EPP..."
                                    />
                                </div>

                                {/* Cantidad */}
                                <div className="w-28">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                                   focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                                    />
                                </div>

                                {/* Botón Agregar */}
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={!selectedEppId || quantity < 1}
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                                               text-white bg-primary rounded-xl hover:opacity-85 transition-opacity
                                               disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                    <Plus className="w-4 h-4" />
                                    Agregar
                                </button>
                            </div>
                        )}

                        {/* Carrito */}
                        {cart.length > 0 ? (
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShoppingCart className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        EPPs seleccionados ({cart.length})
                                    </span>
                                </div>
                                <div className="border border-gray-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            <tr>
                                                <th className="text-left px-4 py-2.5">EPP</th>
                                                <th className="text-center px-4 py-2.5 w-28">Cantidad</th>
                                                <th className="px-4 py-2.5 w-12" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {cart.map(item => (
                                                <tr key={item.eppId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-gray-800">{item.eppName}</span>
                                                        <span className="ml-2 text-xs text-gray-400 font-mono">{item.eppCode}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={item.quantity}
                                                            onChange={e => updateCartQuantity(item.eppId, Math.max(1, Number(e.target.value)))}
                                                            className="w-16 text-center px-2 py-1 border border-gray-200 rounded-lg text-sm
                                                                       focus:outline-none focus:ring-1 focus:ring-primary/40"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(item.eppId)}
                                                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-6 border border-dashed border-gray-200 rounded-xl text-gray-300 text-sm gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                Sin EPPs agregados
                            </div>
                        )}
                    </div>

                    {/* ── Sección: Bodega y Motivo ── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700">2. Detalles de la solicitud</h2>

                        {/* Bodega */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                Bodega
                            </label>
                            {loadingCatalogs ? (
                                <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                            ) : (
                                <SearchSelect
                                    options={warehouseOptions}
                                    value={selectedWarehouse}
                                    onChange={setSelectedWarehouse}
                                    placeholder="Seleccionar bodega..."
                                />
                            )}
                        </div>

                        {/* Motivo */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                Motivo de solicitud
                            </label>
                            <SearchSelect
                                options={reasonOptions}
                                value={reason}
                                onChange={v => setReason(v as typeof reason)}
                                placeholder="Seleccionar motivo..."
                            />
                        </div>
                    </div>

                    {/* ── Sección: Evidencia fotográfica ── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-700">
                                3. Adjuntar evidencia fotográfica
                                {reason === 'Deterioro' && (
                                    <span className="ml-2 text-xs text-red-500 font-normal">* requerida</span>
                                )}
                            </h2>
                            {images.length > 0 && (
                                <span className="text-xs text-gray-400">
                                    {images.length} / 5 imagen{images.length !== 1 ? 'es' : ''}
                                </span>
                            )}
                        </div>
                        <ImageDropzone
                            images={images}
                            onAdd={addImages}
                            onRemove={removeImage}
                            isCompressing={isCompressing}
                            required={reason === 'Deterioro'}
                        />
                    </div>

                    {/* Botón enviar */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || loadingCatalogs || isCompressing}
                            onClick={() => setSubmitError('')}
                            className="flex items-center gap-2 px-6 py-3 text-sm font-medium
                                       text-white bg-primary rounded-xl hover:opacity-85 transition-opacity
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            {submitting ? 'Enviando…' : 'Enviar Solicitud'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default NewRequestPage;
