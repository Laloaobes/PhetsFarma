import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Search, FlaskConical, User, Truck, DollarSign, Hash, Calendar as CalendarIcon } from 'lucide-react';

// --- Sub-componentes de UI para mayor claridad ---

// Tarjeta para métricas de resumen
const SummaryCard = ({ icon, title, value, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4 border-l-4" style={{ borderColor: color }}>
    <div className="p-3 rounded-full flex-shrink-0" style={{ backgroundColor: `${color}1A` }}>
      {React.cloneElement(icon, { style: { color } })}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// Contenedor para cada campo de filtro
const FilterInput = ({ icon, label, children }) => (
    <div>
        <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
        <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            {icon}
            {children}
        </div>
    </div>
);

// Tarjeta individual para mostrar un pedido en la vista móvil
const ReportCard = ({ order, onNavigate, searchTerm, formatCurrency }) => (
    <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500 space-y-3">
        {/* MODIFICACIÓN: Se ajusta flexbox para un mejor manejo del espacio en móviles */}
        <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-bold text-gray-800 text-lg break-words">{order.client}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-bold text-lg text-blue-600">{formatCurrency(order.grandTotal)}</p>
            </div>
        </div>
        <div className="text-xs text-gray-500 border-t pt-2">
            <p><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString()}</p>
            <p><strong>Vendedor:</strong> {order.representativeName || order.representative || 'N/A'}</p>
        </div>
        {searchTerm && order.items.some(item => item.productName && item.productName.toLowerCase().includes(searchTerm.toLowerCase())) && (
            <div className="border-t pt-2">
                <p className="text-xs font-semibold text-gray-600 mb-1">Productos Coincidentes:</p>
                <div className="flex flex-wrap gap-1">
                    {order.items
                        .filter(item => item.productName && item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((item, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                {item.productName}
                            </span>
                        ))}
                </div>
            </div>
        )}
        <div className="text-right">
             <button onClick={() => onNavigate('orderSummary', order)} className="font-bold text-sm text-blue-600 hover:text-blue-800 transition-colors">
                Ver Detalles
            </button>
        </div>
    </div>
);


// --- Componente Principal ---

export default function ReportsView({ orders, onNavigate, sellers, distributors, laboratories, user }) {
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterSeller, setFilterSeller] = useState(user?.role === 'Vendedor' ? user.id : '');
  const [filterDistributor, setFilterDistributor] = useState('');
  const [filterLaboratory, setFilterLaboratory] = useState(user?.role === 'Gerente de laboratorio' ? user.laboratory : '');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const sortedSellers = [...sellers].sort((a, b) => a.name.localeCompare(b.name));
  const sortedDistributors = [...distributors].sort((a, b) => a.name.localeCompare(b.name));
  const sortedLaboratories = [...laboratories].sort((a, b) => a.name.localeCompare(b.name));

  const formatCurrency = (total) => {
    if (isNaN(total) || total === null) return "$0.00";
    return total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  };

  useEffect(() => {
    let tempOrders = [...orders];
    // Lógica de filtrado (sin cambios)
    if (user) {
      if (user.role === 'Gerente de laboratorio' && user.laboratory) {
        tempOrders = tempOrders.filter(order => order.laboratory === user.laboratory);
      } else if (user.role === 'Vendedor') {
        tempOrders = tempOrders.filter(order => order.representativeId === user.id);
      }
    }
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      tempOrders = tempOrders.filter(order =>
        (order.client && order.client.toLowerCase().includes(lowerCaseSearch)) ||
        ((order.representativeName || order.representative || '').toLowerCase().includes(lowerCaseSearch)) ||
        (order.distributor && order.distributor.toLowerCase().includes(lowerCaseSearch)) ||
        (order.laboratory && order.laboratory.toLowerCase().includes(lowerCaseSearch)) ||
        (Array.isArray(order.items) && order.items.some(item => item.productName && item.productName.toLowerCase().includes(lowerCaseSearch)))
      );
    }
    if (filterSeller) { tempOrders = tempOrders.filter(order => order.representativeId === filterSeller); }
    if (filterDistributor) { tempOrders = tempOrders.filter(order => order.distributor === filterDistributor); }
    if (filterLaboratory) { tempOrders = tempOrders.filter(order => order.laboratory === filterLaboratory); }
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
    tempOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredOrders(tempOrders);
  }, [orders, searchTerm, filterSeller, filterDistributor, filterLaboratory, startDate, endDate, user]);

  const summaryData = useMemo(() => {
    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
    const totalOrders = filteredOrders.length;
    return { totalSales, totalOrders };
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-3 text-blue-600" /> Reportes de Pedidos
        </h2>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Resumen General</h3>
          <p className="text-sm text-gray-500 mb-6">Métricas clave basadas en los filtros aplicados actualmente.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SummaryCard icon={<DollarSign />} title="Ventas Totales (Filtro)" value={formatCurrency(summaryData.totalSales)} color="#2563EB" />
            <SummaryCard icon={<Hash />} title="Pedidos Totales (Filtro)" value={summaryData.totalOrders} color="#16A34A" />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
            <div className="pb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Filtros Avanzados</h3>
                <div className="space-y-4">
                    <FilterInput label="Búsqueda General" icon={<Search className="text-gray-500 mr-3" />}>
                        <input type="text" placeholder="Buscar por cliente, vendedor, producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent focus-outline-none text-sm"/>
                    </FilterInput>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {user && user.role !== 'Vendedor' && (
                            <FilterInput label="Vendedor" icon={<User className="text-gray-500 mr-3 flex-shrink-0" />}>
                                <select value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm">
                                    <option value="">Todos los Vendedores</option>
                                    {sortedSellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </FilterInput>
                        )}
                        <FilterInput label="Distribuidor" icon={<Truck className="text-gray-500 mr-3 flex-shrink-0" />}>
                            <select value={filterDistributor} onChange={(e) => setFilterDistributor(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm">
                                <option value="">Todos los Distribuidores</option>
                                {sortedDistributors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                        </FilterInput>
                        {user && user.role !== 'Gerente de laboratorio' && (
                            <FilterInput label="Laboratorio" icon={<FlaskConical className="text-gray-500 mr-3 flex-shrink-0" />}>
                                <select value={filterLaboratory} onChange={(e) => setFilterLaboratory(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm">
                                    <option value="">Todos los Laboratorios</option>
                                    {sortedLaboratories.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                </select>
                            </FilterInput>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FilterInput label="Fecha de Inicio" icon={<CalendarIcon className="text-gray-500 mr-3 flex-shrink-0" size={18}/>}>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-transparent focus:outline-none text-gray-500 text-sm"/>
                        </FilterInput>
                         <FilterInput label="Fecha de Fin" icon={<CalendarIcon className="text-gray-500 mr-3 flex-shrink-0" size={18}/>}>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-transparent focus:outline-none text-gray-500 text-sm"/>
                        </FilterInput>
                    </div>
                </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-4">Detalle de Pedidos</h3>
            
            {/* --- VISTA DE TABLA PARA DESKTOP --- */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-100">
                        <tr className="border-b-2 border-slate-200">
                            <th className="p-3 font-semibold text-slate-600 text-left">Fecha</th>
                            <th className="p-3 font-semibold text-slate-600 text-left">Cliente</th>
                            <th className="p-3 font-semibold text-slate-600 text-left">Vendedor</th>
                            <th className="p-3 font-semibold text-slate-600 text-left">Productos Coincidentes</th>
                            <th className="p-3 font-semibold text-slate-600 text-right">Total</th>
                            <th className="p-3 font-semibold text-slate-600 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                    {filteredOrders.map((order, index) => (
                        <tr key={order.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}>
                            <td className="p-3 text-slate-700">{new Date(order.date).toLocaleDateString()}</td>
                            <td className="p-3 font-medium text-slate-900">{order.client}</td>
                            <td className="p-3 text-slate-700">{order.representativeName || order.representative || 'N/A'}</td>
                            <td className="p-3 text-slate-700 align-top">
                              {searchTerm &&
                                order.items
                                  .filter(item => item.productName && item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
                                  .map((item, idx) => (
                                    <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full mb-1">
                                      {item.productName}
                                    </span>
                                  ))}
                            </td>
                            <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(order.grandTotal)}</td>
                            <td className="p-3 text-center">
                                <button onClick={() => onNavigate('orderSummary', order)} className="font-medium text-blue-600 hover:text-blue-800">
                                    Ver Detalles
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* --- VISTA DE TARJETAS PARA MÓVIL Y TABLET --- */}
            <div className="block lg:hidden space-y-4">
                {filteredOrders.map((order) => (
                    <ReportCard 
                        key={order.id}
                        order={order}
                        onNavigate={onNavigate}
                        searchTerm={searchTerm}
                        formatCurrency={formatCurrency}
                    />
                ))}
            </div>

            {filteredOrders.length === 0 && (
            <div className="text-center text-gray-500 mt-6 py-10 border-t border-gray-200">
                <p>No se encontraron pedidos con los filtros aplicados.</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}

