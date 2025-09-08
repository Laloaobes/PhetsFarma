import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, X, Check, AlertTriangle, Search, Loader2 } from 'lucide-react';

// --- Sub-componente para la vista móvil (tarjeta individual) ---
const ItemCard = ({ item, index, onEdit, onDelete, canAddEditDelete }) => (
    <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-200">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-600 font-bold rounded-full text-sm">
            {index + 1}
        </div>
        <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-800 text-md break-words">{item.name}</p>
        </div>
        {canAddEditDelete && (
            <div className="flex items-center space-x-1 flex-shrink-0">
                <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label="Editar"><Edit size={18} /></button>
                <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label="Eliminar"><Trash2 size={18} /></button>
            </div>
        )}
    </div>
);

// --- Componente Principal ---
export default function GenericManagement({ items = [], handlers, itemName, user }) {
    const [editingItem, setEditingItem] = useState(null);
    const [newItemName, setNewItemName] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [visibleCount, setVisibleCount] = useState(25); // Muestra 25 items inicialmente

    // Determina si el usuario tiene permisos para realizar acciones de escritura
    const canAddEditDelete = user && ['Super Admin', 'Admin', 'Coordinador de vendedores'].includes(user.role);

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

    const handleDeleteClick = (item) => {
        if (canAddEditDelete) {
            setItemToDelete(item);
            setIsDeleteConfirmOpen(true);
        } else {
            setModalMessage(`No tienes permiso para eliminar este ${itemName}.`);
            setShowModal(true);
        }
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            handlers.handleDeleteItem(itemToDelete.id);
        }
        setIsDeleteConfirmOpen(false);
        setItemToDelete(null);
    };

    const cancelDelete = () => {
        setIsDeleteConfirmOpen(false);
        setItemToDelete(null);
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setNewItemName(item.name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Filtra los items basado en el texto de búsqueda
    const filteredItems = useMemo(() => {
        if (!Array.isArray(items)) return [];
        return items.filter(item =>
            item.name.toLowerCase().includes(filterText.toLowerCase())
        );
    }, [items, filterText]);

    // Corta la lista de items filtrados para la paginación
    const itemsToShow = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prevCount => prevCount + 25);
    };

    return (
        <>
            {/* Modal de Acceso Denegado */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Acción Denegada</h3>
                        <p className="mb-4 text-gray-600">{modalMessage}</p>
                        <button onClick={() => setShowModal(false)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Entendido</button>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación para Eliminar */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                     <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-center">
                        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                        <h3 className="text-lg font-bold mt-4 text-gray-800">Confirmar Eliminación</h3>
                        <p className="mt-2 text-gray-700">¿Estás seguro de que quieres eliminar a <span className='font-bold'>{itemToDelete?.name}</span>?</p>
                        <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
                        <div className="flex justify-center space-x-4 mt-6">
                            <button onClick={cancelDelete} className="px-5 py-2.5 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400">Cancelar</button>
                            <button onClick={confirmDelete} className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Sí, eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de {itemName}s</h2>
                
                {/* Panel de control: Agregar, Editar y Buscar */}
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-6 border">
                    {canAddEditDelete && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">{editingItem ? `Editando: "${editingItem.name}"` : `Agregar Nuevo ${itemName}`}</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <input type="text" placeholder={`Nombre del ${itemName}`} value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full sm:flex-grow p-3 border rounded-lg bg-gray-50"/>
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
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Buscar {itemName}</label>
                        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
                            <Search className="text-gray-500 mr-3" />
                            <input type="text" placeholder={`Buscar por nombre...`} value={filterText} onChange={(e) => setFilterText(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm"/>
                        </div>
                    </div>
                </div>

                {/* Vista en Tarjetas para Móviles */}
                <div className="space-y-3 lg:hidden">
                    {itemsToShow.map((item, index) => (
                        <ItemCard key={item.id} item={item} index={index} onEdit={() => handleEditClick(item)} onDelete={() => handleDeleteClick(item)} canAddEditDelete={canAddEditDelete} />
                    ))}
                </div>

                {/* Vista en Tabla para Escritorio */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
                                {canAddEditDelete && <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {itemsToShow.map((item) => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm text-gray-800">{item.name}</td>
                                    {canAddEditDelete && (
                                        <td className="py-3 px-4 text-right space-x-2">
                                            <button onClick={() => handleEditClick(item)} className="text-blue-600 hover:text-blue-800 p-1.5"><Edit size={18} /></button>
                                            <button onClick={() => handleDeleteClick(item)} className="text-red-600 hover:text-red-800 p-1.5"><Trash2 size={18} /></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Botón de Cargar Más */}
                {visibleCount < filteredItems.length && (
                    <div className="text-center mt-8">
                        <button onClick={handleLoadMore} className="inline-flex items-center gap-2 px-6 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800">
                            <Loader2 size={18} className="animate-spin" /> Cargar más ({itemsToShow.length}/{filteredItems.length})
                        </button>
                    </div>
                )}

                {/* Mensajes de Estado */}
                {items.length > 0 && filteredItems.length === 0 && (
                     <div className="text-center text-gray-500 mt-6 py-10 border-t"><p>No se encontraron resultados para "{filterText}".</p></div>
                )}
                {items.length === 0 && (
                    <div className="text-center text-gray-500 mt-6 py-10 border-t"><p>No hay {itemName}s registrados.</p></div>
                )}
            </div>
        </>
    );
}
    