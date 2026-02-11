function ForgotPassword() {
    return (<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
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
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Contraseña</h1>
                        <p className="text-gray-600">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña</p>
                    </div>

                    <form className="space-y-6" >                  
                        <div className="mb-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="correo@correo.com"
                                
                                value=''
                                
                                autoComplete="email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
                            />
                        </div>   
                        <div className="my-1">
                            <a href="/" className=" text-sm  text-gray-600 hover:underline">Ya tienes una cuenta? Inicia sesión</a>       
                        </div>
                        <button
                            type="submit"
                            className="btn-primary w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg transition duration-200 cursor-pointer" 
                        >
                            Enviar enlace de restablecimiento
                        </button>
                    </form>
                </div>
            </div>
        </div>);
}
export default ForgotPassword;