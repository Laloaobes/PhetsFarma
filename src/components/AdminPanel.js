import React, { useState } from 'react'; // Importar useState
import { Home, ClipboardList, Package, Users, Settings, LogOut, FlaskConical, Truck, UserCircle } from 'lucide-react'; 

export default function AdminPanel({ onNavigate, onLogout, currentView, user }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // Estado para controlar la visibilidad de la modal de confirmación

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
    setShowLogoutConfirm(true); // Mostrar la modal de confirmación al hacer clic en Salir
  };

  const confirmLogout = () => {
    onLogout(); // Llamar a la función de logout si se confirma
    setShowLogoutConfirm(false); // Cerrar la modal
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false); // Solo cerrar la modal si se cancela
  };

  return (
    <nav className="bg-blue-800 text-white p-4 shadow-md sticky top-0 z-10">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        {/* Sección Izquierda: Marca y Usuario */}
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold">Sistema de Pedidos</span>
          {user && <span className="text-sm italic ml-4 hidden md:inline">Bienvenido, {user.name} ({user.role})</span>} {/* El mensaje de bienvenida es visible en tabletas (md) y superiores */}
        </div>

        {/* Sección Derecha: Navegación y Salir */}
        <div className="flex-grow flex flex-col md:flex-row md:items-center md:justify-end mt-2 md:mt-0 w-full md:w-auto">
          <div className="flex flex-wrap justify-center md:flex-nowrap md:justify-end space-x-1 md:space-x-4 mb-2 md:mb-0">
            {navItems.map((item) => (
              user && item.roles.includes(user.role) && (
                <button
                  key={item.name}
                  onClick={() => onNavigate(item.view)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors 
                              ${currentView === item.view ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'}
                              ${user && user.role !== 'Super Admin' && item.view === 'manageLaboratories' ? 'opacity-50 cursor-not-allowed' : ''}
                              ${user && user.role !== 'Super Admin' && item.view === 'manageUsers' ? 'opacity-50 cursor-not-allowed' : ''}
                              flex-shrink-0
                              `}
                  disabled={ (user && user.role !== 'Super Admin' && (item.view === 'manageLaboratories' || item.view === 'manageUsers')) }
                >
                  {item.icon}
                  <span className="ml-2 hidden xl:inline">{item.name}</span> {/* CAMBIO: Texto visible solo en pantallas extra-grandes (xl) y superiores */}
                </button>
              )
            ))}
          </div>
          <button
            onClick={handleLogoutClick} // Llama a handleLogoutClick para mostrar la confirmación
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-red-700 hover:text-white bg-red-600 w-full md:w-auto justify-center md:ml-4"
          >
            <LogOut size={20} />
            <span className="ml-2">Salir</span> {/* Siempre visible */}
          </button>
        </div>
      </div>

      {/* Modal de Confirmación de Salida */}
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
