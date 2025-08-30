import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';

export default function GenericManagement({ items, handlers, itemName, user }) {
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Lógica de permisos consolidada: Ahora los roles 'Admin' y 'Coordinador' también pueden gestionar Laboratorios y Usuarios.
  const canAddEditDelete = user && ['Super Admin', 'Admin', 'Coordinador'].includes(user.role);

  const handleAddItem = () => {
    if (newItemName.trim() && canAddEditDelete) {
      handlers.handleAddItem({ name: newItemName });
      setNewItemName('');
    } else if (!canAddEditDelete) {
      setModalMessage(`No tienes permiso para agregar un nuevo ${itemName}.`);
      setShowModal(true);
    }
  };

  const handleUpdateItem = () => {
    if (editingItem && newItemName.trim() && canAddEditDelete) {
      handlers.handleUpdateItem({ ...editingItem, name: newItemName });
      setEditingItem(null);
      setNewItemName('');
    } else if (!canAddEditDelete) {
      setModalMessage(`No tienes permiso para editar este ${itemName}.`);
      setShowModal(true);
    }
  };

  const handleDeleteItem = (id) => {
    if (canAddEditDelete) {
      handlers.handleDeleteItem(id);
    } else {
      setModalMessage(`No tienes permiso para eliminar este ${itemName}.`);
      setShowModal(true);
    }
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <h3 className="text-lg font-bold mb-4">Acción Denegada</h3>
            <p className="mb-4">{modalMessage}</p>
            <button onClick={() => setShowModal(false)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Entendido</button>
          </div>
        </div>
      )}
      <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de {itemName}s</h2>

        {canAddEditDelete && (
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
              {editingItem ? <><Check size={20} className="mr-2" /> Guardar</> : <><Plus size={20} className="mr-2" /> Agregar</>}
            </button>
            {editingItem && (
                <button
                onClick={() => { setEditingItem(null); setNewItemName(''); }}
                className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 flex items-center justify-center w-full sm:w-auto"
                >
                    <X size={20} className="mr-2" /> Cancelar
                </button>
            )}
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
                    {canAddEditDelete && (
                      <>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setNewItemName(item.name);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                    {!canAddEditDelete && <span className="text-gray-500 text-xs">Sin acciones</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p className="text-center text-gray-500 mt-6">No hay {itemName}s registrados.</p>
        )}
      </div>
    </>
  );
}
