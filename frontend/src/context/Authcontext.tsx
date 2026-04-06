import type { ReactNode } from "react";
import type { User } from "@/types/user";
import { createContext , useState, useEffect, useContext} from "react";
import API from "@/services/api";
import { cached, invalidate } from "@/services/cache";

export interface AuthContextType {
  auth: User | null;
  setAuth: (user: User | null) => void;
  loading: boolean;
  logout: () => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

// Crear el contexto con valores por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context =  useContext(AuthContext);   
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [auth, setAuth] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const authenticateUser = async () => {
            // Verificar si hay indicios de sesión activa
            // Si nunca han hecho login, no tiene sentido hacer la petición
            const hasSessionFlag = sessionStorage.getItem('hasSession');
            
            if (!hasSessionFlag) {
                // No hay indicios de sesión, no hacer petición innecesaria
                setAuth(null);
                setLoading(false);
                return;
            }

            try {
                // Solo hacemos la petición si esperamos tener una sesión
                // cache.ts evita round-trips a backend durante 5 min
                const data = await cached('auth:profile', () =>
                    API.get('/users/profile').then(r => r.data)
                );
                setAuth(data);
            } catch (error: any) {
                // Si falla (401, token expiró), limpiar flag y caché
                if (error.response?.status === 401) {
                    sessionStorage.removeItem('hasSession');
                    invalidate('auth:profile');
                }
                // console.error('❌ Error al autenticar usuario:', error);
                setAuth(null);
            } finally {
                setLoading(false);
            }
        };
        authenticateUser();
}, []);


    // funcion para cerrar sesion
    const logout = async () => {
        try {
            // Llamar al backend para que limpie la cookie
            await API.post('/users/logout');
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            // Limpiar flag de sesión e invalidar caché de perfil
            sessionStorage.removeItem('hasSession');
            invalidate('auth:profile');
            setAuth(null);
        }
    };

    return (
        <AuthContext.Provider value={{ auth, setAuth, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};