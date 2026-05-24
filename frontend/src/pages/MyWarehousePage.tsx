import { useMyWarehouse } from '@/hooks/warehouses/useMyWarehouse';
import WarehouseDetailPage from '@/pages/WarehouseDetailPage';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function MyWarehousePage() {
    const { warehouseId, loading, error } = useMyWarehouse();
    const navigate = useNavigate();

    useEffect(() => {
        if (error) navigate('/profile', { replace: true });
    }, [error, navigate]);

    if (loading || !warehouseId) return <p>Cargando bodega…</p>;

    return <WarehouseDetailPage warehouseId={warehouseId} />;
}

export default MyWarehousePage;
