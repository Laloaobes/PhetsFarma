import React, { useState } from 'react';
import { LogIn, Loader2, Mail, ArrowLeft } from 'lucide-react'; // Importamos más iconos
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import toast from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Estados para el formulario de restablecer contraseña
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [emailForReset, setEmailForReset] = useState('');
    const [isResetLoading, setIsResetLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Por favor, ingresa correo y contraseña.");
            return;
        }

        setIsLoading(true);
        const auth = getAuth();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Éxito. App.js se encargará del resto.
        } catch (error) {
            console.error("Error al iniciar sesión:", error.code);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast.error("Correo o contraseña incorrectos.");
            } else if (error.code === 'auth/too-many-requests') {
                toast.error("Demasiados intentos. Tu cuenta ha sido bloqueada temporalmente.");
            } else {
                toast.error("Ocurrió un error al iniciar sesión.");
            }
            setIsLoading(false); // Detener la carga solo si hay error
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!emailForReset) {
            toast.error("Por favor, ingresa tu email.");
            return;
        }

        setIsResetLoading(true);
        const auth = getAuth();
        try {
            await sendPasswordResetEmail(auth, emailForReset);
            toast.success('Correo enviado. Revisa tu bandeja de entrada.');
            setShowPasswordReset(false);
            setEmailForReset('');
        } catch (error) {
            console.error("Error al enviar correo de restablecimiento:", error);
            if (error.code === 'auth/user-not-found') {
                toast.error("No se encontró un usuario con ese correo.");
            } else {
                toast.error('No se pudo enviar el correo.');
            }
        }
        setIsResetLoading(false);
    };

    return (
        // --- Contenedor Principal ---
        // Centra todo vertical y horizontalmente con un fondo de gradiente
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-gray-100">
            
            {/* --- Tarjeta de Login --- */}
            <div className="w-full max-w-md p-8 md:p-10 bg-white rounded-2xl shadow-xl border border-gray-200">
                
                {/* --- Logo y Título --- */}
                <div className="text-center mb-8">
                    <img
                        src="/grupogarvo.png" // Asumiendo que está en la carpeta /public
                        alt="Logo"
                        className="w-32 md:w-40 mx-auto mb-5"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <h1 className="text-3xl font-bold text-gray-900">
                        {showPasswordReset ? "Restablecer" : "Bienvenido"}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {showPasswordReset ? "Ingresa tu correo para recibir un enlace y revisa en tu carpeta SPAM" : "Accede al sistema de pedidos"}
                    </p>
                </div>

                {/* --- Formulario de Login --- */}
                {!showPasswordReset ? (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : <LogIn className="mr-2" size={20} />}
                            {isLoading ? "Ingresando..." : "Acceder"}
                        </button>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setShowPasswordReset(true)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    </form>
                ) : (
                    // --- Formulario de Restablecer Contraseña ---
                    <form className="space-y-6" onSubmit={handlePasswordReset}>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                value={emailForReset}
                                onChange={(e) => setEmailForReset(e.target.value)}
                                className="w-full p-3 text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="tu.correo@ejemplo.com"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isResetLoading}
                            className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition disabled:bg-gray-300 shadow-lg hover:shadow-gray-500/30 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            {isResetLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Mail className="mr-2" size={20} />}
                            {isResetLoading ? "Enviando..." : "Enviar Correo"}
                        </button>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setShowPasswordReset(false)}
                                className="text-sm font-medium text-gray-600 hover:text-gray-500 transition-colors flex items-center justify-center mx-auto"
                            >
                                <ArrowLeft size={16} className="mr-1" /> Volver a Iniciar Sesión
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}