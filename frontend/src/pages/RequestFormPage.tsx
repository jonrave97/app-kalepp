import { useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, Send } from 'lucide-react';
import Swal from 'sweetalert2';
import { useRequestForm } from '@/hooks/requests/useRequestForm';
import { SearchSelect, ImageDropzone } from '@/components/requests/RequestFormComponents';
import type { SelectOption } from '@/components/requests/RequestFormComponents';
import { REQUEST_REASONS } from '@/types/request';
import { getMyEpps } from '@/services/requestServices';
import { getAllEpps } from '@/services/eppServices';

interface Props {
    mode: 'normal' | 'special';
}

const CONFIG = {
    normal: {
        title:    'Nueva Solicitud de EPP',
        subtitle: 'Completa el formulario para solicitar equipos de protección personal',
        fetchEpps: getMyEpps,
    },
    special: {
        title:    'Nueva Solicitud Especial de EPP',
        subtitle: 'Selecciona cualquier EPP disponible en el sistema',
        fetchEpps: getAllEpps,
    },
} as const;

function RequestFormPage({ mode }: Props) {
    const { title, subtitle, fetchEpps } = CONFIG[mode];

    const {
        epps, warehouses, loadingCatalogs, loadCatalogs,
        selectedEppId, setSelectedEppId,
        quantity, setQuantity,
        addToCart,
        cart, removeFromCart, updateCartQuantity,
        images, addImages, removeImage, isCompressing,
        selectedWarehouse, setSelectedWarehouse,
        reason, setReason,
        submitting, setSubmitError, submitRequest,
    } = useRequestForm(fetchEpps);

    useEffect(() => {
        loadCatalogs();
    }, [loadCatalogs]);

    const eppOptions: SelectOption[]       = epps.map(e => ({ value: e._id, label: e.name }));
    const warehouseOptions: SelectOption[] = warehouses.map(w => ({ value: w._id, label: w.name }));
    const reasonOptions: SelectOption[]    = REQUEST_REASONS.map(r => ({ value: r, label: r }));

    const handleAddToCart = () => {
        if (!selectedEppId || !quantity || quantity < 1) return;
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
                    <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                    <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── 1. Selección de EPPs ── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700">1. Selección de EPPs</h2>

                        {loadingCatalogs ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-10 bg-gray-100 rounded-xl" />
                                <div className="h-10 bg-gray-100 rounded-xl w-1/3" />
                            </div>
                        ) : (
                            <div className="flex gap-3 items-end">
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

                    {/* ── 2. Bodega y Motivo ── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700">2. Detalles de la solicitud</h2>

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

                    {/* ── 3. Evidencia fotográfica ── */}
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

export default RequestFormPage;

