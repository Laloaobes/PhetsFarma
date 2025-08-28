import React, { useState, useEffect } from 'react';
// Importa AdminPanel para la navegación principal
import AdminPanel from './components/AdminPanel';
import OrderForm from './components/OrderForm';
import OrderSummary from './components/OrderSummary';
import Reports from './components/ReportsView';
import GenericManagement from './components/GenericManagement';
import ProductManagement from './components/ProductManagement';
import UserManagement from './components/UserManagement';

import Login from './components/Login';

import { petspharmaProducts, kironProducts, vetsPharmaProducts } from './data/productList';

// Datos de ejemplo para la aplicación
const initialData = {
  representatives: [], 
  clients: [],
  distributors: [],
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

// Productos iniciales, estructurados directamente por laboratorio usando los imports
const initialProductsByLab = {
  'Pets Pharma': petspharmaProducts,
  'Kiron': kironProducts,
  'Vets Pharma': vetsPharmaProducts
};

// Función para generar órdenes de ejemplo
const generateSampleOrders = () => {
  const sampleRepresentatives = ['Vendedor Ana', 'Vendedor Carlos', 'Juan Pérez'];
  const sampleClients = ['Veterinaria Central', 'Pet Shop Feliz', 'Animalandia'];
  const sampleDistributors = ['Distribuidora A', 'Distribuidora B', 'DistriVet'];
  const sampleLaboratories = ['Pets Pharma', 'Kiron', 'Vets Pharma'];

  const allProducts = [ ...petspharmaProducts, ...kironProducts, ...vetsPharmaProducts ];

  const orders = [];
  for (let i = 0; i < 15; i++) {
    const orderId = 1000 + i;
    const day = (i % 31) + 1;
    const date = new Date(2025, 7, day, 9 + (i % 10), (i * 5) % 60, 0).toISOString();

    const representative = sampleRepresentatives[Math.floor(Math.random() * sampleRepresentatives.length)];
    const client = sampleClients[Math.floor(Math.random() * sampleClients.length)];
    const distributor = sampleDistributors[Math.floor(Math.random() * sampleDistributors.length)];
    const laboratory = sampleLaboratories[Math.floor(Math.random() * sampleLaboratories.length)];

    const numItems = Math.floor(Math.random() * 3) + 1;
    let orderItems = [];
    let currentOrderSubtotal = 0;
    let totalDiscountAmount = 0;

    const availableLabProducts = allProducts.filter(p => p.laboratory === laboratory);

    if (availableLabProducts.length === 0) continue;

    let maxDiscountForLab = 0; 
    if (laboratory === 'Kiron' || laboratory === 'Vets Pharma') maxDiscountForLab = 0.35; 
    else if (laboratory === 'Pets Pharma') maxDiscountForLab = 0.65;

    for (let j = 0; j < numItems; j++) {
      const randomProduct = availableLabProducts[Math.floor(Math.random() * availableLabProducts.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const bonus = Math.floor(Math.random() * 2);
      const price = randomProduct.price;
      const maxIncrements = Math.floor(maxDiscountForLab / 0.05);
      const discount = (Math.floor(Math.random() * (maxIncrements + 1)) * 0.05);
      
      const rawItemTotal = quantity * price;
      const itemDiscountValue = rawItemTotal * discount;
      const itemFinalTotal = rawItemTotal - itemDiscountValue;

      orderItems.push({
        sku: randomProduct.code,
        productName: randomProduct.name,
        quantity: quantity.toString(),
        bonus: bonus.toString(),
        price: price.toFixed(2),
        discount: discount.toFixed(2),
        total: itemFinalTotal.toFixed(2),
      });
      currentOrderSubtotal += rawItemTotal;
      totalDiscountAmount += itemDiscountValue;
    }

    orders.push({
      id: orderId,
      date,
      representative,
      client,
      distributor,
      laboratory,
      items: orderItems,
      subtotal: currentOrderSubtotal,
      discountAmount: totalDiscountAmount,
      grandTotal: currentOrderSubtotal - totalDiscountAmount,
    });
  }
  return orders;
};

const initialOrders = generateSampleOrders();

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [lastView, setLastView] = useState('login');
  const [orders, setOrders] = useState(initialOrders);
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

  const handleSaveOrder = (newOrder) => {
    setOrders([...orders, newOrder]);
    setCurrentOrder(newOrder);
    handleNavigate('orderSummary', newOrder);
  };

  const handlePrint = (order) => {
    if (!order) {
      console.error("No hay orden para imprimir.");
      return;
    }
    // La lógica de impresión se mantiene igual
    const printStyles = `
      body { font-family: 'Inter', sans-serif; }
      /* ... estilos completos ... */
    `;
    const printContentHtml = `
      <div>... contenido de impresión ...</div>
    `;
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>Imprimir Pedido</title><style>${printStyles}</style></head><body>${printContentHtml}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const genericHandlers = (key) => ({
    handleAddItem: (item) => {
      setData(prevData => ({
        ...prevData,
        [key]: [...prevData[key], { ...item, id: Date.now() }]
      }));
    },
    handleUpdateItem: (updatedItem) => {
      setData(prevData => ({
        ...prevData,
        [key]: prevData[key].map(item => item.id === updatedItem.id ? updatedItem : item)
      }));
    },
    handleDeleteItem: (id) => {
      setData(prevData => ({
        ...prevData,
        [key]: prevData[key].filter(item => item.id !== id)
      }));
    },
  });

  const productHandlers = {
    handleAddItem: (item) => {
      const laboratoryName = item.laboratory;
      setProducts(prevProducts => ({
        ...prevProducts,
        [laboratoryName]: [...(prevProducts[laboratoryName] || []), { ...item, id: Date.now() }]
      }));
    },
    handleUpdateItem: (updatedItem) => {
      const laboratoryName = updatedItem.laboratory;
      setProducts(prevProducts => ({
        ...prevProducts,
        [laboratoryName]: prevProducts[laboratoryName].map(item => item.code === updatedItem.code ? { ...updatedItem, id: item.id } : item)
      }));
    },
    handleDeleteItem: (code, laboratoryName) => {
      setProducts(prevProducts => ({
        ...prevProducts,
        [laboratoryName]: prevProducts[laboratoryName].filter(item => item.code !== code)
      }));
    },
  };
  
  const renderView = () => {
    if (!user) {
      return <Login onLogin={handleLogin} users={data.users} />;
    }

    switch (currentView) {
      case 'orderForm':
        return (
          <OrderForm
            onSaveOrder={handleSaveOrder}
            products={products}
            clients={data.clients}
            representatives={data.representatives}
            distributors={data.distributors}
            laboratories={data.laboratories}
            user={user}
            // --- CORRECCIÓN AQUÍ ---
            // Se pasan las funciones para guardar nuevos representantes y distribuidores
            onSaveNewClient={genericHandlers('clients').handleAddItem}
            onSaveNewRepresentative={genericHandlers('representatives').handleAddItem}
            onSaveNewDistributor={genericHandlers('distributors').handleAddItem}
          />
        );
      case 'orderSummary':
        return (
          <OrderSummary
            order={currentOrder}
            onNavigate={handleNavigate}
            previousView={lastView}
            onPrint={handlePrint}
            user={user}
          />
        );
      case 'reports':
        return (
          <Reports
            orders={orders}
            onNavigate={handleNavigate}
            sellers={data.representatives}
            distributors={data.distributors}
            laboratories={data.laboratories}
            products={products}
            user={user}
          />
        );
      case 'manageClients':
        return (
          <GenericManagement
            items={data.clients}
            handlers={genericHandlers('clients')}
            itemName="Cliente"
            user={user}
          />
        );
      case 'manageSellers':
        return (
          <GenericManagement
            items={data.representatives}
            handlers={genericHandlers('representatives')}
            itemName="Representante/Promotor"
            user={user}
          />
        );
      case 'manageDistributors':
        return (
          <GenericManagement
            items={data.distributors}
            handlers={genericHandlers('distributors')}
            itemName="Distribuidor"
            user={user}
          />
        );
      case 'manageLaboratories':
        return (
          <GenericManagement
            items={data.laboratories}
            handlers={genericHandlers('laboratories')}
            itemName="Laboratorio"
            user={user}
          />
        );
      case 'manageProducts':
        return (
          <ProductManagement
            products={products}
            laboratories={data.laboratories}
            handlers={productHandlers}
            user={user}
          />
        );
      case 'manageUsers':
        return (
          <UserManagement
            users={data.users}
            handlers={genericHandlers('users')}
            laboratories={data.laboratories}
            user={user}
          />
        );
      default:
        return (
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-red-600">Vista no encontrada</h2>
            <p className="text-gray-600 mt-2">La vista "{currentView}" no existe.</p>
            <button onClick={() => handleNavigate('orderForm')} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Volver al inicio
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {user && currentView !== 'login' && (
        <AdminPanel
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          currentView={currentView}
          user={user}
        />
      )}
      <main className="container mx-auto p-4 md:p-6">
        {renderView()}
      </main>
    </div>
  );
}