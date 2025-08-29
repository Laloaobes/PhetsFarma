import React, { useState } from 'react';
import { Plus, Edit, Trash2, User as UserIcon } from 'lucide-react';

export default function UserManagement({ users, handlers, laboratories, user: loggedInUser }) {
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    username: '', 
    role: '', 
    laboratory: '' 
  });

  const availableRoles = [
    'Super Admin', 'Admin', 'Gerente de laboratorio', 'Coordinador de vendedores', 'Vendedor'
  ];

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
    // Cargar los datos del usuario para editar. El ID de Firestore es el email.
    setNewUser({ 
      id: u.id, 
      email: u.id, 
      name: u.name, 
      username: u.username, 
      role: u.role, 
      laboratory: u.laboratory,
      password: '' // La contraseña no se muestra al editar por seguridad
    });
  };

  const handleSaveUser = () => {
    if (editingUser) { // Lógica para actualizar
      if (!newUser.name || !newUser.role) {
        alert('Nombre y Rol son obligatorios para actualizar.');
        return;
      }
      handlers.handleUpdateItem(newUser);
    } else { // Lógica para crear
      if (!newUser.email || !newUser.password || !newUser.name || !newUser.role) {
        alert('Email, Contraseña, Nombre y Rol son obligatorios.');
        return;
      }
      handlers.handleAddItem(newUser);
    }
    handleCancelEdit(); // Limpiar formulario
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewUser({ email: '', password: '', name: '', username: '', role: '', laboratory: '' });
  };

  const handleDeleteClick = (id) => {
    if (window.confirm('¿Estás seguro? Esto eliminará el perfil de la base de datos, pero deberás eliminar el acceso desde la Consola de Firebase Authentication.')) {
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

      <div className="bg-gray-50 p-6 rounded-xl shadow-md mb-8">
        <h3 className="text-xl font-bold text-gray-700 mb-5">{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Email (Login) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email (para login)</label>
            <input type="email" name="email" value={newUser.email} onChange={handleChange} className="w-full p-2.5 border rounded-lg" required disabled={!!editingUser} />
          </div>
          {/* Contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
            <input type="password" name="password" value={newUser.password} onChange={handleChange} className="w-full p-2.5 border rounded-lg" placeholder={editingUser ? "Dejar en blanco para no cambiar" : ""} required={!editingUser}/>
          </div>
           {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
            <input type="text" name="name" value={newUser.name} onChange={handleChange} className="w-full p-2.5 border rounded-lg" required />
          </div>
           {/* Nombre de Usuario */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Usuario</label>
            <input type="text" name="username" value={newUser.username} onChange={handleChange} className="w-full p-2.5 border rounded-lg" required />
          </div>
          {/* Rol */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
            <select name="role" value={newUser.role} onChange={handleChange} className="w-full p-2.5 border rounded-lg" required>
              <option value="">Selecciona un Rol</option>
              {availableRoles.map(role => (<option key={role} value={role}>{role}</option>))}
            </select>
          </div>
          {/* Laboratorio (condicional) */}
          {newUser.role === 'Gerente de laboratorio' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Laboratorio Asignado</label>
              <select name="laboratory" value={newUser.laboratory} onChange={handleChange} className="w-full p-2.5 border rounded-lg" required>
                <option value="">Selecciona Laboratorio</option>
                {laboratories.map(lab => (<option key={lab.id} value={lab.name}>{lab.name}</option>))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          {editingUser && (<button onClick={handleCancelEdit} className="px-5 py-2.5 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400">Cancelar</button>)}
          <button onClick={handleSaveUser} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">{editingUser ? 'Guardar Cambios' : 'Agregar Usuario'}</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-gray-700 mb-5">Lista de Usuarios</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">Email (ID)</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">Rol</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">Laboratorio</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{u.id}</td>
                  <td className="py-3 px-4 text-sm">{u.name}</td>
                  <td className="py-3 px-4 text-sm">{u.role}</td>
                  <td className="py-3 px-4 text-sm">{u.laboratory || 'N/A'}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button onClick={() => handleEditClick(u)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteClick(u.id)} className="text-red-600 hover:red-800 p-1.5 rounded-md hover:bg-red-50"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

