import {useLogin} from '@hooks/auth/useLogin';

function LoginPage()
{
	   // Usamos el hook personalizado para manejar el login
    const { email, setEmail, password, setPassword, loading,handleLogin } = useLogin();
	return (
		        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img
                        src="/kaltire.png"
                        alt="Kaltire Logo"
                        className="mx-auto h-16 w-auto mb-4"
                    />
                </div>

                {/* Formulario */}
                <div className="bg-white shadow-2xl rounded-xl px-8 py-10">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h1>
                        <p className="text-gray-600">Ingresa tus credenciales para acceder a tu cuenta</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="correo@correo.com"
                                
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
                            />
                        <a href="/forgot-password" className="text-sm  text-gray-600 hover:underline  ">Olvidaste tu contraseña?</a>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg transition duration-200 cursor-pointer" 
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
		);
}

export default LoginPage;	