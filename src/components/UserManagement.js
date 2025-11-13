import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, User as UserIcon, X, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from "firebase/firestore";
import Select from 'react-select';
import { toast } from 'react-hot-toast';

// --- Sub-componente Modal ---
const Modal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;
  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl' };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className={`bg-white p-6 rounded-lg shadow-xl w-full ${sizeClasses[size]} relative`}> 
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

// --- Componente Principal ---
export default function UserManagement({ user: loggedInUser, users: initialUsers, handlers }) {
  const [users, setUsers] = useState(initialUsers);
  const [laboratories, setLaboratories] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Para la carga inicial de datos
  
  // --- CAMBIO 1: Nuevo estado para controlar el envío del formulario ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToModify, setUserToModify] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    if (loggedInUser.role === 'Super Admin') {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const representativesSnapshot = await getDocs(collection(db, "representatives"));
          setRepresentatives(representativesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLaboratories([{ id: 1, name: 'Pets Pharma' }, { id: 2, name: 'Kiron' }, { id: 3, name: 'Vets Pharma' }]);
        } catch (error) {
          console.error("Error al cargar datos:", error);
          toast.error("No se pudieron cargar los datos.");
        }
        setIsLoading(false);
      };
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [loggedInUser.role]);

  const availableRoles = useMemo(() => [
    'Super Admin', 'Admin', 'Gerente de laboratorio', 'Coordinador de vendedores', 'Vendedor'
  ], []);

  const representativeOptions = useMemo(() => 
    representatives.map(rep => ({
      value: rep.id,
      label: rep.name
    })).sort((a, b) => a.label.localeCompare(b.label)),
  [representatives]);

  if (loggedInUser.role !== 'Super Admin') {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
        <p className="text-red-500">No tienes los permisos necesarios para gestionar usuarios.</p>
      </div>
    );
  }
  
  // --- CAMBIO 2: Lógica de 'handleSaveUser' actualizada ---
  const handleSaveUser = async (e) => {
    e.preventDefault();
    
    if (!userToModify.name || !userToModify.role || !userToModify.email) {
      toast.error('Email, Nombre y Rol son obligatorios.');
      return;
    }
    if (!isEditing && !userToModify.password) {
        toast.error('La contraseña es obligatoria para nuevos usuarios.');
        return;
    }

    setIsSubmitting(true); // <-- Usamos el nuevo estado
    try {
      const dataToSave = {
        ...userToModify,
        repsManaged: userToModify.repsManaged?.map(r => r.value) || []
      };

      if (isEditing) {
        await handlers.handleUpdateItem(dataToSave);
        toast.success("Usuario actualizado correctamente.");
      } else {
        await handlers.handleAddItem(dataToSave);
        toast.success("Usuario agregado correctamente.");
      }
      closeFormModal();
    } catch (error) {
      console.error("Error al guardar usuario (desde Cloud Function):", error);
      // ¡ESTA ES LA CORRECCIÓN CLAVE!
      // Muestra el mensaje de error real que viene del backend.
      toast.error(`Error: ${error.message || "Ocurrió un error al guardar."}`);
    }
    setIsSubmitting(false); // <-- Usamos el nuevo estado
  };

  // --- CAMBIO 3: Lógica de 'confirmDelete' actualizada ---
  const confirmDelete = async () => {
    if (!userToModify) return;
    setIsSubmitting(true); // <-- Usamos el nuevo estado
    try {
        await handlers.handleDeleteItem(userToModify.id);
        toast.success("Usuario eliminado correctamente.");
        closeDeleteConfirm();
    } catch (error) {
        console.error("Error al eliminar usuario (desde Cloud Function):", error);
        // Muestra el mensaje de error real
        toast.error(`Error: ${error.message || "Ocurrió un error al eliminar."}`);
    }
    setIsSubmitting(false); // <-- Usamos el nuevo estado
  };

  // --- (El resto de los handlers no cambian) ---
  const openAddModal = () => {
    setIsEditing(false);
    setUserToModify({ email: '', password: '', name: '', username: '', role: '', laboratory: '', repsManaged: [] });
    setIsFormModalOpen(true);
  };
  
  const openEditModal = (user) => {
    setIsEditing(true);
    const managedRepsAsOptions = (user.repsManaged || []).map(repId => 
        representativeOptions.find(opt => opt.value === repId)
    ).filter(Boolean);

    // Asegúrate de que 'id' (el email) esté en el objeto a modificar
    setUserToModify({ ...user, id: user.id, email: user.id, password: '', repsManaged: managedRepsAsOptions });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setUserToModify(null);
  };

  const openDeleteConfirm = (user) => {
    setUserToModify(user);
    setIsDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setUserToModify(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserToModify(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (selectedOptions) => {
    setUserToModify(prev => ({ ...prev, repsManaged: selectedOptions || [] }));
  };

  if (isLoading && users.length === 0) {
    return <div className="p-6 text-center"><p>Cargando...</p></div>;
  }

  return (
    <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center"><UserIcon className="mr-3 text-blue-500" /> Gestión de Usuarios</h2>
        <button onClick={openAddModal} className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"><Plus size={20} className="mr-2" /> Agregar Usuario</button>
      </div>

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
                <td className="py-3 px-4 text-sm font-semibold">{u.name}</td>
                <td className="py-3 px-4 text-sm">{u.role}</td>
                <td className="py-3 px-4 text-sm">{u.laboratory || 'N/A'}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button onClick={() => openEditModal(u)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100"><Edit size={18} /></button>
                  <button onClick={() => openDeleteConfirm(u)} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title={isEditing ? 'Editar Usuario' : 'Agregar Nuevo Usuario'} size="3xl">
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold">Email (login)</label><input type="email" name="email" value={userToModify?.email || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" required disabled={isEditing} /></div>
            <div><label className="block text-sm font-semibold">Contraseña</label><input type="password" name="password" value={userToModify?.password || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder={isEditing ? "Dejar en blanco para no cambiar" : "Contraseña de inicio"} required={!isEditing} /></div>
            <div><label className="block text-sm font-semibold">Nombre Completo</label><input type="text" name="name" value={userToModify?.name || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-semibold">Nombre de Usuario</label><input type="text" name="username" value={userToModify?.username || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-semibold">Rol</label><select name="role" value={userToModify?.role || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" required><option value="">Selecciona Rol</option>{availableRoles.map(role => (<option key={role} value={role}>{role}</option>))}</select></div>
            
            {['Gerente de laboratorio', 'Vendedor', 'Coordinador de vendedores'].includes(userToModify?.role) && (
              <div>
                <label className="block text-sm font-semibold">Laboratorio Asignado</label>
                <select name="laboratory" value={userToModify?.laboratory || ''} onChange={handleChange} className="w-full p-2 border rounded-lg" required>
                    <option value="">Selecciona Laboratorio</option>
                    {laboratories.map(lab => (<option key={lab.id} value={lab.name}>{lab.name}</option>))}
                </select>
              </div>
            )}
            
            {userToModify?.role === 'Coordinador de vendedores' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Vendedores a Cargo</label>
                <Select
                  isMulti
                  name="repsManaged"
                  options={representativeOptions}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Selecciona uno o varios vendedores..."
                  value={userToModify?.repsManaged}
                  onChange={handleMultiSelectChange}
                  noOptionsMessage={() => 'No hay más vendedores para agregar'}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={closeFormModal} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
            {/* --- CAMBIO 4: Botón de Submit actualizado --- */}
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSubmitting} // <-- Deshabilita el botón mientras se envía
            >
              {isSubmitting ? (isEditing ? 'Guardando...' : 'Agregando...') : (isEditing ? 'Guardar Cambios' : 'Agregar Usuario')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteConfirmOpen} onClose={closeDeleteConfirm} title="Confirmar Eliminación">
        <div className='text-center'>
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-gray-700">¿Estás seguro? Esto eliminará el perfil y el acceso del usuario <span className='font-bold'>{userToModify?.name}</span> de forma permanente.</p>
          <div className="flex justify-center space-x-4 mt-6">
            <button onClick={closeDeleteConfirm} className="px-5 py-2.5 bg-gray-200 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
            {/* --- CAMBIO 5: Botón de Eliminar actualizado --- */}
            <button 
              onClick={confirmDelete} 
              className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-300"
              disabled={isSubmitting} // <-- Deshabilita el botón mientras se elimina
            >
              {isSubmitting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}