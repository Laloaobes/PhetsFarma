import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, X, Loader } from 'lucide-react';

// --- IMPORTS DE FIREBASE ---
// Asegúrate de que la ruta a tu archivo de configuración de Firebase sea correcta
import { db } from '../firebase'; 
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

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

export default function ProductManagement({ laboratories, user }) {
  // --- ESTADOS DEL COMPONENTE ---
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLaboratory, setSelectedLaboratory] = useState('');
  const [filterText, setFilterText] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showAll, setShowAll] = useState(false);
  
  // --- CARGA DE DATOS DESDE FIRESTORE ---
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- MANEJADORES DE DATOS INTERNOS (CRUD) ---
  const handleAddItem = async (item) => {
    try {
      const { id, ...itemData } = item;
      itemData.price = parseFloat(itemData.price) || 0;
      await addDoc(collection(db, 'products'), itemData);
    } catch (error) {
      console.error("Error al añadir producto: ", error);
    }
  };

  const handleUpdateItem = async (updatedItem) => {
    try {
      const { id, ...itemData } = updatedItem;
      itemData.price = parseFloat(itemData.price) || 0;
      const itemDoc = doc(db, 'products', id);
      await updateDoc(itemDoc, itemData);
    } catch (error) {
      console.error(`Error al actualizar producto: `, error);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const itemDoc = doc(db, 'products', id);
      await deleteDoc(itemDoc);
    } catch (error) {
      console.error(`Error al eliminar producto: `, error);
    }
  };
  
  // Lógica de permisos
  const canAddProduct = user && ['Super Admin', 'Admin', 'Coordinador de vendedores', 'Gerente de laboratorio'].includes(user.role);
  const canEditProductDetails = user && ['Super Admin', 'Admin', 'Coordinador de vendedores'].includes(user.role);
  const canEditProductPrice = user && ['Super Admin', 'Admin'].includes(user.role);
  const canDeleteProduct = user && ['Super Admin', 'Admin', 'Coordinador de vendedores'].includes(user.role);

  // Lógica de filtrado
  let sourceList = [];
  if (showAll) {
    sourceList = products;
  } else if (selectedLaboratory) {
    sourceList = products.filter(p => p.laboratory === selectedLaboratory);
  }
  if (filterText) {
    const filterLower = filterText.toLowerCase();
    sourceList = sourceList.filter(product => 
      product.name.toLowerCase().includes(filterLower) || 
      product.code.toLowerCase().includes(filterLower)
    );
  }
  const filteredProducts = user?.role === 'Gerente de laboratorio'
    ? sourceList.filter(product => product.laboratory === user.laboratory)
    : sourceList;

  // --- MANEJADORES DE UI ---
  const handleShowAll = () => {
    setShowAll(prevShowAll => !prevShowAll);
    setSelectedLaboratory('');
  };

  const handleLabSelection = (e) => {
    setSelectedLaboratory(e.target.value);
    setShowAll(false);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      handleDeleteItem(productToDelete.id);
    }
    setIsDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setProductToDelete(null);
  };
  
  const openAddModal = () => {
    setCurrentItem({ code: '', name: '', description: '', price: '0.00', laboratory: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setCurrentItem(product);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!currentItem.code || !currentItem.name || !currentItem.laboratory) {
      alert('SKU, Nombre y Laboratorio son obligatorios.');
      return;
    }
    if (isEditing) {
      handleUpdateItem(currentItem);
    } else {
      handleAddItem(currentItem);
    }
    closeModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  // --- RENDERIZADO DEL COMPONENTE ---
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 items-end">
        <select
            value={selectedLaboratory}
            onChange={handleLabSelection}
            className="w-full p-2 border rounded-lg"
            disabled={user?.role === 'Gerente de laboratorio'}
        >
          <option value="">Selecciona un Laboratorio para ver productos</option>
          {laboratories.map(lab => (<option key={lab.id} value={lab.name}>{lab.name}</option>))}
        </select>
        <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Buscar por Nombre o SKU..."
            className="w-full p-2 border rounded-lg"
        />
        <button 
          onClick={handleShowAll}
          className="w-full md:w-auto px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          {showAll ? 'Ocultar Todos los Productos' : 'Mostrar Todos los Productos'}
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader className="animate-spin text-blue-500" size={48} />
          <p className="ml-4 text-gray-600">Cargando productos...</p>
        </div>
      ) : (
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
      )}
      
      {/* Mensajes condicionales */}
      {!isLoading && filteredProducts.length === 0 && (selectedLaboratory || showAll || filterText) && (
        <p className="text-center text-gray-500 mt-6 p-4">
          No se encontraron productos con los filtros aplicados.
        </p>
      )}
      {!isLoading && products.length > 0 && filteredProducts.length === 0 && !selectedLaboratory && !showAll && (
        <p className="text-center text-gray-500 mt-6 p-4 border rounded-lg bg-gray-50">
          Por favor, selecciona un laboratorio o presiona "Mostrar Todos" para comenzar.
        </p>
      )}
      
      {/* Modales */}
      {isModalOpen && currentItem && (
        <Modal onClose={closeModal} title={isEditing ? 'Editar Producto' : 'Agregar Producto'}>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">SKU (Código)</label>
                    <input type="text" id="code" name="code" value={currentItem.code} onChange={handleChange} required className="w-full p-2 border rounded-lg" disabled={isEditing && !canEditProductDetails}/>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                    <input type="text" id="name" name="name" value={currentItem.name} onChange={handleChange} required className="w-full p-2 border rounded-lg" disabled={isEditing && !canEditProductDetails}/>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea id="description" name="description" value={currentItem.description} onChange={handleChange} rows="3" className="w-full p-2 border rounded-lg" disabled={isEditing && !canEditProductDetails}></textarea>
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                    <input type="number" step="0.01" id="price" name="price" value={currentItem.price} onChange={handleChange} className="w-full p-2 border rounded-lg" disabled={isEditing && !canEditProductPrice}/>
                </div>
                <div>
                    <label htmlFor="laboratory" className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
                    <select id="laboratory" name="laboratory" value={currentItem.laboratory} onChange={handleChange} required className="w-full p-2 border rounded-lg" disabled={isEditing && !canEditProductDetails}>
                        <option value="">Seleccione un laboratorio</option>
                        {laboratories.map(lab => (
                            <option key={lab.id} value={lab.name}>{lab.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
                        {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                </div>
            </form>
        </Modal>
      )}
      
      {isDeleteConfirmOpen && productToDelete && (
        <Modal onClose={cancelDelete} title="Confirmar Eliminación">
            <div className='text-center'>
                <p className="text-gray-700 mb-6">
                    ¿Estás seguro de que deseas eliminar el producto <strong className="font-semibold">{productToDelete.name}</strong>? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-center space-x-4">
                    <button onClick={cancelDelete} className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400">
                        Cancelar
                    </button>
                    <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                        Eliminar
                    </button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
}