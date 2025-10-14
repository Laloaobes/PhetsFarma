    import React, { useState, useMemo, useEffect } from 'react';
    import { BarChart2, Loader2, Download, FileSpreadsheet, FlaskConical, User, Truck } from 'lucide-react';
    import { getFunctions, httpsCallable } from "firebase/functions";
    import Select from 'react-select';
    import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
    import toast from 'react-hot-toast';

    // Registrar una fuente que soporte negritas (esencial para @react-pdf/renderer)
    Font.register({
    family: 'Helvetica-Bold',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.1/fonts/Helvetica/font-bold.ttf',
    });

    // Componente para el PDF del reporte de productos
    const ProductReportPDF = ({ reportData, dateRange, formatCurrency, user, totals }) => {
        const styles = StyleSheet.create({
            page: { fontFamily: 'Helvetica', fontSize: 9, padding: 30, color: '#333' },
            header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '2px solid #ccc', paddingBottom: 10, marginBottom: 20 },
            title: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
            subtitle: { fontSize: 8, color: '#555' },
            table: { width: '100%', display: 'table' },
            tableRow: { flexDirection: 'row', borderBottom: '1px solid #ddd', alignItems: 'stretch' },
            tableHeader: { backgroundColor: '#f2f2f2', fontFamily: 'Helvetica-Bold' },
            tableFooter: { backgroundColor: '#f2f2f2', fontFamily: 'Helvetica-Bold', borderTop: '1px solid #333' },
            colProduct: { width: '30%', padding: 4, borderRight: '1px solid #ddd' },
            colQty: { width: '15%', padding: 4, textAlign: 'right', borderRight: '1px solid #ddd' },
            colAmount: { width: '20%', padding: 4, textAlign: 'right', borderRight: '1px solid #ddd' },
            colSellers: { width: '17.5%', padding: 4, borderRight: '1px solid #ddd' },
            colDistributors: { width: '17.5%', padding: 4 },
        });

        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Reporte de Ventas por Producto</Text>
                            <Text style={styles.subtitle}>Generado por: {user?.name || 'N/A'}</Text>
                            {dateRange && <Text style={styles.subtitle}>Periodo: {dateRange}</Text>}
                        </View>
                        <Text style={styles.subtitle}>Fecha: {new Date().toLocaleDateString('es-MX')}</Text>
                    </View>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.colProduct}>Producto</Text>
                            <Text style={styles.colQty}>Piezas</Text>
                            <Text style={styles.colAmount}>Monto Total</Text>
                            <Text style={styles.colSellers}>Vendedores</Text>
                            <Text style={styles.colDistributors}>Distribuidores</Text>
                        </View>
                        {reportData.map(item => (
                            <View style={styles.tableRow} key={item.productName} wrap={false}>
                                <Text style={styles.colProduct}>{item.productName}</Text>
                                <Text style={styles.colQty}>{(item.totalQty || 0).toLocaleString('es-MX')} pz</Text>
                                <Text style={styles.colAmount}>{formatCurrency(item.totalAmount)}</Text>
                                <Text style={styles.colSellers}>{(item.sellers || []).join(', ')}</Text>
                                <Text style={styles.colDistributors}>{(item.distributors || []).join(', ')}</Text>
                            </View>
                        ))}
                        <View style={[styles.tableRow, styles.tableFooter]}>
                            <Text style={styles.colProduct}>TOTAL</Text>
                            <Text style={styles.colQty}>{(totals.totalQty || 0).toLocaleString('es-MX')} pz</Text>
                            <Text style={styles.colAmount}>{formatCurrency(totals.totalAmount)}</Text>
                            <Text style={styles.colSellers}></Text>
                            <Text style={styles.colDistributors}></Text>
                        </View>
                    </View>
                </Page>
            </Document>
        );
    };


    export default function ProductReportView({
    products = [],
    user,
    representatives = [],
    distributors = [],
    laboratories = [],
    }) {
        const [selectedLab, setSelectedLab] = useState('');
        const [selectedProducts, setSelectedProducts] = useState([]);
        const [filterSeller, setFilterSeller] = useState('');
        const [filterDistributor, setFilterDistributor] = useState('');
        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');
        const [reportData, setReportData] = useState(null);
        const [isLoading, setIsLoading] = useState(false);

        const laboratoryOptions = useMemo(() =>
            (laboratories || []).map(l => ({ value: l.name, label: l.name })).sort((a, b) => a.label.localeCompare(b.label)),
            [laboratories]
        );

        const productOptions = useMemo(() => {
            if (!selectedLab) return [];
            return (products || [])
                .filter(p => p.laboratory === selectedLab)
                .map(p => ({ value: p.name, label: p.sku ? `${p.name} (${p.sku})` : p.name, ...p }))
                .sort((a, b) => a.label.localeCompare(b.label));
        }, [products, selectedLab]);
        
        const sellerOptions = useMemo(() =>
            (representatives || []).map(r => ({ value: r.name, label: r.name })).sort((a, b) => a.label.localeCompare(b.label)),
            [representatives]
        );
        
        const distributorOptions = useMemo(() =>
            (distributors || []).map(d => ({ value: d.name, label: d.name })).sort((a, b) => a.label.localeCompare(b.label)),
            [distributors]
        );
        
        useEffect(() => {
            setSelectedProducts([]);
            setReportData(null);
        }, [selectedLab]);

        const selectedProductsDetails = useMemo(() => {
            const selectedNames = new Set(selectedProducts.map(p => p.value));
            return (products || []).filter(p => selectedNames.has(p.name));
        }, [selectedProducts, products]);
        
        const reportTotals = useMemo(() => {
            if (!reportData) return { totalQty: 0, totalAmount: 0 };
            return reportData.reduce((acc, item) => {
                acc.totalQty += item.totalQty || 0;
                acc.totalAmount += item.totalAmount || 0;
                return acc;
            }, { totalQty: 0, totalAmount: 0 });
        }, [reportData]);

        const formatCurrency = (total) => total?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) || '$0.00';

        const handleGenerateReport = () => {
            if (!selectedLab) {
                toast.error("Por favor, selecciona un laboratorio.");
                return;
            }
            if (selectedProducts.length === 0) {
                toast.error("Por favor, selecciona al menos un producto.");
                return;
            }
            
            setIsLoading(true);
            setReportData(null);

            const functions = getFunctions();
            const calculateProductReport = httpsCallable(functions, 'calculateProductReport');
            const productNames = selectedProducts.map(p => p.value);
            
            // MODIFICADO: Se usa toast.promise para una mejor UX
            const promise = calculateProductReport({
                productNames,
                startDate,
                endDate,
                filterSeller,
                filterDistributor,
                filterLaboratory: selectedLab
            });

            toast.promise(promise, {
                loading: 'Generando reporte...',
                success: (result) => {
                    setReportData(result.data);
                    setIsLoading(false);
                    if (result.data && result.data.length > 0) {
                        return "Reporte generado exitosamente.";
                    } else {
                        return "No se encontraron ventas con los filtros aplicados.";
                    }
                },
                error: (err) => {
                    console.error("Error al generar el reporte:", err);
                    setIsLoading(false);
                    return err.message || "Ocurrió un error al generar el reporte.";
                }
            });
        };

        const handleCsvDownload = () => {
            if (!reportData || reportData.length === 0) {
                toast.error("No hay datos para exportar.");
                return;
            }
            
            const escapeCsvCell = (cell) => `"${String(cell).replace(/"/g, '""')}"`;
            
            const headers = ['Producto', 'Piezas Vendidas', 'Monto Total', 'Vendedores', 'Distribuidores'];
            const rows = reportData.map(item => [
                escapeCsvCell(item.productName),
                item.totalQty,
                item.totalAmount,
                escapeCsvCell((item.sellers || []).join(' | ')),
                escapeCsvCell((item.distributors || []).join(' | '))
            ]);
            
            rows.push(['TOTAL', reportTotals.totalQty, reportTotals.totalAmount, '', '']);

            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += headers.join(",") + "\r\n";
            rows.forEach(rowArray => {
                csvContent += rowArray.join(",") + "\r\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `reporte-producto-${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Reporte CSV descargado.'); // NUEVO: Notificación
        };
        
        return (
            <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center">
                        <BarChart2 className="mr-3 text-blue-600" /> Reporte por Producto
                    </h2>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">1. Laboratorio (Obligatorio)</label>
                            <Select options={laboratoryOptions} value={laboratoryOptions.find(o => o.value === selectedLab)} onChange={opt => setSelectedLab(opt ? opt.value : '')} placeholder="Selecciona..." isClearable/>
                        </div>
                        <div className="col-span-1 lg:col-span-2">
                            <label className="text-sm font-medium text-gray-600 mb-1 block">2. Selecciona Productos</label>
                            <Select isMulti options={productOptions} value={selectedProducts} onChange={setSelectedProducts} placeholder="Busca productos..." noOptionsMessage={() => "Selecciona un laboratorio"} isDisabled={!selectedLab}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Vendedor (Opcional)</label>
                            <Select options={sellerOptions} isClearable value={sellerOptions.find(o => o.value === filterSeller)} onChange={opt => setFilterSeller(opt ? opt.value : '')} placeholder="Todos"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Distribuidor (Opcional)</label>
                            <Select options={distributorOptions} isClearable value={distributorOptions.find(o => o.value === filterDistributor)} onChange={opt => setFilterDistributor(opt ? opt.value : '')} placeholder="Todos"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Fecha de Inicio</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-100 p-3 rounded-lg focus:outline-none text-sm h-[38px]" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Fecha de Fin</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-100 p-3 rounded-lg focus:outline-none text-sm h-[38px]" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={handleGenerateReport} disabled={isLoading || !selectedLab || selectedProducts.length === 0} className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                            {isLoading ? <Loader2 className="animate-spin" size={18}/> : <BarChart2 size={18}/>}
                            {isLoading ? "Generando..." : "Generar Reporte"}
                        </button>
                    </div>
                </div>

                {selectedProductsDetails.length > 0 && (
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Detalles de Productos Seleccionados</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white text-sm">
                                <thead className="bg-slate-100">
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="p-3 font-semibold text-slate-600 text-left">SKU</th>
                                        <th className="p-3 font-semibold text-slate-600 text-left">Nombre</th>
                                        <th className="p-3 font-semibold text-slate-600 text-right">Precio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProductsDetails.map(p => (
                                        <tr key={p.id} className="border-b border-slate-200">
                                            <td className="p-3 text-slate-700">{p.sku}</td>
                                            <td className="p-3 font-medium text-slate-900">{p.name}</td>
                                            <td className="p-3 text-right text-slate-700">{formatCurrency(p.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {reportData && (
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Resultados del Reporte</h3>
                            <div className="flex gap-3">
                                <button onClick={handleCsvDownload} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"><FileSpreadsheet size={18}/> CSV</button>
                                {/* NUEVO: Notificación al hacer clic en el contenedor del PDF */}
                                <div onClick={() => toast.success('Iniciando descarga del PDF...')}>
                                    <PDFDownloadLink
                                        document={<ProductReportPDF reportData={reportData} dateRange={startDate && endDate ? `${startDate} al ${endDate}` : 'Todos'} formatCurrency={formatCurrency} user={user} totals={reportTotals} />}
                                        fileName={`reporte-productos-${new Date().toISOString().slice(0,10)}.pdf`}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700"
                                    >
                                        <Download size={18}/> PDF
                                    </PDFDownloadLink>
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white text-sm">
                                <thead className="bg-slate-100">
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="p-3 font-semibold text-slate-600 text-left">Producto</th>
                                        <th className="p-3 font-semibold text-slate-600 text-right">Piezas Vendidas</th>
                                        <th className="p-3 font-semibold text-slate-600 text-right">Monto Total</th>
                                        <th className="p-3 font-semibold text-slate-600 text-left">Vendedores</th>
                                        <th className="p-3 font-semibold text-slate-600 text-left">Distribuidores</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(reportData || []).map(item => (
                                        <tr key={item.productName} className="border-b border-slate-200 hover:bg-blue-50">
                                            <td className="p-3 font-medium text-slate-900">{item.productName}</td>
                                            <td className="p-3 text-right text-slate-700">{(item.totalQty || 0).toLocaleString('es-MX')} pz</td>
                                            <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(item.totalAmount)}</td>
                                            <td className="p-3 text-slate-700 text-xs">{(item.sellers || []).join(', ')}</td>
                                            <td className="p-3 text-slate-700 text-xs">{(item.distributors || []).join(', ')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                                        <td className="p-3 text-slate-900">TOTAL</td>
                                        <td className="p-3 text-right text-slate-900">{(reportTotals.totalQty || 0).toLocaleString('es-MX')} pz</td>
                                        <td className="p-3 text-right text-slate-900">{formatCurrency(reportTotals.totalAmount)}</td>
                                        <td className="p-3"></td>
                                        <td className="p-3"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }

