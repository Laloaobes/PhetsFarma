import React, { useState, useEffect } from 'react';
// Importa AdminPanel para la navegación principal
import AdminPanel from './components/AdminPanel'; 
import OrderForm from './components/OrderForm';
import OrderSummary from './components/OrderSummary';
import Reports from './components/ReportsView';
import GenericManagement from './components/GenericManagement';
import ProductManagement from './components/ProductManagement';
import Login from './components/Login'; 

import { phetsfarmaProducts, kironProducts, laboratorioXProducts } from './data/productList'; 

// Datos de ejemplo para la aplicación
const initialData = {
  // Se eliminan los datos iniciales para que se puedan agregar manualmente
  sellers: [],
  clients: [],
  distributors: [],
  laboratories: [
    { id: 1, name: 'Phetsfarma' },
    { id: 2, name: 'Kiron' },
    { id: 3, name: 'Laboratorio X' },
  ],
};

// Se definen las opciones de descuento global en incrementos del 5%
const globalDiscountOptions = [
  { label: '0%', value: 0 },
  { label: '5%', value: 0.05 },
  { label: '10%', value: 0.10 },
  { label: '15%', value: 0.15 },
  { label: '20%', value: 0.20 },
  { label: '25%', value: 0.25 },
];


// Productos iniciales, estructurados directamente por laboratorio usando los imports
const initialProductsByLab = {
  'Phetsfarma': phetsfarmaProducts, 
  'Kiron': kironProducts,
  'Laboratorio X': laboratorioXProducts
};


// Órdenes iniciales de ejemplo
const initialOrders = [
  {
    id: 1, date: '2025-08-20T10:00:00Z', seller: 'Juan Pérez', client: 'Veterinaria El Gato Feliz', distributor: 'Distribuidora A', laboratory: 'Phetsfarma',
    items: [
      { productName: 'ACUACIDE BOTE 1 LT', quantity: 2, bonus: 0, price: '300.00', discount: 0, total: '600.00' },
      { productName: 'AMOXILAND 100 ML', quantity: 1, bonus: 0, price: '110.00', discount: 0, total: '110.00' },
    ],
    subtotal: 710.00, discountAmount: 0, appliedGlobalDiscount: 0, grandTotal: 710.00
  },
];

export default function App() {
  const [user, setUser] = useState(null);
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
  const handleLogin = (username, password) => {
    // Verificación de credenciales de ejemplo
    if (username === "admin" && password === "admin123") { 
      const userData = { username: "admin", isAdmin: true };
      setUser(userData);
      localStorage.setItem("salesUser", JSON.stringify(userData)); 
      setCurrentView("orderForm"); 
    } else {
      alert("Credenciales incorrectas."); 
    }
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

  // Función de impresión con estilo de OrderSummary
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
      .total-row.grand-total-text { 
        font-size: 1.8rem; /* text-3xl */
        font-weight: 700; /* font-bold */
        color: #1f2937; /* text-gray-800 */
      }
      .total-row.grand-total-value { 
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
          <span class="icon"></span> Resumen de Pedido
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
            <span class="grand-total-text">Total:</span>
            <span class="grand-total-value">$${order.grandTotal.toFixed(2)}</span>
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
      alert("No se pudo abrir la ventana de impresión. Por favor, asegúrese de que las ventanas emergentes estén permitidas.");
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
      if (window.confirm(`¿Estás seguro de que quieres eliminar este ${key.slice(0, -1)}?`)) {
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
        [laboratoryName]: prevProducts[laboratoryName].map(item => item.id === updatedItem.id ? updatedItem : item)
      }));
    },
    handleDeleteItem: (id, laboratoryName) => {
      if (window.confirm(`¿Estás seguro de que quieres eliminar este producto del laboratorio ${laboratoryName}?`)) {
        setProducts(prevProducts => ({
          ...prevProducts,
          [laboratoryName]: prevProducts[laboratoryName].filter(item => item.id !== id)
        }));
      }
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
            globalDiscountOptions={globalDiscountOptions} 
          />
        );
      case 'orderSummary':
        return (
          <OrderSummary
            order={currentOrder}
            onNavigate={handleNavigate}
            previousView={lastView}
            onPrint={handlePrint}
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
          />
        );
      case 'manageClients':
        return (
          <GenericManagement
            items={data.clients}
            handlers={genericHandlers('clients')}
            itemName="Cliente"
          />
        );
      case 'manageSellers':
        return (
          <GenericManagement
            items={data.sellers}
            handlers={genericHandlers('sellers')}
            itemName="Vendedor"
          />
        );
      case 'manageDistributors':
        return (
          <GenericManagement
            items={data.distributors}
            handlers={genericHandlers('distributors')}
            itemName="Distribuidor"
          />
        );
      case 'manageLaboratories':
        return (
          <GenericManagement
            items={data.laboratories}
            handlers={genericHandlers('laboratories')}
            itemName="Laboratorio"
          />
        );
      case 'manageProducts':
        return (
          <ProductManagement
            products={products} 
            laboratories={data.laboratories}
            handlers={productHandlers}
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
        />
      )}
      <main className="container mx-auto p-4 md:p-6">
        {renderView()}
      </main>
    </div>
  );
}
