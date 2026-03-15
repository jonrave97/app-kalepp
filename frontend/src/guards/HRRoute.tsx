import { Navigate } from 'react-router-dom';
import { useAuth } from '@context/Authcontext';
import type { RouteGuardProps } from './types/route';

export const HRRoute = ({ children }: RouteGuardProps) => {
    const { auth, loading } = useAuth();

    if (loading) {
        return <p>Cargando...</p>;
    }

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    if (auth.area !== 'HUMAN RESOURCES') {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
