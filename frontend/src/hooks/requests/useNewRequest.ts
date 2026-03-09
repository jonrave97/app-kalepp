import { useState, useCallback } from 'react';
import type { Epp } from '@/types/epp';
import type { CreateRequestPayload, RequestReason } from '@/types/request';
import { getAllWarehouses } from '@/services/warehouseServices';
import { createRequest, getMyEpps } from '@/services/requestServices';

export interface CartItem {
    eppId: string;
    eppCode: string;
    eppName: string;
    quantity: number;
}

export function useNewRequest() {
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

    // Estado de envío
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Cargar catálogos al montar la página (una sola vez)
    const loadCatalogs = useCallback(async () => {
        try {
            setLoadingCatalogs(true);
            const [eppData, warehouseData] = await Promise.all([
                getMyEpps(),
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
                // Actualizar cantidad si ya existe
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

        // Resetear selección
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

    // Enviar solicitud
    const submitRequest = useCallback(async (): Promise<boolean> => {
        setSubmitError('');

        if (cart.length === 0) {
            setSubmitError('Debe agregar al menos un EPP a la solicitud');
            return false;
        }
        if (!selectedWarehouse) {
            setSubmitError('Debe seleccionar una bodega');
            return false;
        }
        if (!reason) {
            setSubmitError('Debe seleccionar un motivo');
            return false;
        }

        const payload: CreateRequestPayload = {
            warehouse: selectedWarehouse,
            reason,
            epps: cart.map(item => ({ eppId: item.eppId, quantity: item.quantity })),
        };

        try {
            setSubmitting(true);
            await createRequest(payload);
            // Limpiar formulario tras éxito
            setCart([]);
            setSelectedWarehouse('');
            setReason('');
            return true;
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setSubmitError(msg || 'Error al enviar la solicitud');
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [cart, selectedWarehouse, reason]);

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
