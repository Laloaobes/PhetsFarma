import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, X } from 'lucide-react';

// Componente para el modal
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
  const [selectedLaboratory, setSelectedLaboratory] = useState('');
  const [filterText, setFilterText] = useState('');

  // Lógica de permisos de usuario
  const canAddProduct = user && ['Super Admin', 'Admin', 'Coordinador de vendedores', 'Gerente de laboratorio'].includes(user.role);
  const canEditProductDetails = user && ['Super Admin', 'Admin', 'Coordinador de vendedores'].includes(user.role);
  const canEditProductPrice = user && ['Super Admin', 'Admin'].includes(user.role);
  const canDeleteProduct = user && ['Super Admin', 'Admin', 'Coordinador de vendedores'].includes(user.role);

  // Filtrar productos por el laboratorio seleccionado y texto de búsqueda
  const filteredProducts = Object.values(products)
    .flat()
    .filter(product => {
      const productLaboratoryName = product.laboratory?.toLowerCase() || '';
      const filterLaboratoryName = selectedLaboratory?.toLowerCase() || '';
      const filterLower = filterText.toLowerCase().trim(); // Elimina espacios en blanco para una coincidencia exacta

      const matchesLaboratory = filterLaboratoryName === '' || productLaboratoryName === filterLaboratoryName;
      
      // FIX: Ahora la lógica busca una coincidencia exacta de la palabra
      // en el nombre del producto o en el SKU para eliminar resultados irrelevantes.
      const matchesFilterText = filterText === '' ||
                                product.name?.toLowerCase() === filterLower ||
                                String(product.code).toLowerCase() === filterLower;
      
      return matchesLaboratory && matchesFilterText;
    })
    .filter(product => {
      if (user && user.role === 'Gerente de laboratorio') {
        return product.laboratory === user.laboratory;
      }
      return true;
    });

  // Abre el modal para agregar o editar un producto
  const openModal = (product = null) => {
    // Si el usuario es Gerente de laboratorio y no puede editar, muestra un error y no abre el modal
    if (product && user && user.role === 'Gerente de laboratorio' && !canEditProductDetails) {
        console.error('Como Gerente de laboratorio, solo puedes agregar productos, no editar los existentes.');
        return;
    }
    // Inicializa el producto actual para el modal, usando 'code' en lugar de 'id'
    setCurrentProduct(product ? { ...product } : { code: '', name: '', description: '', price: '0.00', laboratory: '' });
    setIsModalOpen(true);
  };

  // Cierra el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  // Maneja la acción de guardar el producto
  const handleSave = (e) => {
    e.preventDefault();
    if (!currentProduct.code || !currentProduct.name || !currentProduct.price || !currentProduct.laboratory) {
      console.error('SKU, nombre, precio y laboratorio son obligatorios.');
      return;
    }

    // Se usa 'currentProduct.code' para determinar si es una edición
    if (currentProduct.code) { // Es una edición
      if (canEditProductDetails) {
        handlers.handleUpdateItem(currentProduct);
      } else {
        console.error('No tienes permiso para editar este producto.');
      }
    } else { // Es un nuevo producto
      if (canAddProduct) {
        handlers.handleAddItem(currentProduct);
      } else {
        console.error('No tienes permiso para agregar productos.');
      }
    }
    closeModal();
  };

  // Maneja los cambios en los inputs del formulario
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
              // Se usa 'product.code' como clave única para la lista
              <tr key={product.code} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition duration-150 ease-in-out`}>
                <td className="py-3 px-4 text-sm text-gray-800">{product.code}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{product.name}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{product.description}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{product.laboratory}</td>
                <td className="py-3 px-4 text-sm text-gray-800 text-right">${parseFloat(product.price).toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-sm text-gray-800 space-x-2">
                  {canEditProductDetails && (
                    <button
                      onClick={() => openModal(product)}
                      className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition duration-150 ease-in-out"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  {canDeleteProduct && (
                    <button
                      onClick={() => handlers.handleDeleteItem(product.code, product.laboratory)}
                      className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 transition duration-150 ease-in-out"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
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
        // Se usa 'currentProduct.code' en el título del modal
        <Modal onClose={closeModal} title={currentProduct.code ? 'Editar Producto' : 'Agregar Producto'}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Laboratorio</label>
              <select
                name="laboratory"
                value={currentProduct.laboratory}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={user && user.role === 'Gerente de laboratorio' && !canEditProductDetails && currentProduct.code}
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                name="code"
                value={currentProduct.code}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                required
                // FIX: El campo SKU solo debe estar deshabilitado si currentProduct.code tiene un valor.
                disabled={!!currentProduct.code}
              />
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
                disabled={currentProduct.code && !canEditProductDetails && user.role === 'Gerente de laboratorio'}
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
                disabled={currentProduct.code && !canEditProductDetails && user.role === 'Gerente de laboratorio'}
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
                disabled={!canEditProductPrice}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition duration-200 ease-in-out shadow-sm">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out shadow-md">
                {currentProduct.code && canEditProductDetails ? 'Guardar Cambios' : 'Agregar Producto'}
                {currentProduct.code && !canEditProductDetails && user.role === 'Gerente de laboratorio' && 'Cerrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
