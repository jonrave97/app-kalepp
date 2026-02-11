import { Navigate } from "react-router-dom"; // Importar Navigate para redirección
import { useAuth } from "@context/Authcontext"; // Importar el hook de autenticación
import {type RouteGuardProps } from "./types/route"; // Importar las props del componente

// Componente de ruta protegida que verifica la autenticación
export const ProtectedRoute = ({children} : RouteGuardProps ) => {
    const { auth, loading } = useAuth(); // Obtener el estado de autenticación y carga

    // Mostrar indicador de carga mientras se verifica la autenticación
    if(loading){
        return (<p>Cargando...</p>); // Mostrar indicador de carga mientras se verifica la autenticación)
    }

    // Si no está autenticado, redirigir a la página de login
    if(!auth){
        return <Navigate to="/login" replace />; // Redirigir a la página de login si no está autenticado
    }

    // Si está autenticado, renderizar los hijos del componente
    return <>{children}</>; // Renderizar los hijos si está autenticado
};