import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, X, AlertTriangle } from 'lucide-react';

// Componente genérico para modales
const Modal = ({ onClose, title, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      <div>{children}</div>
    </div>
  </div>
);

export default function ProductManagement({ products, laboratories, handlers, user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLaboratory, setSelectedLaboratory] = useState('');
  const [filterText, setFilterText] = useState('');
  
  // --- MEJORA: Estados para el modal de confirmación de borrado ---
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Lógica de permisos de usuario
  const canAddProduct = user && ['Super Admin', 'Admin', 'Coordinador de vendedores', 'Gerente de laboratorio'].includes(user.role);
  const canEditProductDetails = user && ['Super Admin', 'Admin', 'Coordinador de vendedores'].includes(user.role);
  const canEditProductPrice = user && ['Super Admin', 'Admin'].includes(user.role);
  const canDeleteProduct = user && ['Super Admin', 'Admin', 'Coordinador de vendedores'].includes(user.role);

  // Filtrar productos
  const filteredProducts = products.filter(product => {
      const matchesLaboratory = !selectedLaboratory || product.laboratory === selectedLaboratory;
      const filterLower = filterText.toLowerCase();
      const matchesFilterText = !filterLower || product.name.toLowerCase().includes(filterLower) || product.code.toLowerCase().includes(filterLower);
      
      if (user?.role === 'Gerente de laboratorio') {
        return product.laboratory === user.laboratory && matchesFilterText;
      }
      
      return matchesLaboratory && matchesFilterText;
    });

  // --- Manejadores para el modal de borrado ---
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      // ¡LA CORRECCIÓN CLAVE! Se envía el 'id' del documento.
      handlers.handleDeleteItem(productToDelete.id);
    }
    setIsDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  // Manejadores para el modal de agregar/editar
  const openAddModal = () => {
    setCurrentProduct({ code: '', name: '', description: '', price: '0.00', laboratory: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!currentProduct.code || !currentProduct.name || !currentProduct.laboratory) {
      alert('SKU, Nombre y Laboratorio son obligatorios.');
      return;
    }
    if (isEditing) {
      handlers.handleUpdateItem(currentProduct);
    } else {
      handlers.handleAddItem(currentProduct);
    }
    closeModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Package className="mr-3 text-blue-500" /> Gestión de Productos
        </h2>
        {canAddProduct && (
          <button onClick={openAddModal} className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
            <Plus size={20} className="mr-2" /> Agregar Producto
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select
            value={selectedLaboratory}
            onChange={(e) => setSelectedLaboratory(e.target.value)}
            className="w-full p-2 border rounded-lg"
            disabled={user?.role === 'Gerente de laboratorio'}
        >
          <option value="">Filtrar por Laboratorio</option>
          {laboratories.map(lab => (<option key={lab.id} value={lab.name}>{lab.name}</option>))}
        </select>
        <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Buscar por Nombre o SKU..."
            className="w-full p-2 border rounded-lg"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700">Laboratorio</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-right">Precio</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-800">{product.code}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{product.name}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{product.laboratory}</td>
                <td className="py-3 px-4 text-sm text-gray-800 text-right">${(parseFloat(product.price) || 0).toFixed(2)}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  {canEditProductDetails && (<button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-800 p-1.5"><Edit size={18} /></button>)}
                  {canDeleteProduct && (
                    <button onClick={() => handleDeleteClick(product)} className="text-red-600 hover:text-red-800 p-1.5"><Trash2 size={18} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal onClose={closeModal} title={isEditing ? 'Editar Producto' : 'Agregar Producto'}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Laboratorio</label>
              <select name="laboratory" value={currentProduct.laboratory} onChange={handleChange} className="w-full p-2 border rounded-lg" required>
                <option value="">Selecciona Laboratorio</option>
                {laboratories.map(lab => (<option key={lab.id} value={lab.name}>{lab.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">SKU</label>
              <input type="text" name="code" value={currentProduct.code} onChange={handleChange} className="w-full p-2 border rounded-lg" required disabled={isEditing} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Producto</label>
              <input type="text" name="name" value={currentProduct.name} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
              <textarea name="description" value={currentProduct.description} onChange={handleChange} rows="3" className="w-full p-2 border rounded-lg"></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Precio Unitario</label>
              <input type="number" name="price" value={currentProduct.price} onChange={handleChange} step="0.01" className="w-full p-2 border rounded-lg" required disabled={!canEditProductPrice} />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isEditing ? 'Guardar Cambios' : 'Agregar Producto'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* --- MEJORA: Modal de confirmación de borrado --- */}
      {isDeleteConfirmOpen && (
        <Modal onClose={cancelDelete} title="Confirmar Eliminación">
            <div className='text-center'>
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                <p className="mt-4 text-gray-700">¿Estás seguro de que quieres eliminar el producto <span className='font-bold'>{productToDelete?.name}</span>?</p>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
                <div className="flex justify-center space-x-4 mt-6">
                    <button onClick={cancelDelete} className="px-5 py-2.5 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400">Cancelar</button>
                    <button onClick={confirmDelete} className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Sí, eliminar</button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
}