import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Search, FlaskConical, User, Truck, DollarSign, Hash, Calendar as CalendarIcon, Printer, Trash2 } from 'lucide-react';

// --- Sub-componentes de UI ---

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

const FilterInput = ({ icon, label, children }) => (
    <div>
      <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
      <div className="flex items-center bg-gray-100 p-3 rounded-lg">
        {icon}
        {children}
      </div>
    </div>
);

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
    const salesByLab = useMemo(() => {
        return orders.reduce((acc, order) => {
            const lab = order.laboratory || 'Sin Laboratorio';
            if (!acc[lab]) {
                acc[lab] = { orders: [], total: 0 };
            }
            acc[lab].orders.push(order);
            acc[lab].total += (order.grandTotal || 0);
            return acc;
        }, {});
    }, [orders]);

    const styles = {
        page: { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#333' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0055a4', paddingBottom: '10px', marginBottom: '20px' },
        subHeader: { textAlign: 'right', fontSize: '11px' },
        sectionTitle: { fontSize: '16px', fontWeight: 'bold', marginTop: '25px', marginBottom: '15px', color: '#003366', borderBottom: '1px solid #ccc', paddingTop: '5px', paddingBottom: '5px' },
        table: { width: '100%', borderCollapse: 'collapse', fontSize: '10px' },
        th: { border: '1px solid #ddd', padding: '6px', textAlign: 'left', backgroundColor: '#f2f7ff', fontWeight: 'bold' },
        td: { border: '1px solid #ddd', padding: '6px' },
        textRight: { textAlign: 'right' },
        textCenter: { textAlign: 'center' },
        tfoot: { fontWeight: 'bold', backgroundColor: '#e6effc' },
        pageBreak: { marginTop: '30px', pageBreakBefore: 'always' },
        barChartContainer: { marginTop: '15px', marginBottom: '20px', spaceY: '8px' },
        barWrapper: { display: 'flex', alignItems: 'center', marginBottom: '8px' },
        barLabel: { width: '120px', flexShrink: 0, fontSize: '10px', paddingRight: '10px' },
        bar: { height: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '5px', fontSize: '10px', backgroundColor: '#2563EB', whiteSpace: 'nowrap', borderRadius: '0 3px 3px 0' },
        barBackground: { flexGrow: 1, backgroundColor: '#e0e0e0', borderRadius: '3px' },
    };

    const grandTotalForDistribution = summaryData.totalSales > 0 ? summaryData.totalSales : 1;
    const mainLogoUrl = 'https://firebasestorage.googleapis.com/v0/b/cotizador-75582.appspot.com/o/grupogarvo.png?alt=media&token=1e1026c2-1981-4357-ac88-46734e17f41d';

    return (
        <div id="printable-report" className="print-only" style={styles.page}>
            <div style={styles.header}>
                <div>
                    <img src={mainLogoUrl} alt="Logo Grupo Garvo" style={{ height: '40px', marginBottom: '10px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0055a4' }}>Reporte de Ventas</div>
                </div>
                <div style={styles.subHeader}>
                    <p><strong>Generado por:</strong> {user.name}</p>
                    <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-MX')}</p>
                    {dateRange && <p><strong>Periodo:</strong> {dateRange}</p>}
                </div>
            </div>

            <h2 style={styles.sectionTitle}>Resumen General</h2>
            <table style={styles.table}>
                <thead><tr><th style={styles.th}>Laboratorio</th><th style={{ ...styles.th, ...styles.textCenter }}>Nº Pedidos</th><th style={{ ...styles.th, ...styles.textRight }}>Total Ventas</th></tr></thead>
                <tbody>
                    {Object.entries(salesByLab).map(([lab, data]) => (<tr key={lab}><td style={styles.td}>{lab}</td><td style={{ ...styles.td, ...styles.textCenter }}>{data.orders.length}</td><td style={{ ...styles.td, ...styles.textRight }}>{formatCurrency(data.total)}</td></tr>))}
                </tbody>
                <tfoot style={styles.tfoot}><tr><td style={styles.td}>Total General</td><td style={{ ...styles.td, ...styles.textCenter }}>{summaryData.totalOrders}</td><td style={{ ...styles.td, ...styles.textRight }}>{formatCurrency(summaryData.totalSales)}</td></tr></tfoot>
            </table>
            
            <h3 style={{...styles.sectionTitle, marginTop: '20px'}}>Distribución de Ventas</h3>
            <div style={styles.barChartContainer}>
                {Object.entries(salesByLab).map(([lab, data]) => {
                    const percentage = (data.total / grandTotalForDistribution) * 100;
                    return (
                        <div key={lab} style={styles.barWrapper}>
                            <div style={styles.barLabel}>{lab}</div>
                            <div style={styles.barBackground}><div style={{...styles.bar, width: `${percentage}%`}}>{percentage.toFixed(1)}%</div></div>
                        </div>
                    );
                })}
            </div>

            {Object.entries(salesByLab).map(([lab, data]) => {
                const monthlySales = data.orders.reduce((acc, order) => {
                    const month = new Date(order.date).toLocaleString('es-MX', { year: 'numeric', month: 'long' });
                    acc[month] = (acc[month] || 0) + (order.grandTotal || 0);
                    return acc;
                }, {});
                const maxMonthlySale = Math.max(...Object.values(monthlySales), 1);

                return (
                    <div key={lab} style={styles.pageBreak}>
                        <h2 style={styles.sectionTitle}>Detalle de Ventas - {lab}</h2>
                        <p><strong>Total de Ventas del Laboratorio:</strong> {formatCurrency(data.total)}</p>

                        <h3 style={{...styles.sectionTitle, fontSize: '14px', marginTop: '20px'}}>Ventas Mensuales</h3>
                        <div style={styles.barChartContainer}>
                            {Object.entries(monthlySales).map(([month, total]) => {
                                const percentage = (total/maxMonthlySale) * 100;
                                return (
                                    <div key={month} style={styles.barWrapper}>
                                        <div style={styles.barLabel}>{month}</div>
                                        <div style={styles.barBackground}><div style={{...styles.bar, width: `${percentage}%`, backgroundColor: '#16A34A'}}>{formatCurrency(total)}</div></div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        <h3 style={{...styles.sectionTitle, fontSize: '14px', marginTop: '20px'}}>Desglose de Pedidos</h3>
                        <table style={styles.table}>
                            <thead><tr><th style={styles.th}>Fecha</th><th style={styles.th}>Cliente</th><th style={styles.th}>Vendedor</th><th style={{ ...styles.th, ...styles.textRight }}>Total</th></tr></thead>
                            <tbody>
                                {data.orders.sort((a,b) => new Date(b.date) - new Date(a.date)).map(order => (<tr key={order.id}><td style={styles.td}>{new Date(order.date).toLocaleDateString()}</td><td style={styles.td}>{order.client}</td><td style={styles.td}>{order.representative || 'N/A'}</td><td style={{ ...styles.td, ...styles.textRight }}>{formatCurrency(order.grandTotal)}</td></tr>))}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
};


// --- Componente Principal ---

export default function ReportsView({ orders, onNavigate, users, distributors, laboratories, user, onDeleteOrder, representatives }) {
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterSeller, setFilterSeller] = useState(user?.role === 'Vendedor' ? user.name : '');
  const [filterDistributor, setFilterDistributor] = useState('');
  const [filterLaboratory, setFilterLaboratory] = useState(user?.role === 'Gerente de laboratorio' ? user.laboratory : '');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const sortedSellers = useMemo(() => 
    [...representatives].sort((a, b) => a.name.localeCompare(b.name)),
  [representatives]);

  const sortedDistributors = [...distributors].sort((a, b) => a.name.localeCompare(b.name));
  const sortedLaboratories = [...laboratories].sort((a, b) => a.name.localeCompare(b.name));

  const canDelete = user && ['Super Admin', 'Admin'].includes(user.role);

  const formatCurrency = (total) => {
    if (isNaN(total) || total === null) return "$0.00";
    return total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  };

  useEffect(() => {
    let tempOrders = [...orders];
    
    if (user) {
      if (user.role === 'Gerente de laboratorio' && user.laboratory) {
        tempOrders = tempOrders.filter(order => order.laboratory === user.laboratory);
      } else if (user.role === 'Vendedor') {
        tempOrders = tempOrders.filter(order => order.representative === user.name);
      }
    }

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      tempOrders = tempOrders.filter(order =>
        (order.client && order.client.toLowerCase().includes(lowerCaseSearch)) ||
        ((order.representative || '').toLowerCase().includes(lowerCaseSearch)) ||
        (order.distributor && order.distributor.toLowerCase().includes(lowerCaseSearch)) ||
        (order.laboratory && order.laboratory.toLowerCase().includes(lowerCaseSearch)) ||
        (Array.isArray(order.items) && order.items.some(item => item.productName && item.productName.toLowerCase().includes(lowerCaseSearch)))
      );
    }

    if (filterSeller) { 
      tempOrders = tempOrders.filter(order => order.representative === filterSeller); 
    }
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
  }, [orders, searchTerm, filterSeller, filterDistributor, filterLaboratory, startDate, endDate, user, representatives]);

  const summaryData = useMemo(() => {
    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
    const totalOrders = filteredOrders.length;
    return { totalSales, totalOrders };
  }, [filteredOrders]);
  
  const handlePrintReport = () => {
    if (filteredOrders.length === 0) {
        alert("No hay datos para imprimir con los filtros actuales.");
        return;
    }
    window.print();
  };

  return (
    <>
      <style>{`
          @media screen {
              .print-only {
                  display: none;
              }
          }
          @media print {
              body, html {
                  background-color: white !important;
              }
              .no-print {
                  display: none !important;
              }
              .print-only {
                  display: block;
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  padding: 20px;
              }
          }
      `}</style>

      <div className="space-y-6 no-print">
          <div className="flex flex-wrap justify-between items-center gap-4">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center">
                  <FileText className="mr-3 text-blue-600" /> Reportes de Pedidos
              </h2>
              <button 
                  onClick={handlePrintReport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              >
                  <Printer size={18} />
                  Imprimir Reporte
              </button>
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
                              <input type="text" placeholder="Buscar por cliente, vendedor, producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm"/>
                          </FilterInput>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {user && user.role !== 'Vendedor' && (
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
                                  <td className="p-3 text-slate-700">{order.representative || 'N/A'}</td>
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
                                      <div className="flex justify-center items-center gap-2">
                                          <button onClick={() => onNavigate('orderSummary', order)} className="font-medium text-blue-600 hover:text-blue-800 px-2 py-1">
                                              Ver Detalles
                                          </button>
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
                                      </div>
                                  </td>
                              </tr>
                          ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="block lg:hidden space-y-4">
                      {filteredOrders.map((order) => (
                          <ReportCard 
                              key={order.id}
                              order={order}
                              onNavigate={onNavigate}
                              searchTerm={searchTerm}
                              formatCurrency={formatCurrency}
                              onDeleteOrder={onDeleteOrder}
                              canDelete={canDelete}
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
      <PrintableReport 
          orders={filteredOrders}
          formatCurrency={formatCurrency}
          summaryData={summaryData}
          dateRange={startDate && endDate ? `del ${new Date(startDate).toLocaleDateString('es-MX')} al ${new Date(endDate).toLocaleDateString('es-MX')}` : ''}
          user={user}
      />
    </>
  );
}