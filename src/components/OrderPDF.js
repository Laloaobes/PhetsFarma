import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// --- ESTILOS PARA EL PDF ---
// Se definen de una forma similar a CSS, pero con objetos de JavaScript.
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 30,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  logo: {
    width: 80,
    height: 'auto',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    fontSize: 10,
  },
  infoColumn: {
    flexDirection: 'column',
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#666',
  },
  table: {
    width: '100%',
    display: 'table',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#dfdfdf',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
  tableColHeader: {
    width: '20%', // Ancho de columna
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#dfdfdf',
    padding: 5,
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#dfdfdf',
    padding: 5,
  },
  productCol: { width: '40%' },
  qtyCol: { width: '10%' },
  priceCol: { width: '15%' },
  totalCol: { width: '15%' },
  textAlignRight: { textAlign: 'right' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsContainer: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalTitle: {
    color: '#666',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  grandTotalTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  grandTotalValue: {
    fontWeight: 'bold',
    fontSize: 14,
  }
});

// Función de utilidad para formatear la moneda
const formatCurrency = (number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(number);

// --- COMPONENTE DEL DOCUMENTO PDF ---
export const OrderPDF = ({ order }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Resumen de Pedido</Text>
        {/* Nota: Las imágenes en el PDF deben ser de una URL pública o convertidas a base64 */}
        {/* Por simplicidad, aquí no incluimos el logo dinámico */}
      </View>

      {/* Información del Pedido */}
      <View style={styles.infoSection}>
        <View style={styles.infoColumn}>
          <Text><Text style={styles.infoTitle}>Cliente: </Text>{order.client}</Text>
          <Text><Text style={styles.infoTitle}>Representante: </Text>{order.representative || 'N/A'}</Text>
        </View>
        <View style={[styles.infoColumn, {alignItems: 'flex-end'}]}>
          <Text><Text style={styles.infoTitle}>ID Pedido: </Text>#{String(order.id).slice(0, 8)}</Text>
          <Text><Text style={styles.infoTitle}>Fecha: </Text>{new Date(order.date).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Tabla de Productos */}
      <View style={styles.table}>
        {/* Encabezado de la tabla */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableColHeader, styles.productCol]}>Producto</Text>
          <Text style={[styles.tableColHeader, styles.qtyCol, styles.textAlignRight]}>Cant.</Text>
          <Text style={[styles.tableColHeader, styles.priceCol, styles.textAlignRight]}>P. Unit.</Text>
          <Text style={[styles.tableColHeader, styles.qtyCol, styles.textAlignRight]}>Desc.</Text>
          <Text style={[styles.tableColHeader, styles.totalCol, styles.textAlignRight]}>Total</Text>
        </View>
        {/* Filas de la tabla */}
        {order.items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={[styles.tableCol, styles.productCol]}>{item.productName}</Text>
            <Text style={[styles.tableCol, styles.qtyCol, styles.textAlignRight]}>{item.quantity}</Text>
            <Text style={[styles.tableCol, styles.priceCol, styles.textAlignRight]}>{formatCurrency(item.price)}</Text>
            <Text style={[styles.tableCol, styles.qtyCol, styles.textAlignRight]}>{(item.discount * 100).toFixed(0)}%</Text>
            <Text style={[styles.tableCol, styles.totalCol, styles.textAlignRight]}>{formatCurrency(item.total)}</Text>
          </View>
        ))}
      </View>
      
      {/* Sección de Totales */}
      <View style={styles.totalsSection}>
          <View style={styles.totalsContainer}>
              <View style={styles.totalRow}>
                  <Text style={styles.totalTitle}>Subtotal:</Text>
                  <Text>{formatCurrency(order.subtotal)}</Text>
              </View>
              {order.discountAmount > 0 && (
                <View style={styles.totalRow}>
                    <Text style={styles.totalTitle}>Descuento:</Text>
                    <Text>{formatCurrency(-order.discountAmount)}</Text>
                </View>
              )}
              <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalTitle}>Total:</Text>
                  <Text style={styles.grandTotalValue}>{formatCurrency(order.grandTotal)}</Text>
              </View>
          </View>
      </View>

    </Page>
  </Document>
);