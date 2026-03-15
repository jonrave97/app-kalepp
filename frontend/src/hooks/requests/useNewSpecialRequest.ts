import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import imageCompression from 'browser-image-compression';
import type { Epp } from '@/types/epp';
import type { CreateRequestPayload, RequestReason } from '@/types/request';
import { getAllWarehouses } from '@/services/warehouseServices';
import { createRequest } from '@/services/requestServices';
import { getAllEpps } from '@/services/eppServices';

const MAX_IMAGES     = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface CartItem {
    eppId: string;
    eppCode: string;
    eppName: string;
    quantity: number;
}

export function useNewSpecialRequest() {
    // Catálogos cargados una sola vez
    const [epps,       setEpps]       = useState<Pick<Epp, '_id' | 'code' | 'name'>[]>([]);
    const [warehouses, setWarehouses] = useState<{ _id: string; code: string; name: string }[]>([]);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);

    // Formulario
    const [selectedEppId,  setSelectedEppId]  = useState('');
    const [quantity,       setQuantity]       = useState<number>(1);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [reason,         setReason]         = useState<RequestReason | ''>('');

    // Carrito
    const [cart, setCart] = useState<CartItem[]>([]);

    // Imágenes
    const [images,       setImages]       = useState<File[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);

    // Estado de envío
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Cargar catálogos al montar (todos los EPPs del sistema)
    const loadCatalogs = useCallback(async () => {
        try {
            setLoadingCatalogs(true);
            const [eppData, warehouseData] = await Promise.all([
                getAllEpps(),
                getAllWarehouses(),
            ]);
            setEpps(eppData);
            setWarehouses(warehouseData);
        } finally {
            setLoadingCatalogs(false);
        }
    }, []);

    // Agregar / actualizar EPP en el carrito
    const addToCart = () => {
        if (!selectedEppId) return;
        if (!quantity || quantity < 1) return;

        const eppInfo = epps.find(e => e._id === selectedEppId);
        if (!eppInfo) return;

        setCart(prev => {
            const existing = prev.find(item => item.eppId === selectedEppId);
            if (existing) {
                return prev.map(item =>
                    item.eppId === selectedEppId
                        ? { ...item, quantity }
                        : item
                );
            }
            return [
                ...prev,
                { eppId: selectedEppId, eppCode: eppInfo.code, eppName: eppInfo.name, quantity },
            ];
        });

        setSelectedEppId('');
        setQuantity(1);
    };

    // Eliminar EPP del carrito
    const removeFromCart = (eppId: string) => {
        setCart(prev => prev.filter(item => item.eppId !== eppId));
    };

    // Actualizar cantidad directamente en el carrito
    const updateCartQuantity = (eppId: string, qty: number) => {
        if (qty < 1) return;
        setCart(prev =>
            prev.map(item => item.eppId === eppId ? { ...item, quantity: qty } : item)
        );
    };

    // ── Imágenes ──────────────────────────────────────────────────────────────
    const addImages = useCallback(async (incoming: File[]) => {
        setSubmitError('');

        const validType = incoming.filter(f => ALLOWED_TYPES.includes(f.type));
        if (validType.length < incoming.length) {
            Swal.fire({ icon: 'warning', title: 'Formato no permitido', text: 'Formato de imagen no permitido. Solo se aceptan JPG, PNG o WEBP.' });
            if (validType.length === 0) return;
        }

        const validSize = validType.filter(f => f.size <= MAX_SIZE_BYTES);
        if (validSize.length < validType.length) {
            Swal.fire({ icon: 'warning', title: 'Imagen demasiado grande', text: 'La imagen seleccionada es demasiado grande. El tamaño máximo es 10 MB.' });
            if (validSize.length === 0) return;
        }

        if (validSize.length === 0) return;

        const currentCount = images.length;
        if (currentCount >= MAX_IMAGES) {
            Swal.fire({ icon: 'error', title: 'Límite alcanzado', text: `Solo se permite subir un máximo de ${MAX_IMAGES} imágenes.` });
            return;
        }

        const slots = MAX_IMAGES - currentCount;
        if (validSize.length > slots) {
            Swal.fire({ icon: 'error', title: 'Límite de imágenes', text: `Solo se permite subir un máximo de ${MAX_IMAGES} imágenes.` });
        }

        try {
            setIsCompressing(true);
            const toCompress = validSize.slice(0, slots);
            const compressed = await Promise.all(
                toCompress.map(async file => {
                    try {
                        return await imageCompression(file, {
                            maxSizeMB:        0.5,
                            maxWidthOrHeight: 1600,
                            useWebWorker:     true,
                            fileType:         'image/jpeg',
                            initialQuality:   0.7,
                        });
                    } catch {
                        return file;
                    }
                })
            );
            setImages(prev => {
                const available = MAX_IMAGES - prev.length;
                return [...prev, ...compressed.slice(0, available)];
            });
        } finally {
            setIsCompressing(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images.length]);

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const submitRequest = useCallback(async (): Promise<boolean> => {
        setSubmitError('');

        if (cart.length === 0) {
            await Swal.fire({ icon: 'warning', title: 'Sin EPPs seleccionados', text: 'Debe seleccionar al menos un EPP para generar la solicitud.' });
            return false;
        }
        if (!selectedWarehouse) {
            await Swal.fire({ icon: 'warning', title: 'Bodega requerida', text: 'Debe seleccionar una bodega.' });
            return false;
        }
        if (!reason) {
            await Swal.fire({ icon: 'warning', title: 'Motivo requerido', text: 'Debe seleccionar un motivo de solicitud.' });
            return false;
        }
        if (reason === 'Deterioro' && images.length === 0) {
            await Swal.fire({ icon: 'warning', title: 'Evidencia requerida', text: 'Cuando el motivo es deterioro debe adjuntar al menos una evidencia fotográfica.' });
            return false;
        }

        const payload: CreateRequestPayload = {
            warehouse: selectedWarehouse,
            reason,
            epps: cart.map(item => ({ eppId: item.eppId, quantity: item.quantity })),
        };

        try {
            setSubmitting(true);
            await createRequest(payload, images);
            setCart([]);
            setSelectedWarehouse('');
            setReason('');
            setImages([]);
            return true;
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            await Swal.fire({ icon: 'error', title: 'Error al enviar', text: msg || 'No se pudo enviar la solicitud. Intenta nuevamente.' });
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [cart, selectedWarehouse, reason, images]);

    return {
        // Catálogos
        epps,
        warehouses,
        loadingCatalogs,
        loadCatalogs,
        // Selección de EPP
        selectedEppId,
        setSelectedEppId,
        quantity,
        setQuantity,
        addToCart,
        // Carrito
        cart,
        removeFromCart,
        updateCartQuantity,
        // Imágenes
        images,
        addImages,
        removeImage,
        isCompressing,
        // Bodega & motivo
        selectedWarehouse,
        setSelectedWarehouse,
        reason,
        setReason,
        // Envío
        submitting,
        submitError,
        setSubmitError,
        submitRequest,
    };
}
