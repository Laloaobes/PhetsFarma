import React, { useState } from 'react';
import { FileText, Search, Printer } from 'lucide-react';

export default function Reports({ orders, onNavigate, sellers, distributors, laboratories, products }) {
  const [filters, setFilters] = useState({
    seller: '',
    distributor: '',
    laboratory: '',
    product: '',
    date: '', // Agregamos el filtro de fecha aquí
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const allProductsList = Object.values(products).flat();

  const getFilteredOrders = () => {
    let filtered = orders;

    if (filters.seller) {
      filtered = filtered.filter(order => order.seller === filters.seller);
    }
    if (filters.distributor) {
      filtered = filtered.filter(order => order.distributor === filters.distributor);
    }
    if (filters.laboratory) {
      filtered = filtered.filter(order => order.laboratory === filters.laboratory);
    }
    if (filters.product) {
      filtered = filtered.filter(order =>
        order.items.some(item => item.productName === filters.product)
      );
    }
    if (filters.date) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date).toISOString().split('T')[0];
        return orderDate === filters.date;
      });
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();
  const totalSales = filteredOrders.reduce((sum, order) => sum + parseFloat(order.grandTotal), 0);
  const totalOrders = filteredOrders.length;

  return (
    <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FileText className="mr-3 text-blue-500" /> Reportes de Pedidos
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
          <select name="seller" value={filters.seller} onChange={handleFilterChange} className="w-full bg-transparent focus:outline-none">
            <option value="">Filtrar Vendedor</option>
            {sellers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
          <select name="distributor" value={filters.distributor} onChange={handleFilterChange} className="w-full bg-transparent focus:outline-none">
            <option value="">Filtrar Distribuidor</option>
            {distributors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
          <select name="laboratory" value={filters.laboratory} onChange={handleFilterChange} className="w-full bg-transparent focus:outline-none">
            <option value="">Filtrar Laboratorio</option>
            {laboratories.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
          <select name="product" value={filters.product} onChange={handleFilterChange} className="w-full bg-transparent focus:outline-none">
            <option value="">Filtrar Producto</option>
            {allProductsList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="w-full bg-transparent focus:outline-none"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-green-800">Ventas Totales (Filtradas)</h3>
          <p className="text-3xl font-bold text-green-900">${totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-blue-800">Pedidos Totales (Filtrados)</h3>
          <p className="text-3xl font-bold text-blue-900">{totalOrders}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ID Pedido</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Vendedor</th>
              <th className="p-3">Total</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.slice().reverse().map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-600 font-mono">{order.id}</td>
                  <td className="p-3">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="p-3">{order.client}</td>
                  <td className="p-3">{order.seller || 'N/A'}</td>
                  <td className="p-3 font-semibold">${order.grandTotal.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => onNavigate('orderSummary', order)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver Resumen</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-500">No se encontraron pedidos con estos filtros.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}