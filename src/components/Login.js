import React, { useState } from 'react';
import { auth, db } from '../firebase'; // Importa auth y db de tu archivo de configuración
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { LogIn } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }

    try {
      // 1. Intenta iniciar sesión con el servicio de Autenticación de Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const authUser = userCredential.user;

      // 2. Si el login es exitoso, busca los datos adicionales (rol, nombre) en Firestore
      const userDocRef = doc(db, "users", authUser.email); // Usa el email como ID para buscar
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // 3. Combina los datos de Auth y Firestore y los envía a App.js
        const userData = userDoc.data();
        onLogin({
          uid: authUser.uid,
          email: authUser.email,
          ...userData // Esto añade name, role, laboratory, etc.
        });
      } else {
        setError("No se encontraron datos de rol para este usuario.");
      }

    } catch (err) {
      // Manejo de errores comunes de Firebase Auth
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError("Ocurrió un error al iniciar sesión.");
        console.error(err);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <img
             src="/grupogarvo.png"
            alt="Logo"
            className="w-40 mx-auto mb-4"
            onError={(e) => { e.currentTarget.src = "https://placehold.co/200x80?text=Logo"; }}
          />
          <h1 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h1>
          <p className="text-gray-500">Accede al sistema de pedidos</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-bold text-gray-600 block">Correo Electrónico</label>
            <input
              type="email" // Cambiado de 'text' a 'email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 mt-1 text-gray-800 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="superadmin@test.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 mt-1 text-gray-800 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            <LogIn className="mr-2" size={20} />
            Acceder
          </button>
        </form>
      </div>
    </div>
  );
}
