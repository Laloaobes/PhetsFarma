import React, { useState, useEffect } from 'react'; 
import { FileText, Search, FlaskConical, User, Truck } from 'lucide-react';

export default function ReportsView({ orders, onNavigate, sellers, distributors, laboratories, user }) {
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeller, setFilterSeller] = useState(user?.role === 'Vendedor' ? user.name : '');
  const [filterDistributor, setFilterDistributor] = useState('');
  const [filterLaboratory, setFilterLaboratory] = useState(user?.role === 'Gerente de laboratorio' ? user.laboratory : '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    let tempOrders = [...orders];

    // Aplicar filtros por rol
    if (user) {
      if (user.role === 'Gerente de laboratorio' && user.laboratory) {
        tempOrders = tempOrders.filter(order => order.laboratory === user.laboratory);
      }
      if (user.role === 'Vendedor' && user.name) {
        tempOrders = tempOrders.filter(order => order.representative === user.name);
      }
    }

    // Aplicar filtros de búsqueda y selección
    if (searchTerm) {
      tempOrders = tempOrders.filter(order =>
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.representative && order.representative.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.distributor && order.distributor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.laboratory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterSeller) {
      tempOrders = tempOrders.filter(order => order.representative === filterSeller);
    }
    if (filterDistributor) {
      tempOrders = tempOrders.filter(order => order.distributor === filterDistributor);
    }
    if (filterLaboratory) {
      tempOrders = tempOrders.filter(order => order.laboratory === filterLaboratory);
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      tempOrders = tempOrders.filter(order => new Date(order.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      tempOrders = tempOrders.filter(order => new Date(order.date) <= end);
    }

    setFilteredOrders(tempOrders);
  }, [orders, searchTerm, filterSeller, filterDistributor, filterLaboratory, startDate, endDate, user]);

  return (
    <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FileText className="mr-3 text-blue-500" /> Reportes de Pedidos
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
          <Search className="text-gray-500 mr-3" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent focus:outline-none"
          />
        </div>

        {user && user.role !== 'Vendedor' && (
          <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            <User className="text-gray-500 mr-3" />
            <select value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)} className="w-full bg-transparent focus:outline-none">
              <option value="">Filtrar Vendedor</option>
              {sellers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
          <Truck className="text-gray-500 mr-3" />
          <select value={filterDistributor} onChange={(e) => setFilterDistributor(e.target.value)} className="w-full bg-transparent focus:outline-none">
            <option value="">Filtrar Distribuidor</option>
            {distributors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>

        {user && user.role !== 'Gerente de laboratorio' && (
          <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            <FlaskConical className="text-gray-500 mr-3" />
            <select value={filterLaboratory} onChange={(e) => setFilterLaboratory(e.target.value)} className="w-full bg-transparent focus:outline-none">
              <option value="">Filtrar Laboratorio</option>
              {laboratories.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
        )}
        
        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-transparent focus:outline-none text-gray-700"/>
        </div>
        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-transparent focus:outline-none text-gray-700"/>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-sm font-semibold text-gray-700">Fecha</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Cliente</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Vendedor</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Laboratorio</th>
              <th className="p-3 text-sm font-semibold text-gray-700 text-right">Total</th>
              <th className="p-3 text-sm font-semibold text-gray-700 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm">{new Date(order.date).toLocaleDateString()}</td>
                <td className="p-3 font-medium">{order.client}</td>
                <td className="p-3 text-sm">{order.representative}</td>
                <td className="p-3 text-sm">{order.laboratory}</td>
                <td className="p-3 text-sm text-right font-semibold">${order.grandTotal.toFixed(2)}</td>
                <td className="p-3 text-sm text-center">
                  <button onClick={() => onNavigate('orderSummary', order)} className="text-blue-600 hover:text-blue-800 font-medium">
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredOrders.length === 0 && (
        <p className="text-center text-gray-500 mt-6">No se encontraron pedidos con los filtros aplicados.</p>
      )}
    </div>
  );
}
