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
  sellers: [],
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
  const sampleSellers = ['Vendedor Ana', 'Vendedor Carlos', 'Juan Pérez']; // Nombres de vendedores de ejemplo
  const sampleClients = ['Veterinaria Central', 'Pet Shop Feliz', 'Animalandia'];
  const sampleDistributors = ['Distribuidora A', 'Distribuidora B', 'DistriVet']; // Los distribuidores no son roles de usuario directo aquí
  const sampleLaboratories = ['Pets Pharma', 'Kiron', 'Vets Pharma'];

  const allProducts = [
    ...petspharmaProducts,
    ...kironProducts,
    ...vetsPharmaProducts
  ];

  const orders = [];
  for (let i = 0; i < 15; i++) {
    const orderId = 1000 + i;
    const day = (i % 31) + 1; // Días del 1 al 15 o más, para agosto
    const date = new Date(2025, 7, day, 9 + (i % 10), (i * 5) % 60, 0).toISOString(); // Mes 7 es agosto (0-indexado)

    const seller = sampleSellers[Math.floor(Math.random() * sampleSellers.length)];
    const client = sampleClients[Math.floor(Math.random() * sampleClients.length)];
    const distributor = sampleDistributors[Math.floor(Math.random() * sampleDistributors.length)];
    const laboratory = sampleLaboratories[Math.floor(Math.random() * sampleLaboratories.length)];

    const numItems = Math.floor(Math.random() * 3) + 1; // 1 a 3 ítems por pedido
    let orderItems = [];
    let currentOrderSubtotal = 0;

    // Asegurarse de que los productos para el laboratorio seleccionado existan
    const availableLabProducts = allProducts.filter(p => p.laboratory === laboratory);

    if (availableLabProducts.length === 0) {
      console.warn(`No hay productos definidos para el laboratorio ${laboratory}. Saltando esta orden de ejemplo.`);
      continue;
    }

    // --- LÓGICA DE DESCUENTO ACTUALIZADA ---
    // Ahora Vets Pharma tiene el mismo descuento de 30% que Kiron.
    let maxDiscountForLab = 0; 
    if (laboratory === 'Kiron' || laboratory === 'Vets Pharma') {
      maxDiscountForLab = 0.30; 
    } else if (laboratory === 'Pets Pharma') {
      maxDiscountForLab = 0.65;
    }

    for (let j = 0; j < numItems; j++) {
      const randomProduct = availableLabProducts[Math.floor(Math.random() * availableLabProducts.length)];

      const quantity = Math.floor(Math.random() * 5) + 1; // 1 a 5 unidades
      const bonus = Math.floor(Math.random() * 2); // 0 o 1 bonus
      const price = randomProduct.price;

      // Generar un descuento aleatorio dentro del rango permitido para el laboratorio
      const maxIncrements = Math.floor(maxDiscountForLab / 0.05); // Número de incrementos de 5%
      const discount = (Math.floor(Math.random() * (maxIncrements + 1)) * 0.05); // Incluye 0%

      const itemTotal = ((quantity + bonus) * price * (1 - discount));

      orderItems.push({
        sku: randomProduct.code, // Usar el código del producto como SKU
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
      seller,
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

// Órdenes iniciales de ejemplo generadas
const initialOrders = generateSampleOrders();


export default function App() {
  const [user, setUser] = useState(null); // Objeto de usuario con rol
  const [currentView, setCurrentView] = useState('login');
  const [lastView, setLastView] = useState('login');
  const [orders, setOrders] = useState(initialOrders);
  const [data, setData] = useState(initialData);
  const [products, setProducts] = useState(initialProductsByLab);
  const [promotions, setPromotions] = useState({});
  const [currentOrder, setCurrentOrder] = useState(null);

  // Efecto para cargar el usuario desde localStorage al iniciar la app
  useEffect(() => {
    const savedUser = localStorage.getItem("salesUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView("orderForm");
    }
  }, []);

  // Función para manejar el login
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem("salesUser", JSON.stringify(loggedInUser));
    setCurrentView("orderForm");
  };

  // Función para manejar el logout
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

  // Función de impresión con estilo EXACTO de la imagen proporcionada
  const handlePrint = (order) => {
    if (!order) {
      console.error("No hay orden para imprimir.");
      return;
    }

    // Estilos CSS replicando la imagen proporcionada
    const printStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f3f4f6; /* Fondo gris claro */
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-page-container {
        max-width: 800px; /* Ancho ajustado para la imagen */
        margin: 40px auto; /* Centrado vertical y horizontal */
        padding: 32px; /* p-8 */
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06); /* Sombra suave */
      }
      h1 {
        font-size: 1.5rem; /* text-2xl */
        font-weight: 700; /* font-bold */
        color: #1f2937; /* text-gray-800 */
        margin-bottom: 24px; /* mb-6 */
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
      .icon { margin-right: 12px; color: #6b7280; font-size: 1.5rem; } /* Icono del printer */

      .info-grid {
        display: grid;
        grid-template-columns: 1.5fr 1.5fr 1fr; /* 3 columnas: Cliente/Lab/ID, Vendedor/Fecha, Distribuidor/Hora */
        gap: 8px 24px; /* gap-y-2 gap-x-6 */
        margin-bottom: 24px; /* mb-6 */
        font-size: 0.875rem; /* text-sm */
        color: #4b5563; /* text-gray-600 */
      }
      .info-grid div strong { color: #1f2937; margin-right: 5px; } /* text-gray-800 */
      .info-grid div { line-height: 1.4; } /* Espaciado de línea */

      .products-table-section {
        /* No border-top o border-bottom general para la sección, se manejarán en rows */
        padding-top: 0;
        padding-bottom: 0;
        margin-top: 24px; /* Espacio entre info y productos */
        margin-bottom: 24px; /* Espacio antes del total */
      }
      
      .products-table-header-print, .products-table-row-print {
        display: grid;
        /* Columnas basadas en la imagen: Producto (ancho), Cant (pequeño), P. Unit (mediano), Desc (%) (pequeño), Total (mediano) */
        grid-template-columns: 3.5fr 1fr 1.5fr 1fr 2fr; /* Ajustado para 5 columnas visibles */
        gap: 16px; /* gap-x-4 */
        padding: 8px 0; /* Padding vertical para filas */
        border-bottom: 1px solid #e5e7eb; /* Separador de fila */
      }
      .products-table-header-print {
        font-weight: 600; /* font-semibold */
        color: #374151; /* text-gray-700 */
        border-top: 1px solid #e5e7eb; /* Borde superior para la cabecera */
      }
      .products-table-row-print {
        color: #4b5563; /* text-gray-600 */
        font-size: 0.9rem; /* Tamaño ligeramente más grande para las filas */
      }
      .products-table-row-print:last-child {
        border-bottom: none; /* No border for the last product item */
      }

      /* Alineación de texto en la tabla de productos */
      .products-table-header-print div:nth-child(1), /* Producto */
      .products-table-row-print div:nth-child(1) { /* Producto */
        text-align: left;
      }
      .products-table-header-print div:nth-child(2), /* Cant. */
      .products-table-row-print div:nth-child(2) { /* Cant. */
        text-align: center; /* Cantidad centrada */
      }
      .products-table-header-print div:nth-child(3), /* P. Unit. */
      .products-table-header-print div:nth-child(4), /* Desc. (%) */
      .products-table-header-print div:nth-child(5), /* Total */
      .products-table-row-print div:nth-child(3), /* P. Unit. */
      .products-table-row-print div:nth-child(4), /* Desc. (%) */
      .products-table-row-print div:nth-child(5) { /* Total */
        text-align: right;
      }

      .totals-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end; /* Alineado a la derecha */
        margin-top: 24px; /* mt-6 */
        gap: 0; /* No hay espacio entre las filas de totales */
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        width: 100%;
        max-width: 300px; /* Ancho fijo para la sección de totales */
        padding: 4px 0; /* Espaciado para la fila del total */
      }
      .total-row .total-label {
        font-size: 1.8rem; /* text-3xl */
        font-weight: 700; /* font-bold */
        color: #1f2937; /* text-gray-800 */
      }
      .total-row .total-value {
        font-size: 1.8rem; /* text-3xl */
        font-weight: 700; /* font-bold */
        color: #1f2937; /* text-gray-800 */
      }

      .footer-text {
        text-align: center;
        font-size: 0.75rem; /* text-xs */
        color: #9ca3af; /* text-gray-400 */
        margin-top: 32px; /* mt-8 */
      }
    `;

    // Encabezados de la tabla de productos
    const productsTableHeaderHtml = `
      <div class="products-table-header-print">
        <div>Producto</div>
        <div>Cant.</div>
        <div>P. Unit.</div>
        <div>Desc. (%)</div>
        <div>Total</div>
      </div>
    `;

    // Generación de filas de productos
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
          <div><strong>Vendedor:</strong> ${order.seller || 'N/A'}</div>
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
      // Reemplazando alert() por un mensaje en la consola
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
      // Reemplazando window.confirm() por un mensaje en la consola para confirmar
      if (key !== 'users') {
        console.warn(`Confirmación de eliminación: ¿Estás seguro de que quieres eliminar este ${key.slice(0, -1)}?`);
        setData(prevData => ({
          ...prevData,
          [key]: prevData[key].filter(item => item.id !== id)
        }));
      } else if (key === 'users') {
        // La lógica de confirmación para usuarios se maneja dentro de UserManagement.js
        setData(prevData => ({
          ...prevData,
          [key]: prevData[key].filter(item => item.id !== id)
        }));
      }
    },
  });

  // Handlers específicos para productos
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
      // La función ahora recibe 'code' en lugar de 'id'
      console.warn(`Confirmación de eliminación: ¿Estás seguro de que quieres eliminar este producto del laboratorio ${laboratoryName}?`);
      setProducts(prevProducts => ({
        ...prevProducts,
        [laboratoryName]: prevProducts[laboratoryName].filter(item => item.code !== code) // Filtramos por 'code' en lugar de 'id'
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
            sellers={data.sellers}
            distributors={data.distributors}
            laboratories={data.laboratories}
            user={user} // Pasar el usuario
          />
        );
      case 'orderSummary':
        return (
          <OrderSummary
            order={currentOrder}
            onNavigate={handleNavigate}
            previousView={lastView}
            onPrint={handlePrint}
            user={user} // Pasar el usuario
          />
        );
      case 'reports':
        return (
          <Reports
            orders={orders}
            onNavigate={handleNavigate}
            sellers={data.sellers}
            distributors={data.distributors}
            laboratories={data.laboratories}
            products={products}
            user={user} // Pasar el usuario
          />
        );
      case 'manageClients':
        return (
          <GenericManagement
            items={data.clients}
            handlers={genericHandlers('clients')}
            itemName="Cliente"
            user={user} // Pasar el usuario
          />
        );
      case 'manageSellers': // Ahora gestionará a los Vendedores
        return (
          <GenericManagement
            items={data.sellers}
            handlers={genericHandlers('sellers')}
            itemName="Representante/Promotor" // Nombre actualizado
            user={user} // Pasar el usuario
          />
        );
      case 'manageDistributors': // Los distribuidores se gestionan por separado si no son usuarios
        return (
          <GenericManagement
            items={data.distributors}
            handlers={genericHandlers('distributors')}
            itemName="Distribuidor"
            user={user} // Pasar el usuario
          />
        );
      case 'manageLaboratories':
        return (
          <GenericManagement
            items={data.laboratories}
            handlers={genericHandlers('laboratories')}
            itemName="Laboratorio"
            user={user} // Pasar el usuario (fundamental para el permiso)
          />
        );
      case 'manageProducts':
        return (
          <ProductManagement
            products={products}
            laboratories={data.laboratories}
            handlers={productHandlers}
            user={user} // Pasar el usuario
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
          user={user} // Pasar el usuario al AdminPanel
        />
      )}
      <main className="container mx-auto p-4 md:p-6">
        {renderView()}
      </main>
    </div>
  );
}
