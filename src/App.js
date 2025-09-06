import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Importa componentes de la aplicación
import AdminPanel from './components/AdminPanel';
import OrderForm from './components/OrderForm';
import OrderSummary from './components/OrderSummary';
import Reports from './components/ReportsView';
import GenericManagement from './components/GenericManagement';
import ProductManagement from './components/ProductManagement';
import UserManagement from './components/UserManagement';
import Login from './components/Login';

// ---- IMPORTS DE FIREBASE ----
import { db } from './firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";

// --- DATOS LOCALES ---
const initialData = {
  laboratories: [
    { id: 1, name: 'Pets Pharma' },
    { id: 2, name: 'Kiron' },
    { id: 3, name: 'Vets Pharma' },
  ]
};

export default function App() {
  // Estados de la aplicación
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [lastView, setLastView] = useState('login');
  const [currentOrder, setCurrentOrder] = useState(null);
  
  // ---- ESTADOS PARA DATOS DE FIRESTORE ----
  // Se ha eliminado el estado 'orders' de aquí
  const [clients, setClients] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]); 

  useEffect(() => {
    const savedUser = localStorage.getItem("salesUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView("orderForm");
    }
  }, []);

  // ---- LEER DATOS DESDE FIREBASE EN TIEMPO REAL ----
  // Se ha eliminado la carga de 'orders' de este efecto
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubClients = onSnapshot(collection(db, "clients"), (snapshot) => setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubReps = onSnapshot(collection(db, "representatives"), (snapshot) => setRepresentatives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubDists = onSnapshot(collection(db, "distributors"), (snapshot) => setDistributors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    return () => {
      unsubProducts();
      unsubClients();
      unsubReps();
      unsubDists();
      unsubUsers();
    };
  }, []);

  // ---- HANDLERS ----
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem("salesUser", JSON.stringify(loggedInUser));
    setCurrentView("orderForm");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("salesUser");
    setCurrentView("login");
  };

  const handleNavigate = (view, order = null) => {
    setLastView(currentView);
    setCurrentView(view);
    setCurrentOrder(order);
  };

  const handleSaveOrder = async (orderData) => {
    try {
      const orderToSave = { ...orderData, date: new Date() };
      const docRef = await addDoc(collection(db, "orders"), orderToSave);
      handleNavigate('orderSummary', { ...orderToSave, id: docRef.id });
    } catch (error) {
      console.error("Error al guardar el pedido: ", error);
    }
  };

  const genericHandlers = (key) => ({
    handleAddItem: async (item) => {
      try {
        const { id, ...itemData } = item;
        if (key === 'products') {
          itemData.price = parseFloat(itemData.price) || 0;
        }
        await addDoc(collection(db, key), itemData);
      } catch (error) {
        console.error(`Error al añadir en ${key}: `, error);
      }
    },
    handleUpdateItem: async (updatedItem) => {
      try {
        const { id, ...itemData } = updatedItem;
        if (key === 'products') {
          itemData.price = parseFloat(itemData.price) || 0;
        }
        const itemDoc = doc(db, key, id);
        await updateDoc(itemDoc, itemData);
      } catch (error) {
        console.error(`Error al actualizar en ${key}: `, error);
      }
    },
    handleDeleteItem: async (id) => {
      try {
        const itemDoc = doc(db, key, id);
        await deleteDoc(itemDoc);
      } catch (error) {
        console.error(`Error al eliminar en ${key}: `, error);
      }
    },
  });

  const userHandlers = {
    handleAddItem: async (newUser) => {
      try {
        const userDocRef = doc(db, "users", newUser.email);
        await setDoc(userDocRef, {
          name: newUser.name,
          username: newUser.username,
          role: newUser.role,
          laboratory: newUser.laboratory || ''
        });
      } catch (error) {
        console.error("Error adding user to Firestore: ", error);
      }
    },
    handleUpdateItem: async (updatedUser) => {
      try {
        const userDocRef = doc(db, "users", updatedUser.id);
        await updateDoc(userDocRef, {
          name: updatedUser.name,
          username: updatedUser.username,
          role: updatedUser.role,
          laboratory: updatedUser.laboratory || ''
        });
      } catch (error) {
        console.error("Error updating user in Firestore: ", error);
      }
    },
    handleDeleteItem: async (userId) => {
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (error) {
        console.error("Error deleting user from Firestore: ", error);
      }
    },
  };
  
  // --- Renderizado de Vistas ---
  const renderView = () => {
    if (!user) {
      return <Login onLogin={handleLogin} users={users} />;
    }

    switch (currentView) {
      case 'orderForm':
        return (
          <OrderForm
            onSaveOrder={handleSaveOrder}
            products={products}
            clients={clients}
            representatives={representatives}
            distributors={distributors}
            laboratories={initialData.laboratories}
            user={user}
            onSaveNewClient={genericHandlers('clients').handleAddItem}
            onSaveNewRepresentative={genericHandlers('representatives').handleAddItem}
            onSaveNewDistributor={genericHandlers('distributors').handleAddItem}
          />
        );
      case 'orderSummary':
        return <OrderSummary order={currentOrder} onNavigate={handleNavigate} previousView={lastView} user={user} />;
      case 'reports':
        // ReportsView ya no recibe 'orders', es autosuficiente
        return <Reports 
                  onNavigate={handleNavigate} 
                  users={users} 
                  distributors={distributors} 
                  laboratories={initialData.laboratories} 
                  user={user} 
                  onDeleteOrder={genericHandlers('orders').handleDeleteItem} 
                  representatives={representatives}
                />;
      case 'manageClients':
        return <GenericManagement items={clients} handlers={genericHandlers('clients')} itemName="Cliente" user={user} />;
      case 'manageSellers':
        return <GenericManagement items={representatives} handlers={genericHandlers('representatives')} itemName="Vendedor" user={user} />;
      case 'manageDistributors':
        return <GenericManagement items={distributors} handlers={genericHandlers('distributors')} itemName="Distribuidor" user={user} />;
      case 'manageLaboratories':
        return <GenericManagement items={initialData.laboratories} handlers={{}} itemName="Laboratorio" user={user} isReadOnly={true} />;
      case 'manageProducts':
        return <ProductManagement products={products} laboratories={initialData.laboratories} user={user} handlers={genericHandlers('products')} />;
      case 'manageUsers':
        return <UserManagement user={user} />;
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000, // La notificación dura 3 segundos
        }}
      />
      
      {user && currentView !== 'login' && (
        <AdminPanel onNavigate={handleNavigate} onLogout={handleLogout} currentView={currentView} user={user} />
      )}
      <main className="container mx-auto p-4 md:p-6 flex-grow">
        {renderView()}
      </main>
    </div>
  );
}