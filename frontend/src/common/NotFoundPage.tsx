import { useNavigate } from 'react-router-dom';

function NotFoundPage() 
{
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Logo */}
                <div className="mb-8">
                    <img
                        src="/kaltire.png"
                        alt="Kaltire Logo"
                        className="mx-auto h-16 w-auto mb-4"
                    />
                </div>

                {/* Contenido */}
                <div className="bg-white shadow-2xl rounded-xl px-8 py-10">
                    {/* Número 404 */}
                    <div className="mb-6">
                        <h1 className="text-9xl font-bold text-primary mb-2">404</h1>
                        <div className="h-1 w-20 bg-primary mx-auto rounded"></div>
                    </div>

                    {/* Mensaje */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Página no encontrada
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Lo sentimos, la página que estás buscando no existe o ha sido movida.
                    </p>

                    {/* Botones */}
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition duration-200 cursor-pointer"
                        >
                            Volver al inicio
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-200 cursor-pointer"
                        >
                            Volver atrás
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-gray-500 text-sm mt-6">
                    Si crees que esto es un error, por favor contacta al administrador.
                </p>
            </div>
        </div>
    );
}

export default NotFoundPage;