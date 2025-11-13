import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FileText, Search, FlaskConical, User, Truck, DollarSign, Hash,
    Calendar as CalendarIcon, Trash2, Loader2, Download, FileSpreadsheet,
    X
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, startAfter, getDocs, getAggregateFromServer, sum, count } from "firebase/firestore";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import toast, { Toaster } from 'react-hot-toast';

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
const ReportCard = ({ order, onNavigate, formatCurrency, onDeleteOrder, canDelete, isProductSearchActive }) => (
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
        <div className="text-xs text-gray-500 border-t pt-2 space-y-1">
            <p><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString()}</p>
            <p><strong>Vendedor:</strong> {order.representative || 'N/A'}</p>
        </div>
        {isProductSearchActive && order.matchedProducts && order.matchedProducts.length > 0 && (
            <div className="border-t pt-2">
                <p className="text-xs font-semibold text-gray-600 mb-1">Productos Coincidentes:</p>
                <div className="flex flex-wrap gap-1">
                    {order.matchedProducts.map((item, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {item.name} ({item.quantity} pz)
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

// --- Componente para definir el documento PDF ---
const ReportPDF = ({ orders, formatCurrency, summaryData, dateRange, user }) => {
    const styles = StyleSheet.create({
        page: { fontFamily: 'Helvetica', fontSize: 10, padding: 30, color: '#333' },
        header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '2px solid #ccc', paddingBottom: 10, marginBottom: 20, alignItems: 'flex-start' },
        headerInfo: { flexDirection: 'column' },
        title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
        subtitle: { fontSize: 9, color: '#555' },
        summary: { flexDirection: 'row', marginBottom: 25, backgroundColor: '#f9f9f9', border: '1px solid #eee', padding: 15 },
        summaryItem: { marginRight: 30 },
        summaryLabel: { fontSize: 10, color: '#666' },
        summaryValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
        table: { width: '100%', display: 'table', borderStyle: 'solid', borderWidth: 1, borderColor: '#ddd' },
        tableRow: { flexDirection: 'row', borderBottomColor: '#ddd', borderBottomWidth: 1, alignItems: 'center', minHeight: 24 },
        tableHeader: { backgroundColor: '#f2f2f2', fontFamily: 'Helvetica-Bold' },
        tableCol: { width: '25%', padding: 5 },
        colTextRight: { textAlign: 'right' }
    });
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerInfo}>
                        <Text style={styles.title}>Reporte de Pedidos</Text>
                        <Text style={styles.subtitle}>Generado por: {user?.name || 'N/A'}</Text>
                        {dateRange ? <Text style={styles.subtitle}>Periodo del Reporte: {dateRange}</Text> : null}
                    </View>
                    <Text style={styles.subtitle}>Fecha: {new Date().toLocaleDateString('es-MX')}</Text>
                </View>
                <View style={styles.summary}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Ventas Totales</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(summaryData.salesTotal)}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Pedidos Totales</Text>
                        <Text style={styles.summaryValue}>{summaryData.totalOrders.toLocaleString('es-MX')}</Text>
                    </View>
                </View>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={styles.tableCol}>Fecha</Text>
                        <Text style={styles.tableCol}>Cliente</Text>
                        <Text style={styles.tableCol}>Vendedor</Text>
                        <Text style={[styles.tableCol, styles.colTextRight]}>Total</Text>
                    </View>
                    {orders.map((order) => (
                        <View style={styles.tableRow} key={order.id} wrap={false}>
                            <Text style={styles.tableCol}>{new Date(order.date).toLocaleDateString('es-MX')}</Text>
                            <Text style={styles.tableCol}>{order.client}</Text>
                            <Text style={styles.tableCol}>{order.representative || 'N/A'}</Text>
                            <Text style={[styles.tableCol, styles.colTextRight]}>{formatCurrency(order.grandTotal)}</Text>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
};

// --- Custom Hook para Debounce ---
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// --- Componente Principal ---
export default function ReportsView({ onNavigate, distributors, laboratories, user, onDeleteOrder, representatives }) {
    const [orders, setOrders] = useState([]);
    const [summaryData, setSummaryData] = useState({ totalOrders: 0, salesTotal: 0 });
    const [lastVisible, setLastVisible] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [filterSeller, setFilterSeller] = useState(() => user?.role === 'Vendedor' ? user.name : '');
    const [filterDistributor, setFilterDistributor] = useState('');
    const [filterLaboratory, setFilterLaboratory] = useState(user?.role === 'Gerente de laboratorio' ? user.laboratory : '');
    const [startDateInput, setStartDateInput] = useState('');
    const [endDateInput, setEndDateInput] = useState('');

    const [appliedFilters, setAppliedFilters] = useState({
        seller: user?.role === 'Vendedor' ? user.name : '',
        distributor: '',
        laboratory: user?.role === 'Gerente de laboratorio' ? user.laboratory : '',
        startDate: '',
        endDate: '',
    });

    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const ORDERS_PER_PAGE = 30;
    
    const isProductSearchActive = useMemo(() => debouncedSearchTerm.length >= 2, [debouncedSearchTerm]);
    const isFilterActive = useMemo(() => Object.values(appliedFilters).some(val => !!val), [appliedFilters]);

    const fetchSummary = useCallback(async () => {
        try {
            let summaryConstraints = [];
            if (appliedFilters.seller) summaryConstraints.push(where("representative", "==", appliedFilters.seller));
            if (appliedFilters.distributor) summaryConstraints.push(where("distributor", "==", appliedFilters.distributor));
            if (appliedFilters.laboratory) summaryConstraints.push(where("laboratory", "==", appliedFilters.laboratory));
            if (appliedFilters.startDate) {
                const startOfDay = new Date(appliedFilters.startDate);
                startOfDay.setUTCHours(0, 0, 0, 0);
                summaryConstraints.push(where("date", ">=", startOfDay));
            }
            if (appliedFilters.endDate) {
                const endOfDay = new Date(appliedFilters.endDate);
                endOfDay.setUTCHours(23, 59, 59, 999);
                summaryConstraints.push(where("date", "<=", endOfDay));
            }

            const q = query(collection(db, "orders"), ...summaryConstraints);
            
            const snapshot = await getAggregateFromServer(q, {
                totalOrders: count(),
                salesTotal: sum('grandTotal')
            });

            setSummaryData({ totalOrders: snapshot.data().totalOrders, salesTotal: snapshot.data().salesTotal });
        } catch (error) {
            console.error("Error al calcular el resumen:", error);
            toast.error("No se pudo calcular el resumen de totales.");
        }
    }, [appliedFilters]); 

    const fetchOrders = useCallback(async (loadMore = false) => {
        if (loadMore && (!hasMore || isLoadingMore)) return;
        if (loadMore) setIsLoadingMore(true); else setIsLoading(true);
        if (!loadMore) { setOrders([]); setLastVisible(null); }
        
        try {
            let constraints = [orderBy("date", "desc")];
            if (appliedFilters.seller) constraints.push(where("representative", "==", appliedFilters.seller));
            if (appliedFilters.distributor) constraints.push(where("distributor", "==", appliedFilters.distributor));
            if (appliedFilters.laboratory) constraints.push(where("laboratory", "==", appliedFilters.laboratory));
            
            if (appliedFilters.startDate) {
                const startOfDay = new Date(appliedFilters.startDate);
                startOfDay.setUTCHours(0, 0, 0, 0);
                constraints.push(where("date", ">=", startOfDay));
            }
            if (appliedFilters.endDate) {
                const endOfDay = new Date(appliedFilters.endDate);
                endOfDay.setUTCHours(23, 59, 59, 999);
                constraints.push(where("date", "<=", endOfDay));
            }
            
            const isDateFilterActive = !!appliedFilters.startDate;
            if (!isDateFilterActive) {
                constraints.push(limit(ORDERS_PER_PAGE));
                if (loadMore && lastVisible) {
                    constraints.push(startAfter(lastVisible));
                }
            }

            const q = query(collection(db, "orders"), ...constraints);
            const docSnapshots = await getDocs(q);
            const newOrders = docSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date?.toDate() || new Date() }));
            
            setOrders(prev => loadMore ? [...prev, ...newOrders] : newOrders);
            setLastVisible(docSnapshots.docs[docSnapshots.docs.length - 1]);
            setHasMore(isDateFilterActive ? false : docSnapshots.docs.length === ORDERS_PER_PAGE);
            
        } catch (error) {
            console.error("Error al cargar pedidos:", error);
            toast.error("Error al cargar los pedidos.");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [appliedFilters, hasMore, isLoadingMore, lastVisible]);

    const handleApplyFilters = () => {
        let finalEndDate = endDateInput;
        if (startDateInput && !endDateInput) {
            finalEndDate = startDateInput;
        }

        if (startDateInput && finalEndDate && new Date(startDateInput) > new Date(finalEndDate)) {
            toast.error("La fecha de inicio no puede ser posterior a la fecha de fin.");
            return;
        }

        setAppliedFilters({
            seller: filterSeller,
            distributor: filterDistributor,
            laboratory: filterLaboratory,
            startDate: startDateInput,
            endDate: finalEndDate,
        });
    };

    const handleClearFilters = () => {
        const initialSeller = user?.role === 'Vendedor' ? user.name : '';
        const initialLab = user?.role === 'Gerente de laboratorio' ? user.laboratory : '';
        setFilterSeller(initialSeller);
        setFilterDistributor('');
        setFilterLaboratory(initialLab);
        setStartDateInput('');
        setEndDateInput('');
        setSearchTerm('');

        setAppliedFilters({
            seller: initialSeller,
            distributor: '',
            laboratory: initialLab,
            startDate: '',
            endDate: '',
        });
    };
    
    useEffect(() => {
        fetchOrders(false);
        if (Object.values(appliedFilters).some(v => v)) {
            fetchSummary();
        } else {
            setSummaryData({ totalOrders: 0, salesTotal: 0 });
        }
    }, [appliedFilters, fetchOrders, fetchSummary]);
    
    const finalOrders = useMemo(() => {
        let results = orders;
        if (isProductSearchActive) {
            const searchKeywords = debouncedSearchTerm.toLowerCase().split(' ').filter(Boolean);
            results = orders.filter(order => {
                const searchableText = [order.client, order.representative, order.distributor, ...(order.items?.map(i => i.productName) || [])].join(' ').toLowerCase();
                return searchKeywords.every(keyword => searchableText.includes(keyword));
            });
        }
        return results.map(order => ({ ...order, matchedProducts: isProductSearchActive ? order.items?.filter(item => debouncedSearchTerm.toLowerCase().split(' ').filter(Boolean).some(kw => (item.productName || '').toLowerCase().includes(kw))).map(item => ({ name: item.productName, quantity: item.quantity })) || [] : [] }));
    }, [orders, debouncedSearchTerm, isProductSearchActive]);
    
    const summaryDataForCards = useMemo(() => {
        if(isProductSearchActive) {
            return {
                salesTotal: finalOrders.reduce((total, order) => total + (order.grandTotal || 0), 0),
                totalOrders: finalOrders.length
            };
        }
        return summaryData;
    }, [finalOrders, summaryData, isProductSearchActive]);

    const canDelete = useMemo(() => user && ['Super Admin', 'Admin'].includes(user.role), [user]);
    const formatCurrency = useCallback((total) => { if (typeof total !== 'number') return '$0.00'; return total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }); }, []);
    const handleDeleteOrder = useCallback(async (orderId) => { try { await toast.promise(onDeleteOrder(orderId), { loading: 'Eliminando pedido...', success: 'Pedido eliminado exitosamente.', error: 'No se pudo eliminar el pedido.', }); setOrders(currentOrders => currentOrders.filter(order => order.id !== orderId)); } catch (error) {} }, [onDeleteOrder]);
    const handleCsvDownload = useCallback(() => { if (finalOrders.length === 0) return toast.error('No hay datos para exportar.'); const escapeCsvCell = (cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`; const headers = ['Fecha', 'Cliente', 'Vendedor', 'Total']; const rows = finalOrders.map(order => [ new Date(order.date).toLocaleDateString('es-MX'), order.client, order.representative || 'N/A', order.grandTotal || 0 ]); let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\r\n"; rows.forEach(rowArray => { csvContent += rowArray.map(escapeCsvCell).join(",") + "\r\n"; }); const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = `reporte-pedidos-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link); toast.success('Reporte CSV descargado.'); }, [finalOrders]);
    const sortedSellers = useMemo(() => { const list = (user?.role === 'Coordinador de vendedores') ? representatives.filter(rep => user.repsManaged?.includes(rep.id) || rep.name === user.name) : [...representatives]; return list.sort((a, b) => a.name.localeCompare(b.name)); }, [representatives, user]);
    const sortedDistributors = useMemo(() => [...distributors].sort((a, b) => a.name.localeCompare(b.name)), [distributors]);
    const sortedLaboratories = useMemo(() => [...laboratories].sort((a, b) => a.name.localeCompare(b.name)), [laboratories]);

    if (isLoading && orders.length === 0) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-12 w-12 text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center"><FileText className="mr-3 text-blue-600" /> Reportes de Pedidos</h2>
                <div className="flex items-center gap-3">
                    <button onClick={handleCsvDownload} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"> <FileSpreadsheet size={18} /> CSV </button>
                    <div onClick={() => { if (finalOrders.length === 0) toast.error('No hay datos para exportar.'); }}>
                        <PDFDownloadLink
                            document={<ReportPDF orders={finalOrders} formatCurrency={formatCurrency} summaryData={summaryDataForCards} dateRange={appliedFilters.startDate && appliedFilters.endDate ? `${new Date(appliedFilters.startDate).toLocaleDateString('es-MX')} a ${new Date(appliedFilters.endDate).toLocaleDateString('es-MX')}` : null} user={user} />}
                            fileName={`reporte-pedidos-${new Date().toISOString().slice(0, 10)}.pdf`}
                            className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 ${finalOrders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} >
                            {({ loading }) => loading ? <><Loader2 className="animate-spin h-4 w-4" /> Generando...</> : <><Download size={18} /> PDF</>}
                        </PDFDownloadLink>
                    </div>
                </div>
            </div>
            
            {isFilterActive && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SummaryCard icon={<DollarSign />} title="Ventas Totales (Filtro)" value={formatCurrency(summaryData.salesTotal)} color="#10B981" />
                    <SummaryCard icon={<Hash />} title="Pedidos Encontrados (Total)" value={summaryData.totalOrders.toLocaleString('es-MX')} color="#3B82F6" />
                </div>
            )}

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                <div className="pb-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Filtros Avanzados</h3>
                    <div className="space-y-4">
                        <FilterInput label="Búsqueda General" icon={<Search className="text-gray-500 mr-3" />}>
                            <input type="text" placeholder="Buscar por cliente, vendedor, producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm" />
                            {searchTerm && ( <button onClick={() => setSearchTerm('')} className="ml-2 text-gray-500 hover:text-gray-800" title="Limpiar búsqueda"> <X size={18} /> </button> )}
                        </FilterInput>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {user?.role !== 'Vendedor' && <FilterInput label="Vendedor" icon={<User className="text-gray-500 mr-3 shrink-0" />}><select value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm"><option value="">Todos</option>{sortedSellers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></FilterInput>}
                            <FilterInput label="Distribuidor" icon={<Truck className="text-gray-500 mr-3 shrink-0" />}><select value={filterDistributor} onChange={(e) => setFilterDistributor(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm"><option value="">Todos</option>{sortedDistributors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></FilterInput>
                            {user?.role !== 'Gerente de laboratorio' && <FilterInput label="Laboratorio" icon={<FlaskConical className="text-gray-500 mr-3 shrink-0" />}><select value={filterLaboratory} onChange={(e) => {setFilterLaboratory(e.target.value);}} className="w-full bg-transparent focus:outline-none text-sm"><option value="">Todos</option>{sortedLaboratories.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></FilterInput>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 items-end">
                            <FilterInput label="Fecha de Inicio" icon={<CalendarIcon className="text-gray-500 mr-3 shrink-0" size={18} />}><input type="date" value={startDateInput} onChange={(e) => setStartDateInput(e.target.value)} className="w-full bg-transparent focus:outline-none text-gray-500 text-sm" /></FilterInput>
                            <FilterInput label="Fecha de Fin" icon={<CalendarIcon className="text-gray-500 mr-3 shrink-0" size={18} />}><input type="date" value={endDateInput} onChange={(e) => setEndDateInput(e.target.value)} min={startDateInput} className="w-full bg-transparent focus:outline-none text-gray-500 text-sm" /></FilterInput>
                        </div>
                        <div className="flex justify-end pt-2 gap-4">
                            {(isFilterActive || searchTerm) && (
                                 <button onClick={handleClearFilters} className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors">
                                    <X size={18}/>
                                    Quitar Filtros
                                 </button>
                            )}
                             <button onClick={handleApplyFilters} className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                                <Search size={18}/>
                                Aplicar Filtros
                             </button>
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
                                {isProductSearchActive && <th className="p-3 font-semibold text-slate-600 text-left">Productos</th>}
                                <th className="p-3 font-semibold text-slate-600 text-right">Total</th>
                                <th className="p-3 font-semibold text-slate-600 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {finalOrders.map((order) => (
                                <tr key={order.id} className="border-b border-slate-200 hover:bg-blue-50">
                                    <td className="p-3 text-slate-700">{new Date(order.date).toLocaleDateString()}</td>
                                    <td className="p-3 font-medium text-slate-900">{order.client}</td>
                                    <td className="p-3 text-slate-700">{order.representative || 'N/A'}</td>
                                    {isProductSearchActive && <td className="p-3 text-slate-700 text-xs">{order.matchedProducts.map(p => `${p.name} (${p.quantity} pz)`).join(', ')}</td>}
                                    <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(order.grandTotal)}</td>
                                    <td className="p-3 text-center"><div className="flex justify-center items-center gap-2"><button onClick={() => onNavigate('orderSummary', order)} className="font-medium text-blue-600 hover:text-blue-800">Detalles</button>{canDelete && (<button onClick={() => handleDeleteOrder(order.id)} title="Eliminar" className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>)}</div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="block lg:hidden space-y-4">
                    {finalOrders.map((order) => (<ReportCard key={order.id} {...{ order, onNavigate, formatCurrency, onDeleteOrder: handleDeleteOrder, canDelete, isProductSearchActive }} />))}
                </div>

                {hasMore && (
                    <div className="text-center mt-8">
                        <button onClick={() => fetchOrders(true)} disabled={isLoadingMore} className="inline-flex items-center gap-2 px-6 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 disabled:bg-slate-400">
                            {isLoadingMore ? <><Loader2 className="animate-spin" size={18} /> Cargando...</> : 'Cargar más pedidos'}
                        </button>
                    </div>
                )}
                {!hasMore && finalOrders.length > 0 && (
                    <div className="text-center text-gray-500 mt-8 py-4 border-t"><p>Has llegado al final de la lista.</p></div>
                )}
                {finalOrders.length === 0 && !isLoading && (
                    <div className="text-center text-gray-500 mt-6 py-10 border-t"><p>No se encontraron pedidos que coincidan con los filtros.</p></div>
                )}
            </div>
        </div>
    );
}