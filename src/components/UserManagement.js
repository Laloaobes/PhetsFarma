import React, { useState } from 'react';
import { Edit, Trash2, User as UserIcon } from 'lucide-react';

export default function UserManagement({ users, handlers, laboratories, user: loggedInUser }) {
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', name: '', username: '', role: '', laboratory: '' });

  const availableRoles = ['Admin', 'Gerente de laboratorio', 'Coordinador de vendedores', 'Vendedor'];

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
    setNewUser({ email: u.id, name: u.name, username: u.username, role: u.role, laboratory: u.laboratory || '' });
  };

  const clearForm = () => {
    setEditingUser(null);
    setNewUser({ email: '', name: '', username: '', role: '', laboratory: '' });
  };

  const handleSaveUser = () => {
    if (!newUser.email || !newUser.name || !newUser.username || !newUser.role) {
      alert('Los campos Email, Nombre, Usuario y Rol son obligatorios.');
      return;
    }
    if (newUser.role === 'Gerente de laboratorio' && !newUser.laboratory) {
      alert('Un Gerente de laboratorio debe tener un laboratorio asignado.');
      return;
    }

    if (editingUser) {
      handlers.handleUpdateItem({ ...newUser, id: editingUser.id }); // Pasa el id (email) para la actualización
    } else {
      handlers.handleAddItem(newUser);
    }
    clearForm();
  };

  const handleDeleteClick = (userId) => {
    if (window.confirm('¿Estás seguro? Esto eliminará los datos del usuario, pero deberás borrar su acceso (login) manualmente desde la consola de Firebase.')) {
      handlers.handleDeleteItem(userId);
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

      {/* Formulario de Agregar/Editar */}
      <div className="bg-gray-50 p-6 rounded-xl shadow-md mb-8">
        <h3 className="text-xl font-bold text-gray-700 mb-5">{editingUser ? 'Editar Usuario' : 'Agregar Datos de Usuario'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email (Login)</label>
            <input type="email" name="email" value={newUser.email} onChange={handleChange} className="w-full p-2.5 border rounded-lg" required disabled={!!editingUser} />
            
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
            <input type="text" name="name" value={newUser.name} onChange={handleChange} className="w-full p-2.5 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Usuario</label>
            <input type="text" name="username" value={newUser.username} onChange={handleChange} className="w-full p-2.5 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
            <select name="role" value={newUser.role} onChange={handleChange} className="w-full p-2.5 border rounded-lg bg-white" required>
              <option value="">Selecciona un Rol</option>
              {availableRoles.map(role => (<option key={role} value={role}>{role}</option>))}
            </select>
          </div>
          {newUser.role === 'Gerente de laboratorio' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Laboratorio Asignado</label>
              <select name="laboratory" value={newUser.laboratory} onChange={handleChange} className="w-full p-2.5 border rounded-lg bg-white" required>
                <option value="">Selecciona Laboratorio</option>
                {laboratories.map(lab => (<option key={lab.id} value={lab.name}>{lab.name}</option>))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          {editingUser && (<button onClick={clearForm} className="px-5 py-2.5 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400">Cancelar</button>)}
          <button onClick={handleSaveUser} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">{editingUser ? 'Guardar Cambios' : 'Guardar Usuario'}</button>
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Email (ID)</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Laboratorio</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{u.id}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.laboratory || 'N/A'}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => handleEditClick(u)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteClick(u.id)} className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
