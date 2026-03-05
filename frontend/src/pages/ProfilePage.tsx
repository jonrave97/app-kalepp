import { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import type { UserSizes } from '@/types/userSizes';
import { updateUserSizes } from '@/services/authServices';
import { useAuth } from '@/context/Authcontext';
import Swal from 'sweetalert2';

function getInitials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase();
}

function sizesDisplay(sizes?: UserSizes) {
    return {
        footwear: sizes?.footwear || '—',
        gloves: sizes?.gloves || '—',
        pants:
            sizes?.pants?.letter && sizes?.pants?.number
                ? `${sizes.pants.letter} / ${sizes.pants.number}`
                : '—',
        shirtJacket: sizes?.shirtJacket || '—',
    };
}

function ProfilePage() {
    const { auth, setAuth, loading: authLoading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [sizesForm, setSizesForm] = useState<UserSizes>(auth?.sizes || {});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (auth?.sizes) setSizesForm(auth.sizes);
    }, [auth]);

    const handleSizeChange = (field: string, value: string) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setSizesForm(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof UserSizes] as any),
                    [child]: value,
                },
            }));
        } else {
            setSizesForm(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const updatedUser = await updateUserSizes(sizesForm);
            setAuth(updatedUser);
            await Swal.fire({
                icon: 'success',
                title: 'Tallas actualizadas',
                timer: 1800,
                showConfirmButton: false,
            });
            setIsEditing(false);
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'No se pudieron actualizar las tallas',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setSizesForm(auth?.sizes || {});
        setIsEditing(false);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-start justify-center py-16 px-4">
                <div className="w-full max-w-lg animate-pulse space-y-4">
                    <div className="flex flex-col items-center gap-3 pb-2">
                        <div className="w-20 h-20 rounded-full bg-gray-200" />
                        <div className="h-5 bg-gray-200 rounded w-40" />
                        <div className="h-4 bg-gray-200 rounded w-28" />
                    </div>
                    <div className="bg-white rounded-2xl p-6 space-y-4">
                        <div className="h-3 bg-gray-200 rounded w-20 mb-5" />
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between">
                                <div className="h-4 bg-gray-200 rounded w-20" />
                                <div className="h-4 bg-gray-200 rounded w-36" />
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-2xl p-6 space-y-4">
                        <div className="h-3 bg-gray-200 rounded w-20 mb-5" />
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-gray-100 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!auth) return null;

    const sizes = sizesDisplay(auth.sizes);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-lg mx-auto space-y-4">

                {/* Identidad */}
                <div className="flex flex-col items-center gap-1.5 pb-2">
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-white select-none">
                        {getInitials(auth.name)}
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mt-1">{auth.name}</h1>
                    {auth.position && (
                        <span className="text-sm text-gray-500">{auth.position}</span>
                    )}
                </div>

                {/* Información */}
                <div className="bg-white rounded-2xl p-6 space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Información</p>
                    <InfoRow label="Correo" value={auth.email} />
                    {auth.area && <InfoRow label="Área" value={auth.area} />}
                    {auth.company && <InfoRow label="Empresa" value={auth.company} />}
                    {auth.rut && <InfoRow label="RUT" value={auth.rut} />}
                </div>

                {/* Tallas EPP */}
                <div className="bg-white rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tallas EPP</p>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1.5 text-sm text-primary hover:opacity-75 transition-opacity"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Editar
                            </button>
                        ) : (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center gap-1 text-sm font-medium text-primary hover:opacity-75 disabled:opacity-40 transition-opacity"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    {loading ? 'Guardando…' : 'Guardar'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <SizeCard
                            label="Calzado"
                            value={sizes.footwear}
                            editing={isEditing}
                            input={
                                <input
                                    type="number"
                                    min="35"
                                    max="50"
                                    value={sizesForm.footwear || ''}
                                    onChange={e => handleSizeChange('footwear', e.target.value)}
                                    placeholder="38"
                                    className="w-full text-center text-lg font-semibold bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary rounded-lg p-1"
                                />
                            }
                        />
                        <SizeCard
                            label="Guantes"
                            value={sizes.gloves}
                            editing={isEditing}
                            input={
                                <select
                                    value={sizesForm.gloves || ''}
                                    onChange={e => handleSizeChange('gloves', e.target.value)}
                                    className="w-full text-center text-sm font-semibold bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary rounded-lg p-1"
                                >
                                    <option value="">—</option>
                                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            }
                        />
                        <SizeCard
                            label="Pantalón"
                            value={sizes.pants}
                            editing={isEditing}
                            input={
                                <div className="flex gap-1">
                                    <select
                                        value={sizesForm.pants?.letter || ''}
                                        onChange={e => handleSizeChange('pants.letter', e.target.value)}
                                        className="w-1/2 text-center text-sm font-semibold bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary rounded-lg p-1"
                                    >
                                        <option value="">—</option>
                                        {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="28"
                                        max="50"
                                        value={sizesForm.pants?.number || ''}
                                        onChange={e => handleSizeChange('pants.number', e.target.value)}
                                        placeholder="34"
                                        className="w-1/2 text-center text-sm font-semibold bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary rounded-lg p-1"
                                    />
                                </div>
                            }
                        />
                        <SizeCard
                            label="Camisa / Chaqueta"
                            value={sizes.shirtJacket}
                            editing={isEditing}
                            input={
                                <select
                                    value={sizesForm.shirtJacket || ''}
                                    onChange={e => handleSizeChange('shirtJacket', e.target.value)}
                                    className="w-full text-center text-sm font-semibold bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary rounded-lg p-1"
                                >
                                    <option value="">—</option>
                                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            }
                        />
                    </div>
                </div>

                {/* Aprobadores */}
                {auth.bosses && auth.bosses.length > 0 && (
                    <div className="bg-white rounded-2xl p-6">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Aprobadores</p>
                        <div className="space-y-3">
                            {auth.bosses.map((bossItem, index) => {
                                const boss = typeof bossItem._id === 'object' ? bossItem._id : null;
                                if (!boss) return null;
                                return (
                                    <div key={boss._id || index} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                                            {getInitials(boss.name)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 leading-tight">{boss.name}</p>
                                            <p className="text-xs text-gray-500">{boss.email}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm text-gray-500 shrink-0">{label}</span>
            <span className="text-sm text-gray-800 text-right">{value}</span>
        </div>
    );
}

function SizeCard({
    label,
    value,
    editing,
    input,
}: {
    label: string;
    value: string;
    editing: boolean;
    input: React.ReactNode;
}) {
    return (
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1 min-h-[72px]">
            <span className="text-xs text-gray-400">{label}</span>
            {!editing ? (
                <span className="text-2xl font-bold text-primary leading-tight">{value}</span>
            ) : (
                <div className="mt-1">{input}</div>
            )}
        </div>
    );
}

export default ProfilePage;