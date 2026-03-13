import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/context/Authcontext';

function Navbar() {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);
    const adminRef = useRef<HTMLLIElement>(null);

    // Cerrar menú móvil al cambiar de ruta
    useEffect(() => {
        setMobileOpen(false);
        setAdminOpen(false);
    }, [location.pathname]);

    // Cerrar dropdown admin al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
                setAdminOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navLinkClass = (path: string) =>
        `block py-2 px-3 text-white rounded transition-all
         hover:bg-white/10 md:hover:text-accent active:scale-95 active:bg-white/20
         ${location.pathname === path ? 'bg-white/10 md:bg-transparent md:text-accent font-semibold' : ''}`;

    return (
        <nav className="bg-primary fixed w-full z-20 top-0 border-default">
            <div className="max-w-7xl flex items-center justify-between mx-auto p-4">

                {/* Logo */}
                <Link to="/dashboard" className="flex items-center gap-3 shrink-0">
                    <img src="/kaltire.png" className="h-7" alt="Kaltire Logo" />
                </Link>

                {/* Desktop nav */}
                <ul className="hidden md:flex items-center gap-1">

                    <li>
                        <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                            Home
                        </Link>
                    </li>

                    <li>
                        <Link to="/profile" className={navLinkClass('/profile')}>
                            Mi Perfil
                        </Link>
                    </li>

                    {/* Dropdown Administración */}
                    <li className="relative" ref={adminRef}>
                        <button
                            onClick={() => setAdminOpen(prev => !prev)}
                            className={`flex items-center gap-1 py-2 px-3 text-white rounded transition-all
                                        cursor-pointer hover:bg-white/10 hover:text-accent active:scale-95
                                        ${location.pathname.startsWith('/admin') ? 'text-accent font-semibold' : ''}`}
                        >
                            Administración
                            <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {adminOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border shadow-lg rounded-lg overflow-hidden z-50">
                                <ul>
                                    <li>
                                        <Link
                                            to="/admin/users"
                                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            Usuarios
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/admin/positions"
                                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            Cargos
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/admin/warehouses"
                                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            Bodegas
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/admin/categories"
                                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            Categorías
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/admin/epps"
                                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            EPPs
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </li>

                    <li>
                        <Link to="/newrequest" className={navLinkClass('/newrequest')}>
                            Solicitudes
                        </Link>
                    </li>

                    <li>
                        <Link to="/reports" className={navLinkClass('/reports')}>
                            Reportes
                        </Link>
                    </li>

                </ul>

                {/* Desktop: user info + logout */}
                <div className="hidden md:flex items-center gap-4 text-white text-sm shrink-0">
                    <span>
                        Hola, <span className="font-semibold">{auth?.name || 'Usuario'}</span>
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-white rounded
                                   hover:bg-white/10 transition-all cursor-pointer
                                   active:scale-95 active:bg-white/20"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                </div>

                {/* Hamburger button (móvil) */}
                <button
                    onClick={() => setMobileOpen(prev => !prev)}
                    className="md:hidden inline-flex items-center justify-center p-2 w-10 h-10
                               rounded text-white hover:bg-white/10 transition-colors
                               focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={mobileOpen}
                >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

            </div>

            {/* Mobile panel */}
            {mobileOpen && (
                <div className="md:hidden bg-primary border-t border-white/10 px-4 pb-4">
                    <ul className="flex flex-col gap-1 pt-2">

                        <li>
                            <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                                Home
                            </Link>
                        </li>

                        <li>
                            <Link to="/profile" className={navLinkClass('/profile')}>
                                Mi Perfil
                            </Link>
                        </li>

                        {/* Accordion Administración (móvil) */}
                        <li>
                            <button
                                onClick={() => setAdminOpen(prev => !prev)}
                                className={`w-full flex items-center justify-between py-2 px-3 text-white rounded
                                            hover:bg-white/10 transition-all active:scale-95
                                            ${location.pathname.startsWith('/admin') ? 'bg-white/10 font-semibold' : ''}`}
                            >
                                Administración
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {adminOpen && (
                                <ul className="ml-4 mt-1 border-l-2 border-white/20 pl-3 space-y-1">
                                    <li>
                                        <Link
                                            to="/admin/users"
                                            className="block py-2 px-2 text-white/80 text-sm rounded hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            Usuarios
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/admin/positions"
                                            className="block py-2 px-2 text-white/80 text-sm rounded hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            Cargos
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li>
                            <Link to="/requests" className={navLinkClass('/requests')}>
                                Solicitudes
                            </Link>
                        </li>

                        <li>
                            <Link to="/reports" className={navLinkClass('/reports')}>
                                Reportes
                            </Link>
                        </li>

                    </ul>

                    {/* User info + logout en móvil */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-white text-sm">
                        <span>
                            Hola, <span className="font-semibold">{auth?.name || 'Usuario'}</span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded
                                       hover:bg-white/10 transition-all active:scale-95"
                        >
                            <LogOut className="w-4 h-4" />
                            Salir
                        </button>
                    </div>
                </div>
            )}

        </nav>
    );
}

export default Navbar;
