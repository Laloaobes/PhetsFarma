import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function GenericManagement({ items, handlers, itemName, user }) {
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  // Permisos basados en el rol
  const canAdd = user && ['Super Admin', 'Admin', 'Coordinador'].includes(user.role);
  const canEdit = user && ['Super Admin', 'Admin', 'Coordinador'].includes(user.role);
  const canDelete = user && ['Super Admin', 'Admin', 'Coordinador'].includes(user.role);
  
  // Excepción: Solo Super Admin puede gestionar Laboratorios
  if (itemName === 'Laboratorio' && user && user.role !== 'Super Admin') {
    return (
      <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de {itemName}s</h2>
        <p className="text-red-500">No tienes permiso para gestionar {itemName}s.</p>
      </div>
    );
  }

  // Excepción: Solo Super Admin puede gestionar Usuarios (actualmente solo es visible, la funcionalidad es mock)
  if (itemName === 'Usuario' && user && user.role !== 'Super Admin') {
    return (
      <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Usuarios</h2>
        <p className="text-red-500">No tienes permiso para gestionar Usuarios.</p>
      </div>
    );
  }

  const handleAddItem = () => {
    if (newItemName.trim() && canAdd) {
      handlers.handleAddItem({ name: newItemName });
      setNewItemName('');
    } else if (!canAdd) {
      alert('No tienes permiso para agregar nuevos ítems.');
    }
  };

  const handleUpdateItem = () => {
    if (editingItem && newItemName.trim() && canEdit) {
      handlers.handleUpdateItem({ ...editingItem, name: newItemName });
      setEditingItem(null);
      setNewItemName('');
    } else if (!canEdit) {
      alert('No tienes permiso para editar ítems.');
    }
  };

  const handleDeleteItem = (id) => {
    if (canDelete) {
      handlers.handleDeleteItem(id);
    } else {
      alert('No tienes permiso para eliminar ítems.');
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de {itemName}</h2>

      {canAdd && (
        <div className="mb-6 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <input
            type="text"
            placeholder={`Nuevo ${itemName}`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full sm:flex-grow p-2 border rounded-md"
          />
          <button
            onClick={editingItem ? handleUpdateItem : handleAddItem}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center w-full sm:w-auto"
          >
            {editingItem ? <Edit size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />}
            {editingItem ? `Guardar ${itemName}` : `Agregar ${itemName}`}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-800">{item.id}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{item.name}</td>
                <td className="py-3 px-4 text-right text-sm text-gray-800">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setNewItemName(item.name);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Editar
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  )}
                  {!canEdit && !canDelete && <span className="text-gray-500 text-xs">Sin acciones</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && (
        <p className="text-center text-gray-500 mt-6">No hay {itemName} registrados.</p>
      )}
    </div>
  );
}
