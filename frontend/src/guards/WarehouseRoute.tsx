import { Navigate } from 'react-router-dom';
import { useAuth } from '@context/Authcontext';
import type { RouteGuardProps } from './types/route';

export const WarehouseRoute = ({ children }: RouteGuardProps) => {
    const { auth, loading } = useAuth();

    if (loading) {
        return <p>Cargando...</p>;
    }

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    const role = auth.rol ?? auth.role;
    if (role !== 'Administrador' && role !== 'Encargado de Bodega') {
        return <Navigate to="/profile" replace />;
    }

    return <>{children}</>;
};
