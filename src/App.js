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
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

import { petspharmaProducts, kironProducts, vetsPharmaProducts } from './data/productList';

// Datos locales que no se migrarán por ahora
const initialData = {
  laboratories: [
    { id: 1, name: 'Pets Pharma' },
    { id: 2, name: 'Kiron' },
    { id: 3, name: 'Vets Pharma' },
  ],
  users: [
    { id: 1, username: 'superadmin', password: 'password', name: 'Admin General', role: 'Super Admin' },
    { id: 2, username: 'admin', password: 'password', name: 'Administrador', role: 'Admin' },
    { id: 3, username: 'gerente_kiron', password: 'password', name: 'Gerente Kiron', role: 'Gerente de laboratorio', laboratory: 'Kiron' },
    { id: 4, username: 'gerente_petspharma', password: 'password', name: 'Gerente Pets Pharma', role: 'Gerente de laboratorio', laboratory: 'Pets Pharma' },
    { id: 5, username: 'gerente_vetspharma', password: 'password', name: 'Gerente Vets Pharma', role: 'Gerente de laboratorio', laboratory: 'Vets Pharma' },
    { id: 6, username: 'coordinador_ventas', password: 'password', name: 'Coordinador Ventas', role: 'Coordinador de vendedores' },
    { id: 7, username: 'vendedor_ana', password: 'password', name: 'Vendedor Ana', role: 'Vendedor' },
    { id: 8, username: 'vendedor_carlos', password: 'password', name: 'Vendedor Carlos', role: 'Vendedor' },
  ]
};

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
  const [data, setData] = useState(initialData);
  
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
    const unsubClients = onSnapshot(collection(db, "clients"), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubReps = onSnapshot(collection(db, "representatives"), (snapshot) => {
      setRepresentatives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubDists = onSnapshot(collection(db, "distributors"), (snapshot) => {
      setDistributors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    // ---- NUEVA SUSCRIPCIÓN A PEDIDOS ----
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      const ordersList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Firestore guarda las fechas como Timestamps, las convertimos a Date de JS
          date: data.date.toDate() 
        };
      });
      setOrders(ordersList);
    });

    return () => {
      unsubClients();
      unsubReps();
      unsubDists();
      unsubOrders(); // Limpiar suscripción de pedidos
    };
  }, []);

  // ---- HANDLERS DE NAVEGACIÓN Y SESIÓN ----
  const handleLogin = (loggedInUser) => { /* ... sin cambios ... */ };
  const handleLogout = () => { /* ... sin cambios ... */ };
  const handleNavigate = (view, order = null) => {
    setLastView(currentView);
    setCurrentView(view);
    setCurrentOrder(order);
  };

  // ---- GUARDAR PEDIDO EN FIREBASE ----
  const handleSaveOrder = async (orderData) => {
    try {
      // Usamos new Date() para asegurar que el formato sea correcto para Firestore
      const orderToSave = { ...orderData, date: new Date() };
      const docRef = await addDoc(collection(db, "orders"), orderToSave);
      
      // Navegamos al resumen con el pedido completo, incluyendo el nuevo ID de Firestore
      handleNavigate('orderSummary', { ...orderToSave, id: docRef.id });
    } catch (error) {
      console.error("Error al guardar el pedido: ", error);
    }
  };

  const handlePrint = (order) => { /* ... sin cambios ... */ };

  // ---- HANDLER GENÉRICO CRUD PARA CLIENTES, REPS Y DISTS ----
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

  const productHandlers = { /* ... sin cambios ... */ };
  
  const renderView = () => {
    if (!user) {
      return <Login onLogin={handleLogin} users={data.users}/>;
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
            laboratories={data.laboratories}
            user={user}
            onSaveNewClient={genericHandlers('clients').handleAddItem}
            onSaveNewRepresentative={genericHandlers('representatives').handleAddItem}
            onSaveNewDistributor={genericHandlers('distributors').handleAddItem}
          />
        );
      case 'orderSummary':
        return <OrderSummary order={currentOrder} onNavigate={handleNavigate} previousView={lastView} onPrint={handlePrint} user={user} />;
      case 'reports':
        return <Reports orders={orders} onNavigate={handleNavigate} sellers={representatives} distributors={distributors} laboratories={data.laboratories} products={products} user={user} />;
      case 'manageClients':
        return <GenericManagement items={clients} handlers={genericHandlers('clients')} itemName="Cliente" user={user} />;
      case 'manageSellers':
        return <GenericManagement items={representatives} handlers={genericHandlers('representatives')} itemName="Representante/Promotor" user={user} />;
      case 'manageDistributors':
        return <GenericManagement items={distributors} handlers={genericHandlers('distributors')} itemName="Distribuidor" user={user} />;
      case 'manageLaboratories':
        return <GenericManagement items={data.laboratories} handlers={genericHandlers('laboratories')} itemName="Laboratorio" user={user} />;
      case 'manageProducts':
        return <ProductManagement products={products} laboratories={data.laboratories} handlers={productHandlers} user={user} />;
      case 'manageUsers':
        return <UserManagement users={data.users} handlers={genericHandlers('users')} laboratories={data.laboratories} user={user} />;
      default:
        return <div>Vista no encontrada: {currentView}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {user && currentView !== 'login' && (
        <AdminPanel onNavigate={handleNavigate} onLogout={handleLogout} currentView={currentView} user={user} />
      )}
      <main className="container mx-auto p-4 md-p-6">
        {renderView()}
      </main>
    </div>
  );
}