import { useState } from 'react';
import { forgotPassword } from '@/services/authServices';

function ForgotPassword() {
    const [email, setEmail]     = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent]       = useState(false);
    const [error, setError]     = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) { setError('Ingresa tu correo electrónico'); return; }
        try {
            setLoading(true);
            setError('');
            await forgotPassword(email.trim().toLowerCase());
            setSent(true);
        } catch {
            setError('Ocurrió un error. Inténtalo de nuevo.');
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
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Contraseña</h1>
                        <p className="text-gray-600">
                            {sent
                                ? 'Revisa tu correo. Si el email existe, recibirás un enlace en breve.'
                                : 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.'}
                        </p>
                    </div>

                    {!sent && (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="mb-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="correo@correo.com"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError(''); }}
                                    autoComplete="email"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
                                />
                                {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
                            </div>
                            <div className="my-1">
                                <a href="/" className="text-sm text-gray-600 hover:underline transition-colors cursor-pointer">
                                    ¿Ya tienes una cuenta? Inicia sesión
                                </a>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg transition duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
                            </button>
                        </form>
                    )}

                    {sent && (
                        <div className="text-center mt-4">
                            <a href="/login" className="text-sm text-primary hover:underline cursor-pointer">
                                Volver al inicio de sesión
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default ForgotPassword;