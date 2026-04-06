import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import imageCompression from 'browser-image-compression';
import type { Epp } from '@/types/epp';
import type { Kit } from '@/types/kit';
import type { CreateRequestPayload } from '@/types/request';
import { getAllWarehouses } from '@/services/warehouseServices';
import { createRequest } from '@/services/requestServices';
import { getAllEpps } from '@/services/eppServices';
import { getAllKits } from '@/services/kitServices';
import { getAllActiveUsers } from '@/services/userAdminServices';

const MAX_IMAGES     = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const KIT_REASON     = 'Kit Inicial Trabajador Nuevo';

export interface CartItem {
    eppId: string;
    eppCode: string;
    eppName: string;
    quantity: number;
}

export function useKitRequest() {
    const [epps,       setEpps]       = useState<Pick<Epp, '_id' | 'code' | 'name'>[]>([]);
    const [kits,       setKits]       = useState<Kit[]>([]);
    const [warehouses, setWarehouses] = useState<{ _id: string; code: string; name: string }[]>([]);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);

    const [users,           setUsers]           = useState<{ _id: string; name: string; email: string }[]>([]);
    const [loadingUsers,    setLoadingUsers]    = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    const [selectedEppId,     setSelectedEppId]     = useState('');
    const [quantity,          setQuantity]          = useState<number>(1);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');

    const [cart,   setCart]   = useState<CartItem[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);
    const [submitting,    setSubmitting]    = useState(false);
    const [submitError,   setSubmitError]   = useState('');

    const loadCatalogs = useCallback(async () => {
        try {
            setLoadingCatalogs(true);
            const [eppData, warehouseData, kitData] = await Promise.all([
                getAllEpps(),
                getAllWarehouses(),
                getAllKits(),
            ]);
            setEpps(eppData);
            setWarehouses(warehouseData);
            setKits(kitData);
        } finally {
            setLoadingCatalogs(false);
        }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            setLoadingUsers(true);
            const data = await getAllActiveUsers();
            setUsers(data);
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    // Pre-fill cart from a selected kit
    const applyKit = useCallback((kit: Kit) => {
        const items: CartItem[] = kit.epps
            .map(ke => {
                if (typeof ke.epp === 'string') return null;
                const eppObj = ke.epp as { _id: string; name: string; code?: string };
                return {
                    eppId:   eppObj._id,
                    eppCode: eppObj.code ?? '',
                    eppName: eppObj.name,
                    quantity: ke.quantity,
                };
            })
            .filter((x): x is CartItem => x !== null);
        setCart(items);
    }, []);

    const addToCart = () => {
        if (!selectedEppId || !quantity || quantity < 1) return;
        const eppInfo = epps.find(e => e._id === selectedEppId);
        if (!eppInfo) return;

        setCart(prev => {
            const existing = prev.find(item => item.eppId === selectedEppId);
            if (existing) {
                return prev.map(item =>
                    item.eppId === selectedEppId ? { ...item, quantity } : item
                );
            }
            return [...prev, { eppId: selectedEppId, eppCode: eppInfo.code, eppName: eppInfo.name, quantity }];
        });
        setSelectedEppId('');
        setQuantity(1);
    };

    const removeFromCart = (eppId: string) => {
        setCart(prev => prev.filter(item => item.eppId !== eppId));
    };

    const updateCartQuantity = (eppId: string, qty: number) => {
        if (qty < 1) return;
        setCart(prev => prev.map(item => item.eppId === eppId ? { ...item, quantity: qty } : item));
    };

    const addImages = useCallback(async (incoming: File[]) => {
        setSubmitError('');
        const validType = incoming.filter(f => ALLOWED_TYPES.includes(f.type));
        if (validType.length < incoming.length) {
            Swal.fire({ icon: 'warning', title: 'Formato no permitido', text: 'Solo se aceptan JPG, PNG o WEBP.' });
            if (validType.length === 0) return;
        }
        const validSize = validType.filter(f => f.size <= MAX_SIZE_BYTES);
        if (validSize.length < validType.length) {
            Swal.fire({ icon: 'warning', title: 'Imagen demasiado grande', text: 'El tamaño máximo es 10 MB.' });
            if (validSize.length === 0) return;
        }
        if (validSize.length === 0) return;
        const currentCount = images.length;
        if (currentCount >= MAX_IMAGES) {
            Swal.fire({ icon: 'error', title: 'Límite alcanzado', text: `Máximo ${MAX_IMAGES} imágenes.` });
            return;
        }
        const slots = MAX_IMAGES - currentCount;
        if (validSize.length > slots) {
            Swal.fire({ icon: 'error', title: 'Límite de imágenes', text: `Máximo ${MAX_IMAGES} imágenes.` });
        }
        try {
            setIsCompressing(true);
            const toCompress = validSize.slice(0, slots);
            const compressed = await Promise.all(
                toCompress.map(async file => {
                    try {
                        return await imageCompression(file, {
                            maxSizeMB: 0.5, maxWidthOrHeight: 1600,
                            useWebWorker: true, fileType: 'image/jpeg', initialQuality: 0.7,
                        });
                    } catch { return file; }
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

    const submitRequest = useCallback(async (): Promise<boolean> => {
        setSubmitError('');
        if (cart.length === 0) {
            await Swal.fire({ icon: 'warning', title: 'Sin EPPs seleccionados', text: 'Debe seleccionar al menos un EPP.' });
            return false;
        }
        if (!selectedWarehouse) {
            await Swal.fire({ icon: 'warning', title: 'Bodega requerida', text: 'Debe seleccionar una bodega.' });
            return false;
        }
        if (!selectedEmployee) {
            await Swal.fire({ icon: 'warning', title: 'Trabajador requerido', text: 'Debe seleccionar un trabajador.' });
            return false;
        }
        const payload: CreateRequestPayload = {
            warehouse: selectedWarehouse,
            reason:    KIT_REASON,
            epps:      cart.map(item => ({ eppId: item.eppId, quantity: item.quantity })),
            employee:  selectedEmployee,
        };
        try {
            setSubmitting(true);
            await createRequest(payload, images);
            setCart([]);
            setSelectedWarehouse('');
            setImages([]);
            setSelectedEmployee('');
            return true;
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            await Swal.fire({ icon: 'error', title: 'Error al enviar', text: msg || 'No se pudo enviar la solicitud.' });
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [cart, selectedWarehouse, selectedEmployee, images]);

    return {
        epps, kits, warehouses, loadingCatalogs, loadCatalogs,
        users, loadingUsers, loadUsers, selectedEmployee, setSelectedEmployee,
        selectedEppId, setSelectedEppId,
        quantity, setQuantity,
        addToCart, applyKit,
        cart, removeFromCart, updateCartQuantity,
        images, addImages, removeImage, isCompressing,
        selectedWarehouse, setSelectedWarehouse,
        submitting, submitError, setSubmitError,
        submitRequest,
    };
}
