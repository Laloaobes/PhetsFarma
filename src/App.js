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
  // Los siguientes arrays se han vaciado para que se puedan agregar manualmente a través de la interfaz
  representatives: [], // <--- CAMBIO: Renombrado de 'sellers' a 'representatives'
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
    { id: 6, username: 'coordinador_ventas', password: 'password', name: 'Coordinador Ventas', role: 'Coordinador de vendedores' }, // Rol actualizado
    { id: 7, username: 'vendedor_ana', password: 'password', name: 'Vendedor Ana', role: 'Vendedor' }, // Nuevo rol consolidado
    { id: 8, username: 'vendedor_carlos', password: 'password', name: 'Vendedor Carlos', role: 'Vendedor' }, // Nuevo rol consolidado
]
};

// Productos iniciales, estructurados directamente por laboratorio usando los imports
const initialProductsByLab = {
  'Pets Pharma': petspharmaProducts,
  'Kiron': kironProducts,
  'Vets Pharma': vetsPharmaProducts
};

// Función para generar 15 órdenes de ejemplo con diferentes fechas de agosto de 2025
const generateSampleOrders = () => {
  const sampleRepresentatives = ['Vendedor Ana', 'Vendedor Carlos', 'Juan Pérez']; // <--- CAMBIO: Renombrado
  const sampleClients = ['Veterinaria Central', 'Pet Shop Feliz', 'Animalandia'];
  const sampleDistributors = ['Distribuidora A', 'Distribuidora B', 'DistriVet'];
  const sampleLaboratories = ['Pets Pharma', 'Kiron', 'Vets Pharma'];

  const allProducts = [
    ...petspharmaProducts,
    ...kironProducts,
    ...vetsPharmaProducts
  ];

  const orders = [];
  for (let i = 0; i < 15; i++) {
    const orderId = 1000 + i;
    const day = (i % 31) + 1;
    const date = new Date(2025, 7, day, 9 + (i % 10), (i * 5) % 60, 0).toISOString();

    const representative = sampleRepresentatives[Math.floor(Math.random() * sampleRepresentatives.length)]; // <--- CAMBIO: Usar 'representative'
    const client = sampleClients[Math.floor(Math.random() * sampleClients.length)];
    const distributor = sampleDistributors[Math.floor(Math.random() * sampleDistributors.length)];
    const laboratory = sampleLaboratories[Math.floor(Math.random() * sampleLaboratories.length)];

    const numItems = Math.floor(Math.random() * 3) + 1;
    let orderItems = [];
    let currentOrderSubtotal = 0;

    const availableLabProducts = allProducts.filter(p => p.laboratory === laboratory);

    if (availableLabProducts.length === 0) {
      console.warn(`No hay productos definidos para el laboratorio ${laboratory}. Saltando esta orden de ejemplo.`);
      continue;
    }

    let maxDiscountForLab = 0; 
    if (laboratory === 'Kiron' || laboratory === 'Vets Pharma') {
      maxDiscountForLab = 0.30; 
    } else if (laboratory === 'Pets Pharma') {
      maxDiscountForLab = 0.65;
    }

    for (let j = 0; j < numItems; j++) {
      const randomProduct = availableLabProducts[Math.floor(Math.random() * availableLabProducts.length)];

      const quantity = Math.floor(Math.random() * 5) + 1;
      const bonus = Math.floor(Math.random() * 2);
      const price = randomProduct.price;

      const maxIncrements = Math.floor(maxDiscountForLab / 0.05);
      const discount = (Math.floor(Math.random() * (maxIncrements + 1)) * 0.05);

      const itemTotal = ((quantity + bonus) * price * (1 - discount));

      orderItems.push({
        sku: randomProduct.code,
        productName: randomProduct.name,
        quantity: quantity.toString(),
        bonus: bonus.toString(),
        price: price.toFixed(2),
        discount: discount.toFixed(2),
        total: itemTotal.toFixed(2),
      });
      currentOrderSubtotal += itemTotal;
    }

    const finalSubtotal = parseFloat(currentOrderSubtotal.toFixed(2));
    const finalDiscountAmount = 0;
    const finalGrandTotal = finalSubtotal - finalDiscountAmount;

    orders.push({
      id: orderId,
      date,
      representative, // <--- CAMBIO: Usar 'representative' en lugar de 'seller'
      client,
      distributor,
      laboratory,
      items: orderItems,
      subtotal: finalSubtotal,
      discountAmount: finalDiscountAmount,
      appliedGlobalDiscount: 0,
      grandTotal: finalGrandTotal,
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
  const [promotions, setPromotions] = useState({});
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

    const printStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f3f4f6;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-page-container {
        max-width: 800px;
        margin: 40px auto;
        padding: 32px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06);
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
      .icon { margin-right: 12px; color: #6b7280; font-size: 1.5rem; }

      .info-grid {
        display: grid;
        grid-template-columns: 1.5fr 1.5fr 1fr;
        gap: 8px 24px;
        margin-bottom: 24px;
        font-size: 0.875rem;
        color: #4b5563;
      }
      .info-grid div strong { color: #1f2937; margin-right: 5px; }
      .info-grid div { line-height: 1.4; }

      .products-table-section {
        padding-top: 0;
        padding-bottom: 0;
        margin-top: 24px;
        margin-bottom: 24px;
      }
      
      .products-table-header-print, .products-table-row-print {
        display: grid;
        grid-template-columns: 3.5fr 1fr 1.5fr 1fr 2fr;
        gap: 16px;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .products-table-header-print {
        font-weight: 600;
        color: #374151;
        border-top: 1px solid #e5e7eb;
      }
      .products-table-row-print {
        color: #4b5563;
        font-size: 0.9rem;
      }
      .products-table-row-print:last-child {
        border-bottom: none;
      }

      .products-table-header-print div:nth-child(1),
      .products-table-row-print div:nth-child(1) {
        text-align: left;
      }
      .products-table-header-print div:nth-child(2),
      .products-table-row-print div:nth-child(2) {
        text-align: center;
      }
      .products-table-header-print div:nth-child(3),
      .products-table-header-print div:nth-child(4),
      .products-table-header-print div:nth-child(5),
      .products-table-row-print div:nth-child(3),
      .products-table-row-print div:nth-child(4),
      .products-table-row-print div:nth-child(5) {
        text-align: right;
      }

      .totals-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        margin-top: 24px;
        gap: 0;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        width: 100%;
        max-width: 300px;
        padding: 4px 0;
      }
      .total-row .total-label {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1f2937;
      }
      .total-row .total-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1f2937;
      }

      .footer-text {
        text-align: center;
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 32px;
      }
    `;

    const productsTableHeaderHtml = `
      <div class="products-table-header-print">
        <div>Producto</div>
        <div>Cant.</div>
        <div>P. Unit.</div>
        <div>Desc. (%)</div>
        <div>Total</div>
      </div>
    `;

    let productsHtml = order.items.map((item) => {
      const itemPriceFormatted = parseFloat(item.price).toFixed(2);
      const itemDiscountPercentage = (parseFloat(item.discount) * 100).toFixed(0);
      const itemTotalFormatted = parseFloat(item.total).toFixed(2);

      return `
        <div class="products-table-row-print">
          <div>${item.productName}</div>
          <div>${item.quantity}</div>
          <div>$${itemPriceFormatted}</div>
          <div>${itemDiscountPercentage}%</div>
          <div>$${itemTotalFormatted}</div>
        </div>
      `;
    }).join('');

    let printContentHtml = `
      <div class="print-page-container">
        <h1>
          <span class="icon">⎙</span> Resumen de Pedido
        </h1>
        <div class="info-grid">
          <div><strong>Cliente:</strong> ${order.client || 'N/A'}</div>
          <div><strong>Vendedor:</strong> ${order.representative || 'N/A'}</div> <!-- CAMBIO: Usar order.representative -->
          <div><strong>Distribuidor:</strong> ${order.distributor || 'N/A'}</div>
          <div><strong>Laboratorio:</strong> ${order.laboratory || 'N/A'}</div>
          <div><strong>Fecha:</strong> ${new Date(order.date).toLocaleDateString()}</div>
          <div><strong>Hora:</strong> ${new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div><strong>ID Pedido:</strong> ${order.id}</div>
        </div>
        <div class="products-table-section">
          ${productsTableHeaderHtml}
          ${productsHtml}
        </div>
        <div class="totals-section">
          <div class="total-row">
            <span class="total-label">Total:</span>
            <span class="total-value">$${order.grandTotal.toFixed(2)}</span>
          </div>
        </div>
        <div class="footer-text">
          <p>Gracias por su compra.</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Imprimir Pedido</title>');
      printWindow.document.write('<style>' + printStyles + '</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContentHtml);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } else {
      console.error("No se pudo abrir la ventana de impresión. Por favor, asegúrese de que las ventanas emergentes estén permitidas.");
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
      if (key !== 'users') {
        console.warn(`Confirmación de eliminación: ¿Estás seguro de que quieres eliminar este ${key.slice(0, -1)}?`);
        setData(prevData => ({
          ...prevData,
          [key]: prevData[key].filter(item => item.id !== id)
        }));
      } else if (key === 'users') {
        setData(prevData => ({
          ...prevData,
          [key]: prevData[key].filter(item => item.id !== id)
        }));
      }
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
      console.warn(`Confirmación de eliminación: ¿Estás seguro de que quieres eliminar este producto del laboratorio ${laboratoryName}?`);
      setProducts(prevProducts => ({
        ...prevProducts,
        [laboratoryName]: prevProducts[laboratoryName].filter(item => item.code !== code)
      }));
    },
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
            clients={data.clients}
            representatives={data.representatives} // <--- CAMBIO: Pasar 'representatives'
            distributors={data.distributors}
            laboratories={data.laboratories}
            user={user}
            onSaveNewClient={genericHandlers('clients').handleAddItem} // <--- NUEVO: Prop para guardar nuevos clientes
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
            sellers={data.representatives} // <--- CAMBIO: Usar 'representatives' para reportes
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
            items={data.representatives} // <--- CAMBIO: Usar 'representatives'
            handlers={genericHandlers('representatives')} // <--- CAMBIO: Usar 'representatives'
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
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Error de Navegación</h3>
            <p className="text-gray-500 mb-2">La vista solicitada (<code>{currentView}</code>) no fue encontrada o no está implementada correctamente.</p>
            <p className="text-gray-500">Por favor, verifica la ruta o contacta a soporte.</p>
            <button onClick={() => handleNavigate('orderForm')} className="mt-6 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
              Volver a Pedido
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
