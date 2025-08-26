import React from 'react';
import { Printer, Share2, Plus, ArrowLeft } from 'lucide-react';

export default function OrderSummary({ order, onNavigate, previousView, onPrint, user }) {
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumen no disponible</h2>
        <p className="text-gray-600 mb-6">No se encontró información para este pedido.</p>
        <button
          onClick={() => onNavigate('orderForm')}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Volver a Crear Pedido
        </button>
      </div>
    );
  }

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint(order);
    }
  };

  const handleShareWhatsApp = () => {
    let message = `¡Hola! Aquí el resumen de tu pedido:\n\n`;
    message += `Pedido ID: #${order.id}\n`;
    message += `Fecha: ${new Date(order.date).toLocaleDateString()}\n`;
    message += `Cliente: ${order.client}\n`;
    message += `Representante/Promotor: ${order.seller}\n`; // Nombre de rol actualizado
    message += `Distribuidor: ${order.distributor || 'N/A'}\n`; // Nuevo rol/campo
    message += `Laboratorio: ${order.laboratory}\n\n`;

    message += `Productos:\n`;
    order.items.forEach(item => {
      const bonusText = item.bonus > 0 ? ` (+${item.bonus} bonus)` : '';
      const itemDiscountPercentage = (parseFloat(item.discount) * 100).toFixed(0);
      message += `- ${item.productName} (Cant: ${item.quantity}${bonusText}, Precio: $${parseFloat(item.price).toFixed(2)}, Desc: ${itemDiscountPercentage}%) Total: $${parseFloat(item.total).toFixed(2)}\n`;
    });

    // En el mensaje de WhatsApp, siempre mostrar subtotal y descuento si existen, para dar detalle
    if (order.subtotal !== order.grandTotal) {
      message += `\nSubtotal: $${order.subtotal.toFixed(2)}\n`;
      if (order.discountAmount > 0) { // Siempre que haya descuento, mostrar el monto
        message += `Descuento aplicado: -$${order.discountAmount.toFixed(2)}\n`;
      }
    }
    message += `Total Final: $${order.grandTotal.toFixed(2)}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const returnInfo = previousView === 'reports'
    ? { text: 'Volver a Reportes', action: () => onNavigate('reports', null), icon: <ArrowLeft className="mr-2" /> }
    : { text: 'Hacer Otro Pedido', action: () => onNavigate('orderForm'), icon: <Plus className="mr-2" /> };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-4xl mx-auto my-10 no-print">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Printer className="mr-3 text-gray-500" /> Resumen de Pedido
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 mb-6 text-sm text-gray-600">
        <div><strong>Cliente:</strong> {order.client || 'N/A'}</div>
        <div><strong>Representante/Promotor:</strong> {order.seller || 'N/A'}</div> {/* Nombre de rol actualizado */}
        <div><strong>Distribuidor:</strong> {order.distributor || 'N/A'}</div>
        <div><strong>Laboratorio:</strong> {order.laboratory || 'N/A'}</div>
        <div><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString()}</div>
        <div><strong>Hora:</strong> {new Date(order.date).toLocaleTimeString()}</div>
        <div><strong>ID Pedido:</strong> {order.id}</div>
      </div>
      <div className="border-t border-b border-gray-200 py-4 my-4">
        <div className="grid grid-cols-6 gap-x-4 font-semibold text-gray-700 mb-2 px-2 py-1">
          <div className="col-span-2">Producto</div>
          <div>Cant.</div>
          <div className="text-right">P. Unit.</div>
          <div className="text-right">Desc. (%)</div>
          <div className="text-right">Total</div>
        </div>
        {order.items.map((item, index) => (
          <div key={index} className="grid grid-cols-6 gap-x-4 py-1 text-gray-600 px-2">
            <div className="col-span-2">{item.productName}</div>
            <div>{item.quantity}</div>
            <div className="text-right">${parseFloat(item.price).toFixed(2)}</div>
            <div className="text-right">{(parseFloat(item.discount) * 100).toFixed(0)}%</div>
            <div className="text-right">${item.total}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-end mt-6 space-y-2">
        {/* Aquí solo mostraremos el Total Final, como en la imagen del PDF */}
        <div className="flex justify-between w-full max-w-sm text-gray-800">
          <span className="text-2xl font-bold">Total:</span>
          <span className="text-2xl font-bold">${order.grandTotal.toFixed(2)}</span>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 mt-8">
        <p>Gracias por su compra.</p>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={returnInfo.action}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors flex items-center"
        >
          {returnInfo.icon} {returnInfo.text}
        </button>
        <button
          onClick={handlePrintClick}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Printer size={20} /> Imprimir Resumen
        </button>
        <button
          onClick={handleShareWhatsApp}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
        >
          <Share2 size={20} /> Compartir
        </button>
      </div>
    </div>
  );
}
