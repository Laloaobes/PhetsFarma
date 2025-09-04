import React from 'react';
import { Printer, Share2, Plus, ArrowLeft } from 'lucide-react';

// Función de utilidad para formatear la moneda
const formatCurrency = (number) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

// --- Sub-componente para la vista móvil ---
const ItemCard = ({ item }) => (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
        <div className="flex justify-between items-start">
            <p className="font-bold text-gray-800 break-words pr-4">{item.productName}</p>
            <p className="text-lg font-bold text-gray-900 shrink-0">{formatCurrency(item.total)}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm border-t border-slate-200 pt-3">
            <div>
                <span className="text-slate-500 block text-xs">Cantidad</span>
                <span className="font-medium text-slate-700">{item.quantity}</span>
            </div>
            <div>
                <span className="text-slate-500 block text-xs">Bonif.</span>
                <span className="font-medium text-slate-700">{item.bonus || 0}</span>
            </div>
            <div>
                <span className="text-slate-500 block text-xs">P. Unit.</span>
                <span className="font-medium text-slate-700">{formatCurrency(item.price)}</span>
            </div>
            <div>
                <span className="text-slate-500 block text-xs">Desc.</span>
                <span className="font-medium text-slate-700">{(parseFloat(item.discount) * 100).toFixed(0)}%</span>
            </div>
        </div>
    </div>
);

export default function OrderSummary({ order, onNavigate, previousView }) {

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumen no disponible</h2>
        <p className="text-gray-600 mb-6">No se encontró información para este pedido.</p>
        <button onClick={() => onNavigate('orderForm')} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Volver a Crear Pedido
        </button>
      </div>
    );
  }
  
  const getLogoSrc = (laboratory) => {
    switch (laboratory) {
      case 'Kiron':
        return '/kiron.png';
      case 'Vets Pharma':
        return '/vets.png';
      case 'Pets Pharma':
        return '/LogoPets-1-1.png';
      default:
        return '/grupogarvo.png'; // Logo por defecto
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    let message = `¡Hola! Aquí el resumen de tu pedido:\n\n`;
    message += `Pedido ID: #${String(order.id).slice(0, 8)}\n`;
    message += `Fecha: ${new Date(order.date).toLocaleDateString()}\n`;
    message += `Cliente: ${order.client}\n`;
    message += `Representante: ${order.representative}\n\n`;
    message += `Productos:\n`;
    order.items.forEach(item => {
      const bonusText = item.bonus > 0 ? ` (+${item.bonus} Bonificación)` : '';
      message += `- ${item.productName} (Cant: ${item.quantity}${bonusText}) Total: ${formatCurrency(item.total)}\n`;
    });
    message += `\nSubtotal: ${formatCurrency(order.subtotal)}`;
    if (order.discountAmount > 0) {
      message += `\nDescuento: ${formatCurrency(-order.discountAmount)}`;
    }
    message += `\nTotal Final: ${formatCurrency(order.grandTotal)}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const returnInfo = previousView === 'reports'
    ? { text: 'Volver a Reportes', action: () => onNavigate('reports'), icon: <ArrowLeft className="mr-2" /> }
    : { text: 'Hacer Otro Pedido', action: () => onNavigate('orderForm'), icon: <Plus className="mr-2" /> };

  return (
    <>
      <style>{`
        .print-only {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-summary, #printable-summary * {
            visibility: visible;
          }
          #printable-summary {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            border: none;
            box-shadow: none;
            font-size: 12px;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-table {
            display: block !important;
          }
          .no-print-table {
            display: none !important;
          }
        }
      `}</style>
      
      <div id="printable-summary" className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-xl max-w-4xl mx-auto my-10">
        <div className="print-only text-center mb-8 border-b-2 border-gray-400 pb-4">
            <img 
              src={getLogoSrc(order.laboratory)}
              alt="Logo del Laboratorio" 
              style={{ width: '150px', margin: '0 auto 1rem' }} 
            />
             <h1 className="text-3xl font-bold">Resumen de Pedido</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-200 pb-4 mb-6">
            <div className='no-print'>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Resumen de Pedido</h2>
                <p className="text-sm text-gray-500 mt-1">ID Pedido: <span className="font-mono">{String(order.id).slice(0, 8)}</span></p>
            </div>
            <div className="text-left sm:text-right mt-2 sm:mt-0">
                <span className="text-sm text-gray-500">Fecha del pedido</span>
                <p className="font-semibold text-gray-700">{new Date(order.date).toLocaleDateString()}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm mb-8">
            <div><strong className="text-gray-600 block">Cliente:</strong> <span className="text-gray-800">{order.client || 'N/A'}</span></div>
            <div><strong className="text-gray-600 block">Representante:</strong> <span className="text-gray-800">{order.representative || 'N/A'}</span></div>
            <div><strong className="text-gray-600 block">Distribuidor:</strong> <span className="text-gray-800">{order.distributor || 'N/A'}</span></div>
            <div><strong className="text-gray-600 block">Laboratorio:</strong> <span className="text-gray-800">{order.laboratory || 'N/A'}</span></div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 no-print">Productos</h3>
            
            <div className="hidden md:block print-table">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left font-bold uppercase p-2">Producto</th>
                      <th className="text-center font-bold uppercase p-2">Cant.</th>
                      <th className="text-center font-bold uppercase p-2">Bonif.</th>
                      <th className="text-right font-bold uppercase p-2">P. Unit.</th>
                      <th className="text-right font-bold uppercase p-2">Desc.</th>
                      <th className="text-right font-bold uppercase p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="p-2 font-medium">{item.productName}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-center">{item.bonus || 0}</td>
                        <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="p-2 text-right">{(parseFloat(item.discount) * 100).toFixed(0)}%</td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>

            <div className="block md:hidden no-print-table space-y-3">
                {order.items.map((item, index) => (<ItemCard key={index} item={item} />))}
            </div>
        </div>

        <div className="flex flex-col items-end mt-8 pt-6 border-t border-gray-200">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span>{formatCurrency(order.subtotal)}</span></div>
                {order.discountAmount > 0 && (<div className="flex justify-between text-red-600"><span>Descuento Aplicado:</span><span>{formatCurrency(-order.discountAmount)}</span></div>)}
                <div className="flex justify-between text-gray-800 text-2xl font-bold pt-2 border-t mt-2"><span>Total:</span><span>{formatCurrency(order.grandTotal)}</span></div>
            </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 no-print">
          <button onClick={returnInfo.action} className="px-6 py-2 border rounded-md hover:bg-gray-100 flex items-center justify-center transition-colors">
            {returnInfo.icon} {returnInfo.text}
          </button>
          <button onClick={handleShareWhatsApp} className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center gap-2 transition-colors">
            <Share2 size={20} /> Compartir
          </button>
          <button onClick={handlePrint} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors">
            <Printer size={20} /> Imprimir
          </button>
        </div>
      </div>
    </>
  );
}

