  import React, { useState, useEffect } from 'react';
  import { FileText, Search, FlaskConical, User, Truck } from 'lucide-react';

  export default function ReportsView({ orders, onNavigate, sellers, distributors, laboratories, products, user }) {
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeller, setFilterSeller] = useState(user && user.role === 'Representante/Promotor' ? user.name : '');
    const [filterDistributor, setFilterDistributor] = useState(user && user.role === 'Representante Distribuidor' ? user.name : '');
    const [filterLaboratory, setFilterLaboratory] = useState(user && user.role === 'Gerente de laboratorio' ? user.laboratory : '');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
      let tempOrders = [...orders];

      // Aplicar filtros por rol
      if (user) {
        if (user.role === 'Gerente de laboratorio' && user.laboratory) {
          tempOrders = tempOrders.filter(order => order.laboratory === user.laboratory);
        }
        if (user.role === 'Representante/Promotor' && user.name) {
          tempOrders = tempOrders.filter(order => order.seller === user.name);
        }
        if (user.role === 'Representante Distribuidor' && user.name) {
          tempOrders = tempOrders.filter(order => order.distributor === user.name);
        }
      }

      // Aplicar filtros de búsqueda y selección
      if (searchTerm) {
        tempOrders = tempOrders.filter(order =>
          order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.distributor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.laboratory.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      if (filterSeller) {
        tempOrders = tempOrders.filter(order => order.seller === filterSeller);
      }
      if (filterDistributor) {
        tempOrders = tempOrders.filter(order => order.distributor === filterDistributor);
      }
      if (filterLaboratory) {
        tempOrders = tempOrders.filter(order => order.laboratory === filterLaboratory);
      }

      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        tempOrders = tempOrders.filter(order => new Date(order.date).setHours(0, 0, 0, 0) >= start);
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        tempOrders = tempOrders.filter(order => new Date(order.date).setHours(0, 0, 0, 0) <= end);
      }

      setFilteredOrders(tempOrders);
    }, [orders, searchTerm, filterSeller, filterDistributor, filterLaboratory, startDate, endDate, user]);

    return (
      <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <FileText className="mr-3 text-blue-500" /> Reportes de Pedidos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            <Search className="text-gray-500 mr-3" />
            <input
              type="text"
              placeholder="Buscar por cliente, producto, etc."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent focus:outline-none"
            />
          </div>

          {/* Filtrar por Representante/Promotor (deshabilitado si el rol es Representante/Promotor) */}
          {user && !['Representante/Promotor'].includes(user.role) && (
            <div className="flex items-center bg-gray-100 p-3 rounded-lg">
              <User className="text-gray-500 mr-3" />
              <select
                value={filterSeller}
                onChange={(e) => setFilterSeller(e.target.value)}
                className="w-full bg-transparent focus:outline-none"
              >
                <option value="">Filtrar Representante/Promotor</option>
                {sellers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}
          {/* Mostrar el nombre del representante si el rol es Representante/Promotor */}
          {user && user.role === 'Representante/Promotor' && (
            <div className="flex items-center bg-gray-100 p-3 rounded-lg">
              <User className="text-gray-500 mr-3" />
              <span className="w-full text-gray-700">{user.name}</span>
            </div>
          )}


          {/* Filtrar por Distribuidor (deshabilitado si el rol es Representante Distribuidor) */}
          {user && !['Representante Distribuidor'].includes(user.role) && (
            <div className="flex items-center bg-gray-100 p-3 rounded-lg">
              <Truck className="text-gray-500 mr-3" />
              <select
                value={filterDistributor}
                onChange={(e) => setFilterDistributor(e.target.value)}
                className="w-full bg-transparent focus:outline-none"
              >
                <option value="">Filtrar Distribuidor</option>
                {distributors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
          )}
          {/* Mostrar el nombre del distribuidor si el rol es Representante Distribuidor */}
          {user && user.role === 'Representante Distribuidor' && (
            <div className="flex items-center bg-gray-100 p-3 rounded-lg">
              <Truck className="text-gray-500 mr-3" />
              <span className="w-full text-gray-700">{user.name}</span>
            </div>
          )}

          {/* Filtrar por Laboratorio (deshabilitado si el rol es Gerente de laboratorio) */}
          {user && !['Gerente de laboratorio'].includes(user.role) && (
            <div className="flex items-center bg-gray-100 p-3 rounded-lg">
              <FlaskConical className="text-gray-500 mr-3" />
              <select
                value={filterLaboratory}
                onChange={(e) => setFilterLaboratory(e.target.value)}
                className="w-full bg-transparent focus:outline-none"
              >
                <option value="">Filtrar Laboratorio</option>
                {laboratories.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
          )}
          {/* Mostrar el laboratorio si el rol es Gerente de laboratorio */}
          {user && user.role === 'Gerente de laboratorio' && (
            <div className="flex items-center bg-gray-100 p-3 rounded-lg">
              <FlaskConical className="text-gray-500 mr-3" />
              <span className="w-full text-gray-700">{user.laboratory}</span>
            </div>
          )}

          <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-gray-700"
              aria-label="Fecha de inicio"
            />
          </div>
          <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-gray-700"
              aria-label="Fecha de fin"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">ID Pedido</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Representante/Promotor</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Distribuidor</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Laboratorio</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Total</th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{order.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{order.client}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{order.seller}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{order.distributor}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{order.laboratory}</td>
                  <td className="py-3 px-4 text-right text-sm text-gray-800">${order.grandTotal.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-sm text-gray-800">
                    <button
                      onClick={() => onNavigate('orderSummary', order)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Ver Resumen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <p className="text-center text-gray-500 mt-6">No se encontraron pedidos.</p>
        )}
      </div>
    );
  }
