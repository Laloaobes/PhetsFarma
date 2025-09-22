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
    const ProductReportPDF = ({ reportData, dateRange, formatCurrency, user }) => {
        const styles = StyleSheet.create({
            page: { fontFamily: 'Helvetica', fontSize: 9, padding: 30, color: '#333' },
            header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '2px solid #ccc', paddingBottom: 10, marginBottom: 15 },
            title: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
            subtitle: { fontSize: 8, color: '#555' },
            productSection: { marginBottom: 20, border: '1px solid #eee', padding: 10, borderRadius: 3 },
            productHeader: { backgroundColor: '#f0f8ff', padding: 5, borderRadius: 2, marginBottom: 8},
            productTitle: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
            productTotals: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10, borderTop: '1px solid #eee', paddingTop: 5, marginTop:5 },
            totalItem: { flexDirection: 'column', alignItems: 'center' },
            totalLabel: { fontSize: 8, color: '#666' },
            totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
            table: { width: '100%', display: 'table', borderTop: '1px solid #eee', paddingTop: 5 },
            tableRow: { flexDirection: 'row', borderBottom: '1px solid #f2f2f2', alignItems: 'center', minHeight: 20 },
            tableHeader: { backgroundColor: '#f2f2f2', fontFamily: 'Helvetica-Bold' },
            tableCol: { width: '70%', padding: 4 },
            tableColquantity: { width: '30%', padding: 4, textAlign: 'right' },
            subHeader: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginTop: 5, marginBottom: 3 },
        });

        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Reporte Detallado por Producto</Text>
                            <Text style={styles.subtitle}>Generado por: {user?.name || 'N/A'}</Text>
                            {dateRange && <Text style={styles.subtitle}>Periodo: {dateRange}</Text>}
                        </View>
                        <Text style={styles.subtitle}>Fecha: {new Date().toLocaleDateString('es-MX')}</Text>
                    </View>
                    {(reportData || []).map(item => (
                        <View style={styles.productSection} key={item.productName} wrap={false}>
                            <View style={styles.productHeader}>
                                <Text style={styles.productTitle}>{item.productName}</Text>
                            </View>
                            <View style={styles.productTotals}>
                                <View style={styles.totalItem}><Text style={styles.totalLabel}>Piezas Vendidas</Text><Text style={styles.totalValue}>{(item.totalquantity || 0).toLocaleString('es-MX')} pz</Text></View>
                                <View style={styles.totalItem}><Text style={styles.totalLabel}>Monto Total</Text><Text style={styles.totalValue}>{formatCurrency(item.totalAmount)}</Text></View>
                            </View>
                            
                            {(item.salesBySeller || []).length > 0 && (
                                <View>
                                    <Text style={styles.subHeader}>Ventas por Vendedor</Text>
                                    <View style={styles.table}>
                                        <View style={[styles.tableRow, styles.tableHeader]}><Text style={styles.tableCol}>Nombre</Text><Text style={styles.tableColquantity}>Piezas</Text></View>
                                        {item.salesBySeller.map(seller => (
                                            <View style={styles.tableRow} key={seller.sellerName}><Text style={styles.tableCol}>{seller.sellerName}</Text><Text style={styles.tableColquantity}>{seller.quantity} pz</Text></View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {(item.salesByDistributor || []).length > 0 && (
                                <View>
                                    <Text style={styles.subHeader}>Ventas por Distribuidor</Text>
                                    <View style={styles.table}>
                                        <View style={[styles.tableRow, styles.tableHeader]}><Text style={styles.tableCol}>Nombre</Text><Text style={styles.tableColquantity}>Piezas</Text></View>
                                        {item.salesByDistributor.map(dist => (
                                            <View style={styles.tableRow} key={dist.distributorName}><Text style={styles.tableCol}>{dist.distributorName}</Text><Text style={styles.tableColquantity}>{dist.quantity} pz</Text></View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}
                </Page>
            </Document>
        );
    };


    // CORREGIDO: Se añaden valores por defecto a las props para evitar errores de carga
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
                // CORREGIDO: Muestra el SKU solo si existe para evitar "(undefined)"
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

        const formatCurrency = (total) => total?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) || '$0.00';

        const handleGenerateReport = async () => {
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

            try {
                const functions = getFunctions();
                const calculateProductReport = httpsCallable(functions, 'calculateProductReport');
                const productNames = selectedProducts.map(p => p.value);
                
                const result = await calculateProductReport({
                    productNames,
                    startDate,
                    endDate,
                    filterSeller,
                    filterDistributor,
                    filterLaboratory: selectedLab
                });

                setReportData(result.data);
                if (result.data && result.data.length > 0) {
                    toast.success("Reporte generado exitosamente.");
                } else {
                    toast("No se encontraron ventas con los filtros aplicados.", { icon: 'ℹ️' });
                }
            } catch (error) {
                console.error("Error al generar el reporte:", error);
                toast.error(error.message || "Ocurrió un error al generar el reporte.");
            } finally {
                setIsLoading(false);
            }
        };

        const handleCsvDownload = () => {
            if (!reportData || reportData.length === 0) {
                toast.error("No hay datos para exportar.");
                return;
            }
            
            const escapeCsvCell = (cell) => `"${String(cell).replace(/"/g, '""')}"`;
            
            const headers = ['Producto', 'Tipo de Venta', 'Nombre', 'Piezas Vendidas'];
            let rows = [];

            reportData.forEach(item => {
                rows.push([escapeCsvCell(item.productName), 'Total Producto', '', item.totalquantity]);
                if (item.salesBySeller.length > 0) {
                    item.salesBySeller.forEach(seller => {
                        rows.push([escapeCsvCell(item.productName), 'Vendedor', escapeCsvCell(seller.sellerName), seller.quantity]);
                    });
                }
                if (item.salesByDistributor.length > 0) {
                    item.salesByDistributor.forEach(dist => {
                        rows.push([escapeCsvCell(item.productName), 'Distribuidor', escapeCsvCell(dist.distributorName), dist.quantity]);
                    });
                }
            });
            
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += headers.join(",") + "\r\n";
            rows.forEach(rowArray => {
                csvContent += rowArray.join(",") + "\r\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `reporte-detallado-producto-${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
                                <PDFDownloadLink
                                    document={<ProductReportPDF reportData={reportData} dateRange={startDate && endDate ? `${startDate} al ${endDate}` : 'Todos'} formatCurrency={formatCurrency} user={user} />}
                                    fileName={`reporte-detallado-productos-${new Date().toISOString().slice(0,10)}.pdf`}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700"
                                >
                                    <Download size={18}/> PDF
                                </PDFDownloadLink>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {reportData.length > 0 ? reportData.map(item => (
                                <div key={item.productName} className="border rounded-lg p-4">
                                    <h4 className="font-bold text-lg text-blue-700">{item.productName}</h4>
                                    <div className="flex gap-8 my-2 border-y py-2 text-center">
                                        {/* CORREGIDO: Se estandariza el nombre de la variable a totalquantity */}
                                        <div><p className="text-xs text-gray-500">Total Piezas</p><p className="font-bold text-lg">{(item.totalquantity || 0).toLocaleString('es-MX')}</p></div>
                                        <div><p className="text-xs text-gray-500">Monto Total</p><p className="font-bold text-lg text-green-600">{formatCurrency(item.totalAmount || 0)}</p></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <h5 className="font-semibold mb-1">Ventas por Vendedor</h5>
                                            {item.salesBySeller && item.salesBySeller.length > 0 ? (
                                                <ul className="list-disc list-inside text-gray-700">
                                                    {/* CORREGIDO: Se estandariza a quantity */}
                                                    {item.salesBySeller.map(seller => <li key={seller.sellerName}>{seller.sellerName}: <span className="font-semibold">{seller.quantity} pz</span></li>)}
                                                </ul>
                                            ) : <p className="text-xs text-gray-500">Sin ventas registradas por vendedores.</p>}
                                        </div>
                                        <div>
                                            <h5 className="font-semibold mb-1">Ventas por Distribuidor</h5>
                                            {item.salesByDistributor && item.salesByDistributor.length > 0 ? (
                                                <ul className="list-disc list-inside text-gray-700">
                                                    {/* CORREGIDO: Se estandariza a quantity */}
                                                    {item.salesByDistributor.map(dist => <li key={dist.distributorName}>{dist.distributorName}: <span className="font-semibold">{dist.quantity} pz</span></li>)}
                                                </ul>
                                            ) : <p className="text-xs text-gray-500">Sin ventas registradas por distribuidores.</p>}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-4">No se encontraron datos para los productos y filtros seleccionados.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

