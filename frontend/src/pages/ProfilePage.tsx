import { useState, useEffect } from 'react';
import { User, Mail, Briefcase, Building2, Ruler, Users, Edit2, Save, X } from 'lucide-react';
import type { UserSizes } from '@/types/userSizes';
import { updateUserSizes } from '@/services/authServices';
import { useAuth } from '@/context/Authcontext';
import Swal from 'sweetalert2';

function ProfilePage() {
    const { auth, setAuth, loading: authLoading } = useAuth();

    // Estados para edición de tallas
    const [isEditingSize, setIsEditingSize] = useState(false);
    const [sizesForm, setSizesForm] = useState<UserSizes>(auth?.sizes || {});
    const [loading, setLoading] = useState(false);

    // Sincronizar sizesForm cuando auth cambie
    useEffect(() => {
        if (auth?.sizes) {
            setSizesForm(auth.sizes);
        }
    }, [auth]);

    // Iniciar modo de edición
    const handleEditClick = () => {
        setSizesForm(auth?.sizes || {});
        setIsEditingSize(true);
    };

    // Cancelar edición
    const handleCancelEdit = () => {
        setSizesForm(auth?.sizes || {});
        setIsEditingSize(false);
    };

    // Guardar cambios
    const handleSaveChanges = async () => {
        try {
            setLoading(true);
            const updatedUser = await updateUserSizes(sizesForm);
            
            // Actualizar el contexto con los nuevos datos
            setAuth(updatedUser);
            
            await Swal.fire({
                icon: 'success',
                title: 'Tallas actualizadas',
                text: 'Tus tallas han sido actualizadas correctamente',
                timer: 2000,
                showConfirmButton: false
            });
            
            setIsEditingSize(false);
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'No se pudieron actualizar las tallas'
            });
        } finally {
            setLoading(false);
        }
    };

    // Actualizar valores del formulario
    const handleSizeChange = (field: string, value: string) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setSizesForm(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof UserSizes] as any),
                    [child]: value
                }
            }));
        } else {
            setSizesForm(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    // Skeleton Loader
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-4xl mx-auto animate-pulse">
                    {/* Header Skeleton */}
                    <div className="mb-6">
                        <div className="h-9 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>

                    {/* Card Skeleton */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {/* Información del Usuario Skeleton */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tallas Skeleton */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-10 bg-gray-200 rounded w-24"></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Aprobadores Skeleton */}
                        <div className="p-6">
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Si no hay usuario autenticado
    if (!auth) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">No hay sesión activa</h2>
                    <p className="text-gray-600">Por favor, inicia sesión para ver tu perfil</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
                    <p className="text-gray-600 mt-2">Información personal y configuración</p>
                </div>

                {/* Card Principal */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    
                    {/* Información del Usuario */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary rounded-full">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">{auth.name}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Email */}
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-primary mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Correo Electrónico</p>
                                    <p className="text-gray-800">{auth.email}</p>
                                </div>
                            </div>

                            {/* Cargo */}
                            <div className="flex items-start gap-3">
                                <Briefcase className="w-5 h-5 text-primary mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Cargo</p>
                                    <p className="text-gray-800">{auth.position || 'No especificado'}</p>
                                </div>
                            </div>

                            {/* Área */}
                            <div className="flex items-start gap-3">
                                <Building2 className="w-5 h-5 text-primary mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Área</p>
                                    <p className="text-gray-800">{auth.area || 'No especificado'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección de Tallas */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Ruler className="w-5 h-5 text-primary" />
                                <h3 className="text-xl font-semibold text-gray-800">Tallas</h3>
                            </div>
                            
                            {!isEditingSize ? (
                                <button
                                    onClick={handleEditClick}
                                    className="flex items-center gap-2 px-4 py-2 text-primary 
                                               border border-primary rounded transition-all
                                               hover:bg-primary hover:text-white
                                               active:scale-95"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Editar
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-600 
                                                   border border-gray-300 rounded transition-all
                                                   hover:bg-gray-100 active:scale-95
                                                   disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-4 py-2 text-white 
                                                   bg-primary rounded transition-all
                                                   hover:bg-primary-dark active:scale-95
                                                   disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-4 h-4" />
                                        {loading ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Calzado */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">Calzado</p>
                                {!isEditingSize ? (
                                    <p className="text-2xl font-bold text-primary">
                                        {auth.sizes?.footwear || '-'}
                                    </p>
                                ) : (
                                    <input
                                        type="number"
                                        min="35"
                                        max="50"
                                        value={sizesForm.footwear || ''}
                                        onChange={(e) => handleSizeChange('footwear', e.target.value)}
                                        placeholder="38"
                                        className="w-full px-3 py-2 border border-gray-300 rounded
                                                   focus:outline-none focus:ring-2 focus:ring-primary
                                                   text-lg font-semibold"
                                    />
                                )}
                            </div>

                            {/* Guantes */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">Guantes</p>
                                {!isEditingSize ? (
                                    <p className="text-2xl font-bold text-primary">
                                        {auth.sizes?.gloves || '-'}
                                    </p>
                                ) : (
                                    <select
                                        value={sizesForm.gloves || ''}
                                        onChange={(e) => handleSizeChange('gloves', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded
                                                   focus:outline-none focus:ring-2 focus:ring-primary
                                                   text-lg font-semibold"
                                    >
                                        <option value="">-</option>
                                        <option value="XS">XS</option>
                                        <option value="S">S</option>
                                        <option value="M">M</option>
                                        <option value="L">L</option>
                                        <option value="XL">XL</option>
                                        <option value="XXL">XXL</option>
                                    </select>
                                )}
                            </div>

                            {/* Pantalón */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">Pantalón</p>
                                {!isEditingSize ? (
                                    <p className="text-2xl font-bold text-primary">
                                        {auth.sizes?.pants?.letter && auth.sizes?.pants?.number
                                            ? `${auth.sizes.pants.letter} / ${auth.sizes.pants.number}`
                                            : '-'}
                                    </p>
                                ) : (
                                    <div className="flex gap-2">
                                        <select
                                            value={sizesForm.pants?.letter || ''}
                                            onChange={(e) => handleSizeChange('pants.letter', e.target.value)}
                                            className="w-1/2 px-2 py-2 border border-gray-300 rounded
                                                       focus:outline-none focus:ring-2 focus:ring-primary
                                                       text-sm font-semibold"
                                        >
                                            <option value="">-</option>
                                            <option value="S">S</option>
                                            <option value="M">M</option>
                                            <option value="L">L</option>
                                            <option value="XL">XL</option>
                                            <option value="XXL">XXL</option>
                                        </select>
                                        <input
                                            type="number"
                                            min="28"
                                            max="50"
                                            value={sizesForm.pants?.number || ''}
                                            onChange={(e) => handleSizeChange('pants.number', e.target.value)}
                                            placeholder="34"
                                            className="w-1/2 px-2 py-2 border border-gray-300 rounded
                                                       focus:outline-none focus:ring-2 focus:ring-primary
                                                       text-sm font-semibold"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Camisa/Chaqueta */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">Camisa/Chaqueta</p>
                                {!isEditingSize ? (
                                    <p className="text-2xl font-bold text-primary">
                                        {auth.sizes?.shirtJacket || '-'}
                                    </p>
                                ) : (
                                    <select
                                        value={sizesForm.shirtJacket || ''}
                                        onChange={(e) => handleSizeChange('shirtJacket', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded
                                                   focus:outline-none focus:ring-2 focus:ring-primary
                                                   text-lg font-semibold"
                                    >
                                        <option value="">-</option>
                                        <option value="XS">XS</option>
                                        <option value="S">S</option>
                                        <option value="M">M</option>
                                        <option value="L">L</option>
                                        <option value="XL">XL</option>
                                        <option value="XXL">XXL</option>
                                        <option value="XXXL">XXXL</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sección de Aprobadores */}
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Users className="w-5 h-5 text-primary" />
                            <h3 className="text-xl font-semibold text-gray-800">Aprobadores</h3>
                        </div>

                        {auth.bosses && auth.bosses.length > 0 ? (
                            <div className="space-y-3">
                                {auth.bosses.map((bossItem, index) => {
                                    const boss = typeof bossItem._id === 'object' ? bossItem._id : null;
                                    return boss ? (
                                        <div
                                            key={boss._id || index}
                                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="p-2 bg-primary rounded-full">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">{boss.name}</p>
                                                <p className="text-sm text-gray-600">{boss.email}</p>
                                            </div>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                <p>No hay aprobadores asignados</p>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}

export default ProfilePage;