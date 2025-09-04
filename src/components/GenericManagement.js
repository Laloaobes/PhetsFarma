import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';

// --- Sub-componente para la vista móvil ---

// Tarjeta para mostrar un item en la lista en pantallas pequeñas (Diseño mejorado)
const ItemCard = ({ item, index, onEdit, onDelete, canAddEditDelete }) => (
    <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-200">
        {/* Elemento de numeración para reemplazar el ID */}
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-600 font-bold rounded-full text-sm">
            {index + 1}
        </div>
        <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-800 text-md break-words">{item.name}</p>
        </div>
        {canAddEditDelete && (
            <div className="flex items-center space-x-1 flex-shrink-0">
                <button 
                    onClick={onEdit} 
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                    aria-label="Editar"
                >
                    <Edit size={18} />
                </button>
                <button 
                    onClick={onDelete} 
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                    aria-label="Eliminar"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        )}
    </div>
);


// --- Componente Principal ---

export default function GenericManagement({ items, handlers, itemName, user }) {
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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
      if (window.confirm(`¿Estás seguro de que deseas eliminar este ${itemName}?`)) {
        handlers.handleDeleteItem(id);
      }
    } else {
      setModalMessage(`No tienes permiso para eliminar este ${itemName}.`);
      setShowModal(true);
    }
  };
  
  const handleEditClick = (item) => {
    setEditingItem(item);
    setNewItemName(item.name);
    // En móvil, el scroll ayuda. En PC no es necesario pero no afecta.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Acción Denegada</h3>
            <p className="mb-4 text-gray-600">{modalMessage}</p>
            <button onClick={() => setShowModal(false)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Entendido</button>
          </div>
        </div>
      )}

      {/* --- VISTA PARA MÓVIL Y TABLET (DISEÑO SEPARADO) --- */}
      <div className="space-y-6 lg:hidden">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de {itemName}s</h2>
        
        {canAddEditDelete && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{editingItem ? `Editando: "${editingItem.name}"` : `Agregar Nuevo ${itemName}`}</h3>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input type="text" placeholder={`Nombre del ${itemName}`} value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full sm:flex-grow p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"/>
              <button onClick={editingItem ? handleUpdateItem : handleAddItem} className="bg-blue-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center w-full sm:w-auto">
                {editingItem ? <><Check size={20} className="mr-2" /> Guardar</> : <><Plus size={20} className="mr-2" /> Agregar</>}
              </button>
              {editingItem && (
                <button onClick={() => { setEditingItem(null); setNewItemName(''); }} className="bg-gray-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-gray-700 transition duration-300 flex items-center justify-center w-full sm:w-auto">
                  <X size={20} className="mr-2" /> Cancelar
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Lista de {itemName}s</h3>
            <div className="space-y-3">
                {items.map((item, index) => (
                    <ItemCard key={item.id} item={item} index={index} onEdit={() => handleEditClick(item)} onDelete={() => handleDeleteItem(item.id)} canAddEditDelete={canAddEditDelete} />
                ))}
            </div>
            {items.length === 0 && (
              <div className="text-center text-gray-500 mt-6 py-10"><p>No hay {itemName}s registrados.</p></div>
            )}
        </div>
      </div>

      {/* --- VISTA PARA DESKTOP (DISEÑO ORIGINAL UNIFICADO Y MÁS GRANDE) --- */}
      <div className="hidden lg:block p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Gestión de {itemName}s</h2>

        {canAddEditDelete && (
          <div className="mb-8 flex flex-col sm:flex-row items-center gap-4">
            <input type="text" placeholder={`Nuevo ${itemName}`} value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full sm:flex-grow p-3 border rounded-lg text-base"/>
            <button onClick={editingItem ? handleUpdateItem : handleAddItem} className="text-base bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center w-full sm:w-auto shrink-0">
              {editingItem ? <><Check size={20} className="mr-2" /> Guardar</> : <><Plus size={20} className="mr-2" /> Agregar</>}
            </button>
            {editingItem && (
              <button onClick={() => { setEditingItem(null); setNewItemName(''); }} className="text-base bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition duration-300 flex items-center justify-center w-full sm:w-auto shrink-0">
                <X size={20} className="mr-2" /> Cancelar
              </button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-100">
              <tr className="border-b-2 border-slate-200">
                <th className="p-4 font-semibold text-slate-600 text-left text-base">ID</th>
                <th className="p-4 font-semibold text-slate-600 text-left text-base">Nombre</th>
                <th className="p-4 font-semibold text-slate-600 text-right text-base">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="p-4 text-slate-700 font-mono text-sm">{item.id}</td>
                  <td className="p-4 font-medium text-slate-900 text-base">{item.name}</td>
                  <td className="p-4 text-right">
                    {canAddEditDelete ? (
                      <div className="flex justify-end items-center gap-4 text-base">
                        <button onClick={() => handleEditClick(item)} className="font-medium text-blue-600 hover:text-blue-800">Editar</button>
                        <button onClick={() => handleDeleteItem(item.id)} className="font-medium text-red-600 hover:text-red-800">Eliminar</button>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Sin acciones</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="text-center text-gray-500 mt-6 py-10 text-base"><p>No hay {itemName}s registrados.</p></div>
        )}
      </div>
    </>
  );
}