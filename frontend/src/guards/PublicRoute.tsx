import { Navigate } from "react-router-dom"; // Importar Navigate para redirección
import { useAuth } from "@context/Authcontext"; // Importar el hook de autenticación
import { type RouteGuardProps } from "./types/route";// Importar las props del componente

// Componente de ruta pública que verifica la autenticación
export const PublicRoute = ({children} : RouteGuardProps ) => {
    const { auth, loading } = useAuth(); // Obtener el estado de autenticación y carga

    // Mostrar indicador de carga mientras se verifica la autenticación
    if(loading) {
        return (<p>Cargando...</p>); // Mostrar indicador de carga mientras se verifica la autenticación)
    }
    // Si está autenticado, redirigir al dashboard
    if(auth){
        return <Navigate to="/dashboard" replace />; // Redirigir al dashboard si está autenticado
    }
    // Si no está autenticado, renderizar los hijos del componente
    return <>{children}</>; // Renderizar los hijos si no está autenticado
}