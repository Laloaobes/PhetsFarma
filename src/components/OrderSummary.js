import React, { useState, useRef } from 'react';
import { Printer, Share2, Plus, ArrowLeft, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Componente para el diseño del PDF (se renderiza oculto)
const PdfLayout = ({ order }) => {
  // Función para seleccionar el logo correcto basado en el laboratorio
  const getLogoSrc = (laboratory) => {
    switch (laboratory) {
      case 'Kiron':
        return '/Kiron.png';
      case 'Vets Pharma':
        return '/Vets.png';
      case 'Pets Pharma':
        return '/LogoPets-1-1.png';
      default:
        return '/grupogarvo.png'; // Logo por defecto
    }
  };

  return (
    <div id="pdf-content" className="p-8" style={{ width: '800px', color: '#333' }}>
      {/* --- ENCABEZADO CENTRADO CON LOGO DINÁMICO --- */}
      <div className="text-center mb-8 border-b-2 border-gray-400 pb-4">
        <img 
          src={getLogoSrc(order.laboratory)}
          alt="Logo del Laboratorio" 
          style={{ width: '150px', margin: '0 auto 1rem' }} 
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h1 className="text-3xl font-bold">Resumen de Pedido</h1>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 text-sm">
        <div><strong>Cliente:</strong> {order.client}</div>
        <div className="text-right"><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString()}</div>
        <div><strong>Vendedor:</strong> {order.representative}</div>
        <div className="text-right"><strong>ID Pedido:</strong> {String(order.id).slice(0, 8)}</div>
        <div><strong>Distribuidor:</strong> {order.distributor || 'N/A'}</div>
        <div className="text-right"><strong>Laboratorio:</strong> {order.laboratory}</div>
      </div>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="border-b-2 border-gray-400">
            <th className="text-left font-bold uppercase p-2">Producto</th>
            <th className="text-center font-bold uppercase p-2">Cant.</th>
            <th className="text-center font-bold uppercase p-2">Bonif.</th>
            <th className="text-center font-bold uppercase p-2">Desc. %</th>
            <th className="text-right font-bold uppercase p-2">P. Unit.</th>
            <th className="text-right font-bold uppercase p-2">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="p-2">{item.productName}</td>
              <td className="text-center p-2">{item.quantity}</td>
              <td className="text-center p-2">{item.bonus || 0}</td>
              <td className="text-center p-2">{(parseFloat(item.discount) * 100).toFixed(0)}%</td>
              <td className="text-right p-2">${parseFloat(item.price).toFixed(2)}</td>
              <td className="text-right p-2 font-semibold">${parseFloat(item.total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mt-8">
        <div className="w-2/5">
          <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-red-600">
              <span>Descuento:</span>
              <span>-${order.discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-2xl font-bold border-t-2 border-gray-400 pt-2 mt-2">
            <span>Total:</span>
            <span>${order.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 mt-12">
        <p>Gracias por su compra.</p>
      </div>
    </div>
  );
};

export default function OrderSummary({ order, onNavigate, previousView }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfContentRef = useRef();

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

  const generatePdf = async (action = 'print') => {
    if (!pdfContentRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(pdfContentRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      const pdfHeight = (pdfWidth - 20) / ratio;

      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);

      if (action === 'print') {
        pdf.autoPrint();
        window.open(pdf.output('bloburl'), '_blank');
      } else {
        pdf.save(`Pedido-${String(order.id).slice(0, 8)}.pdf`);
      }
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      setIsGenerating(false);
    }
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
      message += `- ${item.productName} (Cant: ${item.quantity}${bonusText}) Total: $${parseFloat(item.total).toFixed(2)}\n`;
    });
    message += `\nSubtotal: $${order.subtotal.toFixed(2)}`;
    message += `\nDescuento: -$${order.discountAmount.toFixed(2)}`;
    message += `\nTotal Final: $${order.grandTotal.toFixed(2)}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const returnInfo = previousView === 'reports'
    ? { text: 'Volver a Reportes', action: () => onNavigate('reports'), icon: <ArrowLeft className="mr-2" /> }
    : { text: 'Hacer Otro Pedido', action: () => onNavigate('orderForm'), icon: <Plus className="mr-2" /> };

  return (
    <>
      {/* Contenedor oculto para renderizar el PDF */}
      <div className="absolute top-0 left-0" style={{ zIndex: -1, opacity: 0 }}>
        <div ref={pdfContentRef}>
          <PdfLayout order={order} />
        </div>
      </div>

      {/* Contenedor visible para el usuario */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-4xl mx-auto my-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen de Pedido</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 mb-6 text-sm text-gray-600">
            <div><strong>Cliente:</strong> {order.client || 'N/A'}</div>
            <div><strong>Representante:</strong> {order.representative || 'N/A'}</div>
            <div><strong>Distribuidor:</strong> {order.distributor || 'N/A'}</div>
            <div><strong>Laboratorio:</strong> {order.laboratory || 'N/A'}</div>
            <div><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString()}</div>
            <div><strong>ID Pedido:</strong> {String(order.id).slice(0, 8)}</div>
        </div>

        <div className="border-t border-b border-gray-200 py-4 my-4">
          <div className="grid grid-cols-12 gap-x-4 font-semibold text-gray-700 mb-2 px-2 py-1 text-xs uppercase">
            <div className="col-span-4">Producto</div>
            <div className="text-center">Cant.</div>
            <div className="text-center">Bonif.</div>
            <div className="text-right">P. Unit.</div>
            <div className="text-right">Desc. (%)</div>
            <div className="col-span-4 text-right">Total</div>
          </div>
          {order.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-x-4 py-2 text-gray-600 px-2 border-b last:border-b-0 text-sm">
              <div className="col-span-4 font-medium">{item.productName}</div>
              <div className="text-center">{item.quantity}</div>
              <div className="text-center">{item.bonus || 0}</div>
              <div className="text-right">${parseFloat(item.price).toFixed(2)}</div>
              <div className="text-right">{(parseFloat(item.discount) * 100).toFixed(0)}%</div>
              <div className="col-span-4 text-right font-semibold">${parseFloat(item.total).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-end mt-6 space-y-1">
            <div className="flex justify-between w-full max-w-xs text-gray-600">
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between w-full max-w-xs text-red-600">
                  <span>Descuento Aplicado:</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-full max-w-xs text-gray-800 text-2xl font-bold border-t pt-2 mt-2">
                <span>Total:</span>
                <span>${order.grandTotal.toFixed(2)}</span>
            </div>
        </div>

        <div className="flex flex-wrap justify-end gap-4 mt-8">
          <button onClick={returnInfo.action} className="px-6 py-2 border rounded-md hover:bg-gray-100 flex items-center">
            {returnInfo.icon} {returnInfo.text}
          </button>
          <button onClick={handleShareWhatsApp} disabled={isGenerating} className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2 disabled:bg-green-300">
            <Share2 size={20} /> Compartir
          </button>
          <button onClick={() => generatePdf('print')} disabled={isGenerating} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 disabled:bg-indigo-400">
            <Printer size={20} /> {isGenerating ? 'Imprimiendo...' : 'Imprimir'}
          </button>
        </div>
      </div>
    </>
  );
}