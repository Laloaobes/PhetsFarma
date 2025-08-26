import React from 'react';
import { Home, ClipboardList, Package, Users, Settings, LogOut, FlaskConical, Truck, UserCircle } from 'lucide-react'; 

export default function AdminPanel({ onNavigate, onLogout, currentView, user }) {
  const navItems = [
    { name: 'Inicio', view: 'orderForm', icon: <Home size={20} />, roles: ['Super Admin', 'Admin', 'Gerente de laboratorio', 'Coordinador de vendedores', 'Vendedor'] },
    { name: 'Reportes', view: 'reports', icon: <ClipboardList size={20} />, roles: ['Super Admin', 'Admin', 'Gerente de laboratorio', 'Coordinador de vendedores', 'Vendedor'] },
    // Gestionar Productos: Gerente de laboratorio puede ver/agregar, pero no editar precio.
    { name: 'Gestionar Productos', view: 'manageProducts', icon: <Package size={20} />, roles: ['Super Admin', 'Admin', 'Coordinador de vendedores', 'Gerente de laboratorio'] },
    // Gestionar Vendedores: El rol "Representante/Promotor" se llama ahora "Vendedor" y se gestiona aquí.
    { name: 'Gestionar Vendedores', view: 'manageSellers', icon: <UserCircle size={20} />, roles: ['Super Admin', 'Admin', 'Coordinador de vendedores'] }, 
    { name: 'Gestionar Clientes', view: 'manageClients', icon: <Users size={20} />, roles: ['Super Admin', 'Admin', 'Coordinador de vendedores'] },
    { name: 'Gestionar Distribuidores', view: 'manageDistributors', icon: <Truck size={20} />, roles: ['Super Admin', 'Admin', 'Coordinador de vendedores'] },
    { name: 'Gestionar Laboratorios', view: 'manageLaboratories', icon: <FlaskConical size={20} />, roles: ['Super Admin'] }, // Solo Super Admin
    { name: 'Gestionar Usuarios', view: 'manageUsers', icon: <Users size={20} />, roles: ['Super Admin'] }, // Solo Super Admin
  ];

  return (
    <nav className="bg-blue-800 text-white p-4 shadow-md sticky top-0 z-10">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold">SalesApp</span>
          {user && <span className="text-sm italic ml-4">Bienvenido, {user.name} ({user.role})</span>}
        </div>
        <div className="flex-grow flex justify-center md:flex-grow-0 md:justify-end mt-2 md:mt-0">
          <div className="flex flex-wrap justify-center md:justify-end space-x-2 md:space-x-4">
            {navItems.map((item) => (
              user && item.roles.includes(user.role) && (
                <button
                  key={item.name}
                  onClick={() => onNavigate(item.view)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === item.view ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2 hidden sm:inline">{item.name}</span>
                </button>
              )
            ))}
            <button
              onClick={onLogout}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-red-700 hover:text-white bg-red-600"
            >
              <LogOut size={20} />
              <span className="ml-2 hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
