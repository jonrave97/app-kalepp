import { useState, useEffect } from 'react';
import { getMyWarehouse } from '@/services/warehouseServices';

export function useMyWarehouse() {
    const [warehouseId, setWarehouseId] = useState<string | null>(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(false);

    useEffect(() => {
        getMyWarehouse()
            .then(warehouse => setWarehouseId(warehouse._id))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    return { warehouseId, loading, error };
}
