import React, { useState } from 'react';
import { Plus, Edit, Trash2, User as UserIcon } from 'lucide-react';

export default function UserManagement({ users, handlers, laboratories, user: loggedInUser }) {
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ id: null, username: '', password: '', role: '', laboratory: '' }); // 'name' field removed

  // Roles disponibles para la creación y edición de usuarios
  const availableRoles = [
    'Super Admin',
    'Admin',
    'Gerente de laboratorio',
    'Coordinador de vendedores', // Rol actualizado
    'Vendedor', // Nuevo rol consolidado
  ];

  // Solo Super Admin puede gestionar usuarios
  if (loggedInUser.role !== 'Super Admin') {
    return (
      <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Usuarios</h2>
        <p className="text-red-500">No tienes permiso para gestionar usuarios.</p>
      </div>
    );
  }

  const handleEditClick = (u) => {
    setEditingUser(u);
    // Cargar los datos del usuario para editar, excluyendo 'name' si ya no existe en el modelo
    setNewUser({ id: u.id, username: u.username, password: u.password, role: u.role, laboratory: u.laboratory });
  };

  const handleSaveUser = () => {
    // Validar campos obligatorios (ahora sin 'name')
    if (!newUser.username || !newUser.password || !newUser.role) {
      alert('Todos los campos de usuario (Nombre de Usuario, Contraseña, Rol) son obligatorios.');
      return;
    }

    if (newUser.role === 'Gerente de laboratorio' && !newUser.laboratory) {
      alert('Un Gerente de laboratorio debe tener un laboratorio asignado.');
      return;
    }

    if (editingUser) {
      handlers.handleUpdateItem(newUser);
    } else {
      handlers.handleAddItem({ ...newUser, id: Date.now() }); // Asignar un ID único para nuevos usuarios
    }
    setEditingUser(null);
    setNewUser({ id: null, username: '', password: '', role: '', laboratory: '' }); // Resetear formulario
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewUser({ id: null, username: '', password: '', role: '', laboratory: '' }); // Resetear formulario
  };

  const handleDeleteClick = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      handlers.handleDeleteItem(id);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <UserIcon className="mr-3 text-blue-500" /> Gestión de Usuarios
      </h2>

      {/* Contenedor del Formulario de Agregar/Editar Usuario */}
      <div className="bg-gray-50 p-6 rounded-xl shadow-md mb-8">
        <h3 className="text-xl font-bold text-gray-700 mb-5">{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Nombre de Usuario */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Usuario</label>
            <input
              type="text"
              name="username"
              value={newUser.username}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              required
              disabled={editingUser ? true : false} 
            />
          </div>
          {/* Contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              required
            />
          </div>
          {/* Rol */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
            <select
              name="role"
              value={newUser.role}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              required
            >
              <option value="">Selecciona un Rol</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          {/* Laboratorio Asignado (condicional) */}
          {newUser.role === 'Gerente de laboratorio' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Laboratorio Asignado</label>
              <select
                name="laboratory"
                value={newUser.laboratory}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                required
              >
                <option value="">Selecciona Laboratorio</option>
                {laboratories.map(lab => (
                  <option key={lab.id} value={lab.name}>{lab.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          {editingUser && (
            <button
              onClick={handleCancelEdit}
              className="px-5 py-2.5 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition duration-150 ease-in-out shadow-sm"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSaveUser}
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out shadow-md"
          >
            {editingUser ? 'Guardar Cambios' : 'Agregar Usuario'}
          </button>
        </div>
      </div>

      {/* Contenedor de la Lista de Usuarios */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-gray-700 mb-5">Lista de Usuarios</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">ID</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Usuario</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Rol</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Laboratorio</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition duration-150 ease-in-out`}>
                  <td className="py-3 px-4 text-sm text-gray-800">{u.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{u.username}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{u.role}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{u.laboratory || 'N/A'}</td>
                  <td className="py-3 px-4 text-right text-sm text-gray-800 space-x-2">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition duration-150 ease-in-out"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(u.id)}
                      className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 transition duration-150 ease-in-out"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <p className="text-center text-gray-500 mt-6 p-4 border rounded-lg bg-gray-50">No hay usuarios registrados.</p>
        )}
      </div>
    </div>
  );
}
