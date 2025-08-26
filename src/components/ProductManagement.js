import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

// Se asume la existencia de un componente Modal para agregar/editar
// Si no lo tienes, puedes agregarlo desde el último código proporcionado para CampaignManagement
// (en la sección de errores se muestra cómo era, pero sin la funcionalidad de campaña)
import { X } from 'lucide-react'; // Importar el icono de cierre para el Modal
const Modal = ({ onClose, title, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} /> {/* Icono de cierre */}
        </button>
      </div>
      <div>{children}</div>
    </div>
  </div>
);


export default function ProductManagement({ products, laboratories, handlers, user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedLaboratory, setSelectedLaboratory] = useState(''); // Estado para filtrar productos
  const [filterText, setFilterText] = useState(''); // Estado para el filtro de texto

  // Permisos basados en el rol del usuario
  const canAddProduct = user && ['Super Admin', 'Admin', 'Coordinador de vendedores', 'Gerente de laboratorio'].includes(user.role);
  const canEditProductDetails = user && ['Super Admin', 'Admin', 'Coordinador de vendedores'].includes(user.role); // Gerente de laboratorio NO PUEDE editar detalles
  const canEditProductPrice = user && ['Super Admin', 'Admin'].includes(user.role); // Solo Super Admin y Admin pueden editar precio
  const canDeleteProduct = user && ['Super Admin', 'Admin', 'Coordinador de vendedores'].includes(user.role); // Gerente de laboratorio NO PUEDE eliminar productos

  // Filtrar productos por el laboratorio seleccionado y texto de búsqueda
  const filteredProducts = Object.values(products)
    .flat()
    .filter(product => {
      const matchesLaboratory = selectedLaboratory === '' || product.laboratory === selectedLaboratory;
      const matchesFilterText = product.name.toLowerCase().includes(filterText.toLowerCase()) ||
                                product.id.toLowerCase().includes(filterText.toLowerCase()); // Buscar también por SKU (ID)
      return matchesLaboratory && matchesFilterText;
    })
    .filter(product => {
        // Si el usuario es Gerente de laboratorio, solo ve los productos de SU laboratorio
        if (user && user.role === 'Gerente de laboratorio') {
            return product.laboratory === user.laboratory;
        }
        return true; // Todos los demás roles ven todos los productos filtrados
    });

  const openModal = (product = null) => {
    // Si es un Gerente de laboratorio y intenta editar, se le impide.
    if (product && user.role === 'Gerente de laboratorio' && !canEditProductDetails) {
        alert('Como Gerente de laboratorio, solo puedes agregar productos, no editar los existentes.');
        return;
    }
    setCurrentProduct(product ? { ...product } : { id: '', name: '', description: '', price: '0.00', laboratory: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!currentProduct.name || !currentProduct.price || !currentProduct.laboratory) {
      alert('Nombre, precio y laboratorio son obligatorios.');
      return;
    }

    // Lógica para guardar
    if (currentProduct.id && canEditProductDetails) { // Si es edición y tiene permisos para editar detalles
      handlers.handleUpdateItem(currentProduct);
    } else if (!currentProduct.id && canAddProduct) { // Si es nuevo producto y tiene permisos para añadir
      handlers.handleAddItem(currentProduct);
    } else if (currentProduct.id && !canEditProductDetails && user.role === 'Gerente de laboratorio') {
        // Gerente intentó guardar edición (no permitido), solo cierra modal
        alert('Como Gerente de laboratorio, no puedes editar los detalles de los productos existentes.');
    } else {
        alert('No tienes permiso para realizar esta acción.');
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
          <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
            <Plus size={20} className="mr-2" /> Agregar Producto
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="filter-lab" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Laboratorio</label>
          <select
            id="filter-lab"
            value={selectedLaboratory}
            onChange={(e) => setSelectedLaboratory(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500"
            // Si es Gerente de laboratorio, el filtro se fija a su laboratorio
            disabled={user && user.role === 'Gerente de laboratorio'}
          >
            <option value="">Todos los Laboratorios</option>
            {laboratories.map(lab => (
              <option key={lab.id} value={lab.name}>{lab.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-text" className="block text-sm font-medium text-gray-700 mb-1">Buscar por Nombre o SKU</label>
          <input
            id="filter-text"
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Escribe para buscar..."
            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">SKU</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Nombre</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Descripción</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Laboratorio</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-right">Precio</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, idx) => (
              <tr key={product.id} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition duration-150 ease-in-out`}>
                <td className="py-3 px-4 text-sm text-gray-800">{product.id}</td> {/* Usar product.id como SKU */}
                <td className="py-3 px-4 text-sm text-gray-800">{product.name}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{product.description}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{product.laboratory}</td>
                <td className="py-3 px-4 text-sm text-gray-800 text-right">${parseFloat(product.price).toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-sm text-gray-800 space-x-2">
                  {canEditProductDetails && ( // Botón de Editar visible solo si tiene permisos de edición (no Gerente)
                    <button
                      onClick={() => openModal(product)}
                      className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition duration-150 ease-in-out"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  {canDeleteProduct && ( // Botón de Eliminar visible solo si tiene permisos de eliminación (no Gerente)
                    <button
                      onClick={() => handlers.handleDeleteItem(product.id, product.laboratory)}
                      className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 transition duration-150 ease-in-out"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {/* Mensaje para Gerente de laboratorio si no puede editar/eliminar */}
                  {user && user.role === 'Gerente de laboratorio' && !canEditProductDetails && !canDeleteProduct && (
                    <span className="text-gray-500 text-xs">Solo ver</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredProducts.length === 0 && (
        <p className="text-center text-gray-500 mt-6 p-4 border rounded-lg bg-gray-50">No hay productos disponibles con los filtros actuales.</p>
      )}

      {isModalOpen && (
        <Modal onClose={closeModal} title={currentProduct.id ? 'Editar Producto' : 'Agregar Producto'}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Laboratorio</label>
              <select
                name="laboratory"
                value={currentProduct.laboratory}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                required
                // Un gerente solo puede agregar/editar productos para su laboratorio asignado
                disabled={user && user.role === 'Gerente de laboratorio' && !canEditProductDetails && currentProduct.id} // Deshabilitar para gerente si edita existente
              >
                <option value="">Selecciona Laboratorio</option>
                {laboratories
                  .filter(lab => user && user.role === 'Gerente de laboratorio' ? lab.name === user.laboratory : true)
                  .map(lab => (
                    <option key={lab.id} value={lab.name}>{lab.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Producto</label>
              <input
                type="text"
                name="name"
                value={currentProduct.name}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!canEditProductDetails && user.role === 'Gerente de laboratorio' && currentProduct.id} // Deshabilitar edición de nombre para Gerente en productos existentes
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
              <textarea
                name="description"
                value={currentProduct.description}
                onChange={handleChange}
                rows="3"
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                disabled={!canEditProductDetails && user.role === 'Gerente de laboratorio' && currentProduct.id} // Deshabilitar edición de descripción para Gerente en productos existentes
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Precio Unitario</label>
              <input
                type="number"
                name="price"
                value={currentProduct.price}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!canEditProductPrice} // Deshabilitar edición de precio según permiso
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition duration-200 ease-in-out shadow-sm">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out shadow-md">
                {currentProduct.id && canEditProductDetails ? 'Guardar Cambios' : 'Agregar Producto'}
                {currentProduct.id && !canEditProductDetails && user.role === 'Gerente de laboratorio' && 'Cerrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
