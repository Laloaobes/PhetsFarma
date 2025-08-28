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
  const [data, setData] = useState(initialData);
  
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

  const handlePrint = (order) => {
    if (!order) {
      console.error("No hay orden para imprimir.");
      return;
    }

    const printStyles = `
      body { font-family: Arial, sans-serif; margin: 20px; }
      .print-container { max-width: 800px; margin: auto; }
      h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; border-bottom: 2px solid #000; padding-bottom: 0.5rem;}
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem; font-size: 0.9rem; }
      .table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
      .table th, .table td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
      .table th { background-color: #f2f2f2; }
      .text-right { text-align: right; }
      .totals { display: flex; flex-direction: column; align-items: flex-end; margin-top: 1.5rem; }
      .totals div { width: 280px; display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.9rem;}
      .totals .grand-total { font-size: 1.25rem; font-weight: bold; border-top: 2px solid #333; margin-top: 0.5rem; }
    `;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.productName}</td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">$${parseFloat(item.price).toFixed(2)}</td>
        <td class="text-right">${(parseFloat(item.discount) * 100).toFixed(0)}%</td>
        <td class="text-right">$${parseFloat(item.total).toFixed(2)}</td>
      </tr>
    `).join('');

    const printContent = `
      <div class="print-container">
        <h1>Resumen de Pedido #${String(order.id).slice(0, 8)}</h1>
        <div class="info-grid">
          <div><strong>Cliente:</strong> ${order.client}</div>
          <div><strong>Representante:</strong> ${order.representative || 'N/A'}</div>
          <div><strong>Fecha:</strong> ${new Date(order.date).toLocaleDateString()}</div>
          <div><strong>Laboratorio:</strong> ${order.laboratory}</div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="text-right">Cant.</th>
              <th class="text-right">P. Unit.</th>
              <th class="text-right">Desc.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="totals">
          <div>
            <span>Subtotal:</span>
            <span>$${order.subtotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Descuento:</span>
            <span>-$${order.discountAmount.toFixed(2)}</span>
          </div>
          <div class="grand-total">
            <span>Total Final:</span>
            <span>$${order.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Imprimir Pedido</title>');
    printWindow.document.write('<style>' + printStyles + '</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
      try {
        const userDocRef = doc(db, "users", newUser.email);
        await setDoc(userDocRef, {
          name: newUser.name,
          username: newUser.username,
          role: newUser.role,
          laboratory: newUser.laboratory || ''
        });
      } catch (error) {
        console.error("Error al añadir usuario en Firestore: ", error);
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
        console.error("Error al actualizar usuario en Firestore: ", error);
      }
    },
    handleDeleteItem: async (userId) => {
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (error) {
        console.error("Error al eliminar usuario de Firestore: ", error);
      }
    },
  };

  const productHandlers = {
  };
  
  const renderView = () => {
    if (!user) {
      return <Login onLogin={handleLogin} />;
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
        return <UserManagement users={users} handlers={userHandlers} laboratories={data.laboratories} user={user} />;
      default:
        return <div>Vista no encontrada</div>;
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
