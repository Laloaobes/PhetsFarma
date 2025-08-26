import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Estado para manejar errores de login

  // Usuarios hardcodeados con roles para simulación
  const users = {
    'superadmin': { password: 'password', role: 'Super Admin', name: 'Admin General' },
    'admin': { password: 'password', role: 'Admin', name: 'Administrador' },
    'gerente_kiron': { password: 'password', role: 'Gerente de laboratorio', name: 'Gerente Kiron', laboratory: 'Kiron' },
    'gerente_phetsfarma': { password: 'password', role: 'Gerente de laboratorio', name: 'Gerente Phetsfarma', laboratory: 'Phetsfarma' },
    'gerente_vetspharma': { password: 'password', role: 'Gerente de laboratorio', name: 'Gerente Vets Pharma', laboratory: 'Vets Pharma' },
    'coordinador': { password: 'password', role: 'Coordinador', name: 'Coordinador Ventas' },
    'representante1': { password: 'password', role: 'Representante/Promotor', name: 'Representante Ana' },
    'distribuidor1': { password: 'password', role: 'Representante Distribuidor', name: 'Rep. Dist. Carlos' },
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    const user = users[username];

    if (user && user.password === password) {
      onLogin({ username, role: user.role, name: user.name, laboratory: user.laboratory }); // Pasa el objeto de usuario completo
    } else {
      setError('Usuario o contraseña incorrectos.'); // Establecer mensaje de error
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100"> {/* Añadido bg-gray-100 para un fondo más suave */}
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
          {error && <p className="text-red-500 text-sm text-center">{error}</p>} {/* Mostrar error */}
          <button
            type="submit"
            className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            <LogIn className="mr-2" size={20} />
            Acceder
          </button>
        </form>

        {/* Información de cuentas de prueba, adaptada al diseño existente */}
        <div className="mt-8 text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-700 mb-2">Cuentas de prueba:</p>
          <ul className="list-disc list-inside text-left mx-auto max-w-xs">
            <li><span className="font-medium">Super Admin:</span> `superadmin` / `password`</li>
            <li><span className="font-medium">Admin:</span> `admin` / `password`</li>
            <li><span className="font-medium">Gerentes Lab.:</span> `gerente_kiron`, `_phetsfarma`, `_vetspharma` / `password`</li>
            <li><span className="font-medium">Coordinador:</span> `coordinador` / `password`</li>
            <li><span className="font-medium">Representante:</span> `representante1` / `password`</li>
            <li><span className="font-medium">Rep. Distrib.:</span> `distribuidor1` / `password`</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
