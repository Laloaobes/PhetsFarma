import React, { useState } from 'react';
import { Home, ClipboardList, Package, Users, LogOut, FlaskConical, Truck, UserCircle } from 'lucide-react';

export default function AdminPanel({ onNavigate, onLogout, currentView, user }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { name: 'Inicio', view: 'orderForm', icon: <Home size={20} />, roles: ['Super Admin', 'Admin', 'Gerente de laboratorio', 'Coordinador de vendedores', 'Vendedor'] },
    { name: 'Reportes', view: 'reports', icon: <ClipboardList size={20} />, roles: ['Super Admin', 'Admin', 'Gerente de laboratorio', 'Coordinador de vendedores', 'Vendedor'] },
    { name: 'Productos', view: 'manageProducts', icon: <Package size={20} />, roles: ['Super Admin', 'Admin', 'Coordinador de vendedores', 'Gerente de laboratorio'] },
    { name: 'Representante/Promotor', view: 'manageSellers', icon: <UserCircle size={20} />, roles: ['Super Admin', 'Admin', 'Coordinador de vendedores'] }, 
    { name: 'Clientes', view: 'manageClients', icon: <Users size={20} />, roles: ['Super Admin', 'Admin', 'Coordinador de vendedores'] },
    { name: 'Distribuidores', view: 'manageDistributors', icon: <Truck size={20} />, roles: ['Super Admin', 'Admin', 'Coordinador de vendedores'] },
    { name: 'Laboratorios', view: 'manageLaboratories', icon: <FlaskConical size={20} />, roles: ['Super Admin'] },
    { name: 'Usuarios', view: 'manageUsers', icon: <Users size={20} />, roles: ['Super Admin'] },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    onLogout();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <nav className="bg-blue-800 text-white p-4 shadow-md sticky top-0 z-10">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        {/* --- CAMBIO AQUÍ: LOGO AÑADIDO --- */}
        <div className="flex items-center space-x-4">
          {user && <span className="text-sm italic ml-4 hidden md:inline">Bienvenid@, {user.name} ({user.role})</span>}
        </div>

        <div className="flex-grow flex flex-col md:flex-row md:items-center md:justify-end mt-2 md:mt-0 w-full md:w-auto">
          <div className="flex flex-wrap justify-center md:flex-nowrap md:justify-end space-x-1 md:space-x-4 mb-2 md:mb-0">
            {navItems.map((item) => (
              user && item.roles.includes(user.role) && (
                <button
                  key={item.name}
                  onClick={() => onNavigate(item.view)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors 
                                   ${currentView === item.view ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'}
                                   flex-shrink-0
                                   `}
                >
                  {item.icon}
                  <span className="ml-2 hidden xl:inline">{item.name}</span>
                </button>
              )
            ))}
          </div>
          <button
            onClick={handleLogoutClick}
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-red-700 hover:text-white bg-red-600 w-full md:w-auto justify-center md:ml-4"
          >
            <LogOut size={20} />
            <span className="ml-2">Salir</span>
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Confirmar Salida</h3>
            <p className="mb-6 text-gray-700">¿Estás seguro de que quieres salir de la aplicación?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmLogout}
                className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300"
              >
                Confirmar Salida
              </button>
              <button
                onClick={cancelLogout}
                className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}