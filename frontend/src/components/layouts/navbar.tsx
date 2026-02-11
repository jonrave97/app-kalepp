import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/context/Authcontext';

function Navbar() {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="bg-primary fixed w-full z-20 top-0 border-default">
            <div className="max-w-7xl flex items-center justify-between mx-auto p-4">

                {/* Logo */}
                <Link to="/dashboard" className="flex items-center gap-3">
                    <img src="./kaltire.png" className="h-7" alt="Kaltire Logo" />
                </Link>

                {/* Mobile Menu Toggle - Checkbox Hack (CSS Puro) */}
                <input
                    type="checkbox"
                    id="mobile-menu-toggle"
                    className="hidden peer"
                />

                <label
                    htmlFor="mobile-menu-toggle"
                    className="inline-flex items-center p-2 w-10 h-10 justify-center 
                               rounded-base md:hidden cursor-pointer
                               hover:bg-white/10 transition-colors
                               focus:outline-none focus:ring-2 focus:ring-accent"
                >
                    <span className="sr-only">Abrir menú</span>
                    <Menu className="w-6 h-6 text-white" />
                </label>

                {/* Navigation Menu - Aparece con peer-checked (CSS Puro) */}
                <div className="hidden peer-checked:block md:block w-full md:w-auto">
                    <ul className="flex flex-col md:flex-row gap-2 md:gap-6 
                                   p-4 md:p-0 mt-4 md:mt-0 
                                   bg-primary-dark md:bg-transparent 
                                   rounded md:rounded-none
                                   border border-primary-dark md:border-0">

                        {/* Home */}
                        <li>
                            <Link
                                to="/dashboard"
                                className={`block py-2 px-3 text-white rounded transition-all
                                           hover:bg-white/10 md:hover:text-accent
                                           active:scale-95 active:bg-white/20
                                           ${location.pathname === '/dashboard' ? 'bg-white/10 md:bg-transparent md:text-accent font-semibold' : ''}`}
                            >
                                Home
                            </Link>
                        </li>

                        {/* Mi Perfil */}
                        <li>
                            <Link
                                to="/profile"
                                className={`block py-2 px-3 text-white rounded transition-all
                                           hover:bg-white/10 md:hover:text-accent
                                           active:scale-95 active:bg-white/20
                                           ${location.pathname === '/profile' ? 'bg-white/10 md:bg-transparent md:text-accent font-semibold' : ''}`}
                            >
                                Mi Perfil
                            </Link>
                        </li>

                        {/* Dropdown Administración - Click para abrir/cerrar */}
                        <li className="relative">
                            <input
                                type="checkbox"
                                id="dropdown-admin"
                                className="hidden peer"
                            />

                            <label
                                htmlFor="dropdown-admin"
                                className={`flex items-center gap-1 py-2 px-3 
                                           text-white rounded transition-all
                                           cursor-pointer
                                           hover:bg-white/10 md:hover:text-accent
                                           active:scale-95
                                           ${location.pathname.startsWith('/admin') ? 'bg-white/10 md:bg-transparent md:text-accent font-semibold' : ''}`}
                            >
                                Administración
                                <ChevronDown className="w-4 h-4 transition-transform 
                                                       peer-checked:rotate-180" />
                            </label>

                            {/* Dropdown Menu - Solo se abre con click */}
                            <div className="hidden peer-checked:block
                                            md:absolute left-0 md:left-auto md:right-0 
                                            mt-2 w-full md:w-48 
                                            bg-gray-50 border shadow-2xl 
                                            rounded overflow-hidden z-50">
                                <ul>
                                    <li>
                                        <Link
                                            to="/admin/users"
                                            className="block p-3  transition-all
                                                       hover:bg-gray-200                                                      active:scale-95 active:bg-gray-200"
                                        >
                                            Usuarios
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/admin/users"
                                            className="block p-3  transition-all
                                                       hover:bg-gray-200                                                    active:scale-95 active:bg-gray-200"
                                        >
                                            Usuarios
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        {/* Solicitudes */}
                        <li>
                            <Link
                                to="/requests"
                                className={`block py-2 px-3 text-white rounded transition-all
                                           hover:bg-white/10 md:hover:text-accent
                                           active:scale-95 active:bg-white/20
                                           ${location.pathname === '/requests' ? 'bg-white/10 md:bg-transparent md:text-accent font-semibold' : ''}`}
                            >
                                Solicitudes
                            </Link>
                        </li>

                        {/* Reportes */}
                        <li>
                            <Link
                                to="/reports"
                                className={`block py-2 px-3 text-white rounded transition-all
                                           hover:bg-white/10 md:hover:text-accent
                                           active:scale-95 active:bg-white/20
                                           ${location.pathname === '/reports' ? 'bg-white/10 md:bg-transparent md:text-accent font-semibold' : ''}`}
                            >
                                Reportes
                            </Link>
                        </li>

                    </ul>
                </div>

                {/* User Info */}
                <div className="hidden md:flex items-center gap-4 text-white text-sm">
                    <span>
                        Hola, <span className="font-semibold">{auth?.name || 'Usuario'}</span>
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 
                                   text-white rounded hover:bg-white/10 
                                   transition-all cursor-pointer
                                   active:scale-95 active:bg-white/20"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                </div>


            </div>
        </nav>
    );
}

export default Navbar;