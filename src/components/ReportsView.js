import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    FileText, 
    Search, 
    FlaskConical, 
    User, 
    Truck, 
    DollarSign, 
    Hash, 
    Calendar as CalendarIcon, 
    Printer, 
    Trash2,
    Loader2 
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, startAfter, getDocs } from "firebase/firestore";

// --- Sub-componente: Tarjeta de Resumen ---
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

// --- Sub-componente: Input de Filtro ---
const FilterInput = ({ icon, label, children }) => (
    <div>
      <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="flex items-center bg-gray-100 p-3 rounded-lg">
        {icon}
        {children}
      </div>
    </div>
);

// --- Sub-componente: Tarjeta de Reporte para Móvil ---
const ReportCard = ({ order, onNavigate, searchTerm, formatCurrency, onDeleteOrder, canDelete }) => (
    <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500 space-y-3">
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
            <p><strong>Vendedor:</strong> {order.representative || 'N/A'}</p>
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
        <div className="flex justify-end items-center gap-2 pt-2 border-t mt-2">
            {canDelete && (
                <button 
                    onClick={() => {
                        if (window.confirm(`¿Estás seguro de que deseas eliminar el pedido para "${order.client}"?`)) {
                            onDeleteOrder(order.id);
                        }
                    }} 
                    title="Eliminar pedido"
                    className="p-2 text-red-600 hover:text-red-800 transition-colors rounded-full hover:bg-red-100"
                >
                    <Trash2 size={16} />
                </button>
            )}
            <button onClick={() => onNavigate('orderSummary', order)} className="font-bold text-sm text-blue-600 hover:text-blue-800 transition-colors px-3 py-1">
                Ver Detalles
            </button>
        </div>
    </div>
);

// --- Componente para el formato de impresión ---
const PrintableReport = ({ orders, formatCurrency, summaryData, dateRange, user }) => {
    // ... (Este componente no cambia, se mantiene como lo tenías)
    return (
        <div id="printable-report" className="print-only">
            {/* ... Tu JSX para el reporte impreso ... */}
        </div>
    );
};


// --- Componente Principal ---
export default function ReportsView({ onNavigate, users, distributors, laboratories, user, onDeleteOrder, representatives }) {
  const [orders, setOrders] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeller, setFilterSeller] = useState(user?.role === 'Vendedor' ? user.name : '');
  const [filterDistributor, setFilterDistributor] = useState('');
  const [filterLaboratory, setFilterLaboratory] = useState(user?.role === 'Gerente de laboratorio' ? user.laboratory : '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const ORDERS_PER_PAGE = 25;

  const fetchOrders = useCallback(async (isInitialLoad = false) => {
    if (!hasMore && !isInitialLoad) return;
    
    if (isInitialLoad) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      let q = query(collection(db, "orders"), orderBy("date", "desc"), limit(ORDERS_PER_PAGE));
      if (!isInitialLoad && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }
      const docSnapshots = await getDocs(q);
      const newOrders = docSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date?.toDate() || new Date() }));
      setOrders(prevOrders => isInitialLoad ? newOrders : [...prevOrders, ...newOrders]);
      const lastDoc = docSnapshots.docs[docSnapshots.docs.length - 1];
      setLastVisible(lastDoc);
      if (docSnapshots.docs.length < ORDERS_PER_PAGE) setHasMore(false);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [lastVisible, hasMore]);

  useEffect(() => {
    fetchOrders(true);
  }, []);

  useEffect(() => {
    let tempOrders = [...orders];
    
    if (user?.role === 'Gerente de laboratorio') tempOrders = tempOrders.filter(order => order.laboratory === user.laboratory);
    else if (user?.role === 'Vendedor') tempOrders = tempOrders.filter(order => order.representative === user.name);

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      tempOrders = tempOrders.filter(o =>
        o.client?.toLowerCase().includes(lower) ||
        o.representative?.toLowerCase().includes(lower) ||
        o.items?.some(item => item.productName?.toLowerCase().includes(lower))
      );
    }
    
    if (filterSeller) tempOrders = tempOrders.filter(o => o.representative === filterSeller);
    if (filterDistributor) tempOrders = tempOrders.filter(o => o.distributor === filterDistributor);
    if (filterLaboratory) tempOrders = tempOrders.filter(o => o.laboratory === filterLaboratory);
    if (startDate) tempOrders = tempOrders.filter(o => new Date(o.date) >= new Date(startDate));
    if (endDate) tempOrders = tempOrders.filter(o => new Date(o.date) <= new Date(endDate).setHours(23,59,59,999));

    setFilteredOrders(tempOrders);
  }, [orders, searchTerm, filterSeller, filterDistributor, filterLaboratory, startDate, endDate, user]);

  const summaryData = useMemo(() => ({
    totalSales: filteredOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0),
    totalOrders: filteredOrders.length,
  }), [filteredOrders]);

  const canDelete = user && ['Super Admin', 'Admin'].includes(user.role);
  const formatCurrency = (total) => total?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) || '$0.00';
  const handlePrintReport = () => { if (filteredOrders.length > 0) window.print(); else alert("No hay datos para imprimir."); };
  
  const sortedSellers = useMemo(() => [...representatives].sort((a, b) => a.name.localeCompare(b.name)), [representatives]);
  const sortedDistributors = useMemo(() => [...distributors].sort((a, b) => a.name.localeCompare(b.name)), [distributors]);
  const sortedLaboratories = useMemo(() => [...laboratories].sort((a, b) => a.name.localeCompare(b.name)), [laboratories]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center"><Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" /><p className="mt-4 text-lg text-gray-600">Cargando reportes...</p></div>
      </div>
    );
  }

  return (
    <>
      <style>{`@media screen {.print-only {display: none;}} @media print {body, html {background: white !important;} .no-print {display: none !important;} .print-only {display: block; position: absolute; top: 0; left: 0; width: 100%; padding: 20px;}}`}</style>
      <div className="space-y-6 no-print">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center"><FileText className="mr-3 text-blue-600" /> Reportes de Pedidos</h2>
          <button onClick={handlePrintReport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
            <Printer size={18} /> Imprimir Reporte
          </button>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Resumen General (Datos Cargados)</h3>
            <p className="text-sm text-gray-500 mb-6">Métricas clave basadas en los pedidos mostrados y filtros aplicados.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SummaryCard icon={<DollarSign />} title="Ventas Totales" value={formatCurrency(summaryData.totalSales)} color="#2563EB" />
              <SummaryCard icon={<Hash />} title="Pedidos Totales" value={summaryData.totalOrders} color="#16A34A" />
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <div className="pb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Filtros Avanzados</h3>
              <div className="space-y-4">
                <FilterInput label="Búsqueda General" icon={<Search className="text-gray-500 mr-3" />}>
                  <input type="text" placeholder="Buscar por cliente, vendedor, producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm"/>
                </FilterInput>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {user?.role !== 'Vendedor' && (
                    <FilterInput label="Vendedor" icon={<User className="text-gray-500 mr-3 flex-shrink-0" />}>
                      <select value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm">
                        <option value="">Todos los Vendedores</option>
                        {sortedSellers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </FilterInput>
                  )}
                  <FilterInput label="Distribuidor" icon={<Truck className="text-gray-500 mr-3 flex-shrink-0" />}>
                    <select value={filterDistributor} onChange={(e) => setFilterDistributor(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm">
                      <option value="">Todos los Distribuidores</option>
                      {sortedDistributors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </FilterInput>
                  {user?.role !== 'Gerente de laboratorio' && (
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
            
            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-4">Detalle de Pedidos ({filteredOrders.length} cargados)</h3>
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-slate-100">
                  <tr className="border-b-2 border-slate-200">
                    <th className="p-3 font-semibold text-slate-600 text-left">Fecha</th>
                    <th className="p-3 font-semibold text-slate-600 text-left">Cliente</th>
                    <th className="p-3 font-semibold text-slate-600 text-left">Vendedor</th>
                    <th className="p-3 font-semibold text-slate-600 text-left">Productos</th>
                    <th className="p-3 font-semibold text-slate-600 text-right">Total</th>
                    <th className="p-3 font-semibold text-slate-600 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={order.id} className={`border-b border-slate-200 hover:bg-blue-50`}>
                      <td className="p-3 text-slate-700">{new Date(order.date).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-slate-900">{order.client}</td>
                      <td className="p-3 text-slate-700">{order.representative || 'N/A'}</td>
                      <td className="p-3 text-slate-700 align-top">{searchTerm && order.items.filter(i => i.productName?.toLowerCase().includes(searchTerm.toLowerCase())).map(i => (<span key={i.sku} className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full mb-1">{i.productName}</span>))}</td>
                      <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(order.grandTotal)}</td>
                      <td className="p-3 text-center"><div className="flex justify-center items-center gap-2"><button onClick={() => onNavigate('orderSummary', order)} className="font-medium text-blue-600 hover:text-blue-800">Ver Detalles</button>{canDelete && (<button onClick={() => {if (window.confirm(`¿Seguro?`)) {onDeleteOrder(order.id);}}} title="Eliminar" className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="block lg:hidden space-y-4">
              {filteredOrders.map((order) => (<ReportCard key={order.id} {...{order, onNavigate, searchTerm, formatCurrency, onDeleteOrder, canDelete}} />))}
            </div>
            
            {hasMore && (<div className="text-center mt-8"><button onClick={() => fetchOrders(false)} disabled={isLoadingMore} className="inline-flex items-center gap-2 px-6 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 disabled:bg-slate-400">{isLoadingMore ? <><Loader2 className="animate-spin" size={18} /> Cargando...</> : 'Cargar más pedidos'}</button></div>)}
            {!hasMore && orders.length > 0 && (<div className="text-center text-gray-500 mt-8 py-4 border-t"><p>Has llegado al final de la lista.</p></div>)}
            {filteredOrders.length === 0 && !hasMore && (<div className="text-center text-gray-500 mt-6 py-10 border-t"><p>No se encontraron pedidos.</p></div>)}
          </div>
        </div>
      </div>
      <PrintableReport {...{orders: filteredOrders, formatCurrency, summaryData, dateRange: startDate && endDate ? `del ${new Date(startDate).toLocaleDateString()} al ${new Date(endDate).toLocaleDateString()}` : '', user}} />
    </>
  );
}