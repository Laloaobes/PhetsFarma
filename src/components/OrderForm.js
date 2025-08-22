import React, { useState, useEffect } from 'react';
import { ShoppingCart, User as UserIcon, Truck, DollarSign, Plus, Trash2, FlaskConical, Tag, Minus } from 'lucide-react';

// Opciones de descuento para cada ítem (en incrementos del 5%)
const itemDiscountOptions = [
  { label: '0%', value: 0 },
  { label: '5%', value: 0.05 },
  { label: '10%', value: 0.10 },
  { label: '15%', value: 0.15 },
  { label: '20%', value: 0.20 },
  { label: '25%', value: 0.25 },
  { label: '30%', value: 0.30 },
  { label: '35%', value: 0.35 },
  { label: '40%', value: 0.40 },
  { label: '45%', value: 0.45 },
  { label: '50%', value: 0.50 },
];

const ProductRow = ({ item, index, onUpdate, onRemove, productList, laboratory }) => {
  const [showBonus, setShowBonus] = useState(false);

  // Calcula el subtotal, descuento y total para este ítem
  const quantity = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.price) || 0;
  const discount = parseFloat(item.discount) || 0;

  const rawItemSubtotal = quantity * price; // Subtotal sin descuento por ítem
  const itemDiscountAmount = rawItemSubtotal * discount; // Monto del descuento por ítem
  const itemFinalTotal = rawItemSubtotal - itemDiscountAmount; // Total final con descuento por ítem

  const handleProductSelect = (productName) => {
    const product = productList.find((p) => p.name === productName);
    let updatedItem;

    if (product) {
      const selectedPrice = product.price; // Usar el precio del producto seleccionado
      const currentQuantity = parseFloat(item.quantity) || 1;
      const currentDiscount = parseFloat(item.discount) || 0;
      const newTotal = (currentQuantity * selectedPrice * (1 - currentDiscount)).toFixed(2);
      
      updatedItem = {
        ...item,
        sku: product.id,
        productName: product.name,
        price: selectedPrice.toFixed(2),
        total: newTotal, // Asegúrate de que item.total se actualice correctamente
      };
    } else {
      // Si no se selecciona un producto o se deselecciona, resetear
      updatedItem = { ...item, sku: "", productName: "", price: "0.00", total: "0.00" };
    }
    onUpdate(index, updatedItem);
  };

  const handleInputChange = (field, value) => {
    const newItem = { ...item, [field]: value };
    const currentQuantity = parseFloat(newItem.quantity) || 0;
    const currentPrice = parseFloat(newItem.price) || 0; // Se sigue usando item.price para cálculos
    const currentDiscount = parseFloat(newItem.discount) || 0;
    
    const newTotal = (currentQuantity * currentPrice * (1 - currentDiscount)).toFixed(2);
    
    newItem.total = newTotal; // Actualiza el total del ítem con el descuento
    onUpdate(index, newItem);
  };
  
  const toggleBonus = () => {
    const newShowBonus = !showBonus;
    setShowBonus(newShowBonus);
    if (!newShowBonus) {
      handleInputChange('bonus', 0);
    }
  };

  return (
    <div className="flex flex-col p-3 bg-gray-50 rounded-lg mb-4 shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        {/* SKU */}
        <div className="col-span-1 md:col-span-1 flex items-center text-gray-700">
          <span className="text-gray-500 mr-1 text-xs">SKU:</span>
          <span className="font-medium text-sm">{item.sku || 'N/A'}</span>
        </div>
        {/* Selección de Producto */}
        <div className="col-span-1 md:col-span-3">
          <select
            value={item.productName}
            onChange={(e) => handleProductSelect(e.target.value)}
            className="w-full p-2 border rounded-md bg-white text-sm"
            disabled={!laboratory}
          >
            <option value="">Selecciona un producto</option>
            {productList.map((product) => (
              <option key={product.id} value={product.name}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        {/* Cantidad */}
        <input
          type="number"
          placeholder="Cant."
          value={item.quantity}
          onChange={(e) => handleInputChange("quantity", e.target.value)}
          className="col-span-1 md:col-span-1 p-2 border rounded-md text-sm"
        />
        {/* Bonus */}
        <div className="col-span-1 md:col-span-1 flex items-center">
          <button onClick={toggleBonus} className="text-blue-600 hover:text-blue-800 p-1 rounded-full bg-blue-100 mr-1">
            {showBonus ? <Minus size={16} /> : <Tag size={16} />}
          </button>
          {showBonus && (
            <input
              type="number"
              placeholder="Bonus"
              value={item.bonus}
              onChange={(e) => handleInputChange("bonus", e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            />
          )}
        </div>
        {/* Precio (no editable, ahora col-span-2) */}
        <div className="col-span-1 md:col-span-2 flex items-center"> {/* Aumentado de col-span-1 a col-span-2 */}
          <span className="text-gray-500 mr-1 text-sm">$</span>
          <span className="font-medium text-gray-800 p-2 bg-white border rounded-md w-full text-sm"> {/* Puesto de nuevo a p-2 para altura consistente */}
            {parseFloat(item.price).toFixed(2)}
          </span>
        </div>
        {/* Descuento por ítem */}
        <div className="col-span-1 md:col-span-1 flex items-center">
          <select
            value={item.discount}
            onChange={(e) => handleInputChange("discount", parseFloat(e.target.value))}
            className="w-full p-2 border rounded-md text-sm"
          >
            {itemDiscountOptions.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {/* Totales individuales por producto (más concisos) */}
        <div className="col-span-1 md:col-span-2 flex flex-col items-end text-right"> {/* Reducido a col-span-2 */}
          {itemDiscountAmount > 0 && ( // Solo muestra subtotal si hay descuento
            <span className="text-xs text-gray-600">Subt: ${rawItemSubtotal.toFixed(2)}</span>
          )}
          <span className="font-bold text-gray-800 text-sm">Total: ${itemFinalTotal.toFixed(2) || "0.00"}</span>
        </div>
        {/* Botón de Eliminar */}
        <div className="col-span-1 md:col-span-1 flex justify-end">
          <button onClick={() => onRemove(index)} className="p-2 text-red-500 hover:text-red-700">
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OrderForm({ onSaveOrder, products, clients, sellers, distributors, laboratories }) {
  const [seller, setSeller] = useState("");
  const [client, setClient] = useState("");
  const [distributor, setDistributor] = useState("");
  const [laboratory, setLaboratory] = useState("");
  const [items, setItems] = useState([{ sku: "", productName: "", quantity: "1", bonus: "0", price: "", discount: "0", total: "0.00" }]);
  
  const [rawSubtotal, setRawSubtotal] = useState(0); // Subtotal de todos los ítems antes de cualquier descuento
  const [itemLevelDiscountAmount, setItemLevelDiscountAmount] = useState(0); // Monto total de los descuentos aplicados por ítem en todo el pedido
  const [finalTotal, setFinalTotal] = useState(0); // Total final de todo el pedido (con descuentos por ítem)

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const productsByLaboratory = products[laboratory] || [];

  useEffect(() => {
    let currentRawSubtotal = 0; // Suma de (cantidad * precio) sin descuentos por ítem
    let currentTotalWithItemDiscounts = 0; // Suma de (cantidad * precio * (1 - descuento_item))

    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      const discount = parseFloat(item.discount) || 0;

      currentRawSubtotal += (quantity * price);
      currentTotalWithItemDiscounts += (quantity * price * (1 - discount));
    });

    setRawSubtotal(currentRawSubtotal);
    setItemLevelDiscountAmount(currentRawSubtotal - currentTotalWithItemDiscounts);
    setFinalTotal(currentTotalWithItemDiscounts);

  }, [items]);

  const handleUpdateItem = (index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { sku: "", productName: "", quantity: "1", bonus: "0", price: "", discount: "0", total: "0.00" }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };
  
  const handleSubmit = () => {
    if (!client || items.some((i) => !i.productName || !i.price || parseFloat(i.price) <= 0)) {
      setModalMessage("Por favor, completa el cliente y asegúrate de que todos los productos tengan nombre y precio válido.");
      setShowModal(true);
      return;
    }
    const order = {
      id: Date.now(),
      date: new Date().toISOString(),
      seller,
      client,
      distributor,
      laboratory,
      items,
      subtotal: rawSubtotal,
      discountAmount: itemLevelDiscountAmount,
      appliedGlobalDiscount: itemLevelDiscountAmount > 0 && rawSubtotal > 0 ? (itemLevelDiscountAmount / rawSubtotal) : 0,
      grandTotal: finalTotal,
    };
    onSaveOrder(order);
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <h3 className="text-lg font-bold mb-4">Información Incompleta</h3>
            <p className="mb-4">{modalMessage}</p>
            <button onClick={() => setShowModal(false)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
              Entendido
            </button>
          </div>
        </div>
      )}
      <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <ShoppingCart className="mr-3 text-blue-500" /> Nuevo Pedido
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            <FlaskConical className="text-gray-500 mr-3" />
            <select value={laboratory} onChange={(e) => setLaboratory(e.target.value)} className="w-full bg-transparent focus:outline-none">
              <option value="">Selecciona Laboratorio</option>
              {laboratories.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            <UserIcon className="text-gray-500 mr-3" />
            <select value={seller} onChange={(e) => setSeller(e.target.value)} className="w-full bg-transparent focus:outline-none">
              <option value="">Selecciona Vendedor</option>
              {sellers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            <Truck className="text-gray-500 mr-3" />
            <select value={distributor} onChange={(e) => { setDistributor(e.target.value); }} className="w-full bg-transparent focus:outline-none">
              <option value="">Selecciona Distribuidor</option>
              {distributors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-gray-100 p-3 rounded-lg">
            <UserIcon className="text-gray-500 mr-3" />
            <select value={client} onChange={(e) => setClient(e.target.value)} className="w-full bg-transparent focus:outline-none" required>
              <option value="">Selecciona Cliente *</option>
              {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-4">
          {items.map((item, index) => (
            <ProductRow key={index} index={index} item={item} onUpdate={handleUpdateItem} onRemove={handleRemoveItem} productList={productsByLaboratory} laboratory={laboratory} />
          ))}
        </div>

        <div className="flex justify-between items-start mb-6">
          <button onClick={handleAddItem} className="flex items-center text-blue-600 hover:text-blue-800 font-medium py-2 px-4 rounded-lg transition duration-200">
            <Plus size={18} className="mr-2" /> Agregar Producto
          </button>
        </div>

        {/* Sección de totales generales del pedido */}
        <div className="flex justify-end items-end flex-col mb-6">
          <div className="text-right w-full max-w-xs">
            {/* Subtotal de todo el pedido (sin descuento por ítem) - solo aparece si hay descuento aplicado en el pedido */}
            {itemLevelDiscountAmount > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal del Pedido (sin descuento):</span>
                <span className="font-medium text-gray-800">${rawSubtotal.toFixed(2)}</span>
              </div>
            )}
            {/* Descuento total aplicado (solo de ítems) - solo aparece si hay descuento */}
            {itemLevelDiscountAmount > 0 && (
              <div className="flex justify-between py-1 border-t">
                <span className="text-red-500">Descuento aplicado en el Pedido:</span>
                <span className="font-medium text-red-500">-${itemLevelDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            {/* Total Final del Pedido / Total del Pedido */}
            <div className="flex justify-between py-2 border-t mt-2">
              <span className="text-xl font-bold text-gray-800">
                {itemLevelDiscountAmount > 0 ? 'Total Final del Pedido:' : 'Total del Pedido:'}
              </span>
              <span className="text-xl font-bold text-gray-900">${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center text-lg shadow-md">
          <DollarSign className="mr-2" /> Generar Pedido
        </button>
      </div>
    </>
  );
}
