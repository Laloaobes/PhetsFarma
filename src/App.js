import React, { useState, useEffect } from 'react';
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

// Se vuelve a importar la lista de productos local
import { petspharmaProducts, kironProducts, vetsPharmaProducts } from './data/productList';

// Datos locales que no se migrarán por ahora
const initialData = {
  laboratories: [
    { id: 1, name: 'Pets Pharma' },
    { id: 2, name: 'Kiron' },
    { id: 3, name: 'Vets Pharma' },
  ]
};

// Se vuelve a definir la constante para los productos locales
const initialProductsByLab = {
  'Pets Pharma': petspharmaProducts,
  'Kiron': kironProducts,
  'Vets Pharma': vetsPharmaProducts
};

export default function App() {
  // Estados de la aplicación
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [lastView, setLastView] = useState('login');
  
  // ---- ESTADOS PARA DATOS DE FIRESTORE ----
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [users, setUsers] = useState([]);
  
  // El estado de productos ahora usa los datos locales de nuevo
  const [products, setProducts] = useState(initialProductsByLab);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("salesUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView("orderForm");
    }
  }, []);

  // ---- LEER DATOS DESDE FIREBASE EN TIEMPO REAL ----
  useEffect(() => {
    const unsubClients = onSnapshot(collection(db, "clients"), (snapshot) => setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubReps = onSnapshot(collection(db, "representatives"), (snapshot) => setRepresentatives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubDists = onSnapshot(collection(db, "distributors"), (snapshot) => setDistributors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }))));
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    
    return () => {
      unsubClients();
      unsubReps();
      unsubDists();
      unsubOrders();
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
      if (['clients', 'representatives', 'distributors'].includes(key)) {
        try {
          const { id, ...itemData } = item; 
          await addDoc(collection(db, key), itemData);
        } catch (error) {
          console.error(`Error al añadir en ${key}: `, error);
        }
      }
    },
    handleUpdateItem: async (updatedItem) => {
      if (['clients', 'representatives', 'distributors'].includes(key)) {
        try {
          const itemDoc = doc(db, key, updatedItem.id);
          await updateDoc(itemDoc, { name: updatedItem.name });
        } catch (error) {
          console.error(`Error al actualizar en ${key}: `, error);
        }
      }
    },
    handleDeleteItem: async (id) => {
      if (['clients', 'representatives', 'distributors'].includes(key)) {
        try {
          const itemDoc = doc(db, key, id);
          await deleteDoc(itemDoc);
        } catch (error) {
          console.error(`Error al eliminar en ${key}: `, error);
        }
      }
    },
  });

  const userHandlers = {
    handleAddItem: async (newUser) => {
        // This logic should ideally call a Cloud Function to create the user in Auth
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
            const userDocRef = doc(db, "users", updatedUser.id); // Assumes ID is the email
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
            // Ideally, a Cloud Function should also delete the user from Auth
            await deleteDoc(doc(db, "users", userId));
        } catch (error) {
            console.error("Error deleting user from Firestore: ", error);
        }
    },
};
  
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
        return <Reports orders={orders} onNavigate={handleNavigate} sellers={representatives} distributors={distributors} laboratories={initialData.laboratories} user={user} />;
      case 'manageClients':
        return <GenericManagement items={clients} handlers={genericHandlers('clients')} itemName="Cliente" user={user} />;
      case 'manageSellers':
        return <GenericManagement items={representatives} handlers={genericHandlers('representatives')} itemName="Vendedor" user={user} />;
      case 'manageDistributors':
        return <GenericManagement items={distributors} handlers={genericHandlers('distributors')} itemName="Distribuidor" user={user} />;
      case 'manageLaboratories':
        return <GenericManagement items={initialData.laboratories} handlers={genericHandlers('laboratories')} itemName="Laboratorio" user={user} />;
      case 'manageProducts':
        return <ProductManagement products={products} laboratories={initialData.laboratories} user={user} />;
      case 'manageUsers':
        return <UserManagement users={users} handlers={userHandlers} laboratories={initialData.laboratories} user={user} />;
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {user && currentView !== 'login' && (
        <AdminPanel onNavigate={handleNavigate} onLogout={handleLogout} currentView={currentView} user={user} />
      )}
      <main className="container mx-auto p-4 md:p-6">
        {renderView()}
      </main>
    </div>
  );
}

