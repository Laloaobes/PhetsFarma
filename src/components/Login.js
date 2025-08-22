import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <img
            src="/LogoPets-1-1.png"
            alt="Logo"
            className="w-40 mx-auto mb-4"
            onError={(e) => {
            e.currentTarget.src = "https://placehold.co/200x80?text=Logo";
            }}
          />
          <h1 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h1>
          <p className="text-gray-500">Accede al sistema de pedidos</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-bold text-gray-600 block">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 mt-1 text-gray-800 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
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
            />
          </div>
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
