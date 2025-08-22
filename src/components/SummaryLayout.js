import React from 'react';

export default function OrderSummary({ order, onNavigate, previousView, onPrint }) { // Asegúrate de recibir onPrint
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumen no disponible</h2>
        <p className="text-gray-600 mb-6">No se encontró información para este pedido.</p>
        <button
          onClick={() => onNavigate('reports')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Volver a Pedidos
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    if (onPrint) {
      onPrint(order);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-4xl mx-auto my-10 no-print">
      {/* ... (el resto de tu código para el resumen) ... */}

      {/* Botones de acción */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={() => onNavigate(previousView)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          {previousView === "orderForm" ? "Nuevo Pedido" : "Volver a Pedidos"}
        </button>
        <button
          onClick={handlePrint} // Llama a la nueva función
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V2zm0 6h10v7a2 2 0 01-2 2H7a2 2 0 01-2-2V8zm-1 2a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Imprimir Resumen
        </button>
      </div>
    </div>
  );
}
