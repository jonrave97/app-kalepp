import { useState, useEffect } from 'react';
import { getAdminRequests } from '@/services/requestServices';

/**
 * Obtiene el total de solicitudes pendientes de entrega para una bodega dada.
 * Cuenta los estados "Aprobada" y "Sin Stock" en paralelo con limit=1 cada uno.
 * Expone `refresh()` para actualizar el conteo tras cualquier acción del bodeguero.
 */
export function usePendingDeliveryCount(warehouseId: string) {
    const [pendingCount, setPendingCount] = useState<number | null>(null);
    const [trigger, setTrigger]           = useState(0);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            getAdminRequests(warehouseId, 1, '', 1, 'Aprobada'),
            getAdminRequests(warehouseId, 1, '', 1, 'Sin Stock'),
        ])
            .then(([aprobadas, sinStock]) => {
                if (!cancelled) setPendingCount(aprobadas.total + sinStock.total);
            })
            .catch(() => {
                if (!cancelled) setPendingCount(null);
            });

        return () => { cancelled = true; };
    }, [warehouseId, trigger]);

    const refresh = () => setTrigger(t => t + 1);

    return { pendingCount, refresh };
}





