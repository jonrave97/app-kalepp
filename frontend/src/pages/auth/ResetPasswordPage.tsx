import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '@/services/authServices';

function ResetPasswordPage() {
    const { token }             = useParams<{ token: string }>();
    const navigate              = useNavigate();
    const [password, setPassword]       = useState('');
    const [confirm, setConfirm]         = useState('');
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');
    const [success, setSuccess]         = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
        if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }

        try {
            setLoading(true);
            setError('');
            await resetPassword(token!, password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al restablecer la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <img src="/kaltire.png" alt="Kaltire Logo" className="mx-auto h-16 w-auto mb-4" />
                </div>

                <div className="bg-white shadow-2xl rounded-xl px-8 py-10">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nueva contraseña</h1>
                        <p className="text-gray-600">
                            {success
                                ? 'Tu contraseña fue actualizada correctamente.'
                                : 'Ingresa tu nueva contraseña.'}
                        </p>
                    </div>

                    {!success ? (
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nueva contraseña
                                </label>
                                <input
                                    type="password"
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    autoComplete="new-password"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirmar contraseña
                                </label>
                                <input
                                    type="password"
                                    placeholder="Repite la contraseña"
                                    value={confirm}
                                    onChange={e => { setConfirm(e.target.value); setError(''); }}
                                    autoComplete="new-password"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
                                />
                                {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg transition duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Guardando...' : 'Cambiar contraseña'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center mt-2">
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary bg-primary text-white font-semibold py-3 px-8 rounded-lg transition duration-200 cursor-pointer"
                            >
                                Ir al inicio de sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
