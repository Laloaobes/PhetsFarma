import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import toast from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Por favor, ingresa correo y contraseña.");
            return;
        }

        setIsLoading(true);
        const auth = getAuth();
        try {
            // Inicia sesión con Firebase. Si tiene éxito, el listener en App.js se activará.
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('¡Bienvenido!');
            // No es necesario llamar a onLogin ni manejar el estado del usuario aquí.
        } catch (error) {
            console.error("Error al iniciar sesión:", error.code);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast.error("Correo o contraseña incorrectos.");
            } else {
                toast.error("Ocurrió un error al iniciar sesión.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            toast.error("Por favor, ingresa tu email para restablecer la contraseña.");
            return;
        }

        const auth = getAuth();
        const promise = sendPasswordResetEmail(auth, email);
        
        toast.promise(promise, {
            loading: 'Enviando correo...',
            success: 'Se ha enviado un enlace para restablecer tu contraseña.',
            error: 'No se pudo enviar el correo. Verifica que el email sea correcto.',
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <img
                        src="/grupogarvo.png"
                        alt="Logo"
                        className="w-40 mx-auto mb-4"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <h1 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h1>
                    <p className="text-gray-500">Accede al sistema de pedidos</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 mt-1 text-gray-800 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 mt-1 text-gray-800 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : <LogIn className="mr-2" size={20} />}
                        {isLoading ? "Ingresando..." : "Acceder"}
                    </button>
                </form>
                
                <div className="text-center">
                    <button
                        onClick={handlePasswordReset}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>
            </div>
        </div>
    );
}