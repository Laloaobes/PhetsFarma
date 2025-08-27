import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

// Acepta 'users' como una prop del componente padre (App.js)
export default function Login({ onLogin, users: allUsersFromProps }) { // Renombre la prop para evitar confusión
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Estado para manejar errores de login

  // Credenciales hardcodeadas INTERNAMENTE para las cuentas de prueba.
  // Esto asegura que el login funcione con las cuentas mostradas,
  // independientemente de lo que venga en 'allUsersFromProps'.
  const internalTestUsers = [
    { id: 1, username: 'superadmin', password: 'password', name: 'Admin General', role: 'Super Admin' },
    { id: 2, username: 'admin', password: 'password', name: 'Administrador', role: 'Admin' },
    { id: 3, username: 'gerente_kiron', password: 'password', name: 'Gerente Kiron', role: 'Gerente de laboratorio', laboratory: 'Kiron' },
    { id: 4, username: 'gerente_petspharma', password: 'password', name: 'Gerente Pets Pharma', role: 'Gerente de laboratorio', laboratory: 'Pets Pharma' },
    { id: 5, username: 'gerente_vetspharma', password: 'password', name: 'Gerente Vets Pharma', role: 'Gerente de laboratorio', laboratory: 'Vets Pharma' },
    { id: 6, username: 'coordinador_ventas', password: 'password', name: 'Coordinador Ventas', role: 'Coordinador de vendedores' },
    { id: 7, username: 'vendedor_ana', password: 'password', name: 'Vendedor Ana', role: 'Vendedor' },
    { id: 8, username: 'vendedor_carlos', password: 'password', name: 'Vendedor Carlos', role: 'Vendedor' },
  ];

  // Crear un mapa para una búsqueda eficiente de los usuarios de prueba internos
  const userMap = internalTestUsers.reduce((acc, user) => {
    acc[user.username] = user;
    return acc;
  }, {});

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    const user = userMap[username]; // Buscar usuario en el mapa de usuarios internos

    if (user && user.password === password) {
      // Pasa el objeto de usuario completo para el login
      onLogin({ username: user.username, role: user.role, name: user.name, laboratory: user.laboratory });
    } else {
      setError('Usuario o contraseña incorrectos.'); // Establecer mensaje de error
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
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

        {/* Información de cuentas de prueba, ahora hardcodeada como texto estático */}
        <div className="mt-8 text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-700 mb-2">Cuentas de prueba:</p>
          <ul className="list-disc list-inside text-left mx-auto max-w-xs">
            <li><span className="font-medium">Super Admin:</span> `superadmin` / `password`</li>
            <li><span className="font-medium">Admin:</span> `admin` / `password`</li>
            <li><span className="font-medium">Gerente de laboratorio Kiron:</span> `gerente_kiron` / `password`</li>
            <li><span className="font-medium">Gerente de laboratorio Pets Pharma:</span> `gerente_petspharma` / `password`</li>
            <li><span className="font-medium">Gerente de laboratorio Vets Pharma:</span> `gerente_vetspharma` / `password`</li>
            <li><span className="font-medium">Coordinador de vendedores:</span> `coordinador_ventas` / `password`</li>
            <li><span className="font-medium">Vendedor Ana:</span> `vendedor_ana` / `password`</li>
            <li><span className="font-medium">Vendedor Carlos:</span> `vendedor_carlos` / `password`</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
