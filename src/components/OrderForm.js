import React, { useState, useEffect } from 'react';
import { ShoppingCart, User as UserIcon, Truck, DollarSign, Plus, Trash2, FlaskConical, Check, X } from 'lucide-react';

// Componente individual para cada fila de producto
const ProductRow = ({ item, index, onUpdate, onRemove, productList, laboratory, user, maxDiscountPercentage }) => {
  // Opciones de descuento dinámicas basadas en el máximo permitido
  const itemDiscountOptions = Array.from({ length: Math.floor(maxDiscountPercentage / 0.05) + 1 }, (_, i) => ({
    label: `${(i * 5)}%`,
    value: (i * 0.05)
  }));

  // Calcula el subtotal, descuento y total para este ítem
  const quantity = parseFloat(item.quantity) || 0;
  const bonus = parseFloat(item.bonus) || 0;
  const price = parseFloat(item.price) || 0;
  const discount = parseFloat(item.discount) || 0;

  // CAMBIO CLAVE AQUÍ: rawItemSubtotal ya no incluye 'bonus'
  const rawItemSubtotal = quantity * price; // Las bonificaciones no se cobran
  const itemDiscountAmount = rawItemSubtotal * discount;
  const itemFinalTotal = rawItemSubtotal - itemDiscountAmount; // itemFinalTotal se basa en el rawItemSubtotal sin bonus

  const handleProductSelect = (productName) => {
    const product = productList.find((p) => p.name === productName);
    let updatedItem;

    if (product) {
      const selectedPrice = product.price;
      const currentQuantity = parseFloat(item.quantity) || 1;
      const currentBonus = parseFloat(item.bonus) || 0; // Se mantiene el bonus para mostrar la cantidad total de ítems
      const currentDiscount = parseFloat(item.discount) || 0;
      // CAMBIO CLAVE AQUÍ: newTotal no incluye 'bonus' en el cálculo monetario
      const newTotal = (currentQuantity * selectedPrice * (1 - currentDiscount)).toFixed(2);
      
      updatedItem = {
        ...item,
        sku: product.code,
        productName: product.name,
        price: selectedPrice.toFixed(2),
        total: newTotal,
      };
    } else {
      updatedItem = { ...item, sku: "", productName: "", price: "0.00", total: "0.00" };
    }
    onUpdate(index, updatedItem);
  };

  const handleInputChange = (field, value) => {
    const newItem = { ...item, [field]: value };
    const currentQuantity = parseFloat(newItem.quantity) || 0;
    const currentBonus = parseFloat(newItem.bonus) || 0;
    const currentPrice = parseFloat(newItem.price) || 0;
    const currentDiscount = parseFloat(newItem.discount) || 0;
    
    // CAMBIO CLAVE AQUÍ: newTotal no incluye 'bonus' en el cálculo monetario
    const newTotal = (currentQuantity * currentPrice * (1 - currentDiscount)).toFixed(2);
    
    newItem.total = newTotal;
    onUpdate(index, newItem);
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
          <label htmlFor={`product-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Producto</label>
          <select
            id={`product-${index}`}
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
        <div className="col-span-1 md:col-span-1">
          <label htmlFor={`quantity-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Cant.</label>
          <input
            id={`quantity-${index}`}
            type="number"
            placeholder="Cant."
            value={item.quantity}
            onChange={(e) => handleInputChange("quantity", e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          />
        </div>
        {/* Bonus */}
        <div className="col-span-1 md:col-span-1">
          <label htmlFor={`bonus-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Bonus</label>
            <input
              id={`bonus-${index}`}
              type="number"
              placeholder="Bonus"
              value={item.bonus}
              onChange={(e) => handleInputChange("bonus", e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            />
        </div>
        {/* Precio Unitario (ahora fijo, no editable para nadie) */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor={`price-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Precio Unit.</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1 text-sm">$</span>
            <span className="font-medium text-gray-800 p-2 bg-white border rounded-md w-full text-sm">
              {parseFloat(item.price).toFixed(2)}
            </span>
          </div>
        </div>
        {/* Descuento por ítem */}
        <div className="col-span-1 md:col-span-1">
          <label htmlFor={`discount-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Desc. (%)</label>
          <select
            id={`discount-${index}`}
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
        <div className="col-span-1 md:col-span-2 flex flex-col items-end text-right">
          {itemDiscountAmount > 0 ? (
            <span className="text-xs text-gray-600">Subt: ${rawItemSubtotal.toFixed(2)}</span>
          ) : (
            <span className="text-xs text-gray-600">&nbsp;</span>
          )}
          <span className="font-bold text-gray-800 text-sm">Total: ${itemFinalTotal.toFixed(2) || "0.00"}</span>
        </div>
        {/* Botón de Eliminar */}
        <div className="col-span-1 md:col-span-1 flex justify-end items-center">
          <button onClick={() => onRemove(index)} className="p-2 text-red-500 hover:text-red-700">
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OrderForm({ onSaveOrder, products, clients, representatives = [], distributors = [], laboratories = [], user, onSaveNewClient }) {
  const [representative, setRepresentative] = useState(user && user.role === 'Representante' ? user.name : "");
  const [client, setClient] = useState("");
  const [distributor, setDistributor] = useState(user && user.role === 'Representante' ? user.name : "");
  const [newClientName, setNewClientName] = useState("");
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);
  // Nuevo estado para almacenar el nombre del cliente a seleccionar después de agregarlo
  const [clientToSelectAfterAdd, setClientToSelectAfterAdd] = useState(null);

  const [laboratory, setLaboratory] = useState(user && user.role === 'Gerente de laboratorio' ? user.laboratory : "");

  const [items, setItems] = useState([{ sku: "", productName: "", quantity: "1", bonus: "0", price: "0.00", discount: "0", total: "0.00" }]);
  
  const [rawSubtotal, setRawSubtotal] = useState(0); 
  const [itemLevelDiscountAmount, setItemLevelDiscountAmount] = useState(0); 
  const [finalTotal, setFinalTotal] = useState(0); 

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const productsByLaboratory = (user && user.role === 'Gerente de laboratorio') 
    ? (products[user.laboratory] || [])
    : (products[laboratory] || []);

  const getMaxDiscountPercentageForLab = () => {
    if (laboratory === 'Pets Pharma') { 
      return 0.65;
    } else if (laboratory === 'Kiron' || laboratory === 'Vets Pharma') {
      return 0.35;
    }
    return 0;
  };

  const maxDiscountAllowed = getMaxDiscountPercentageForLab();

  useEffect(() => {
    let currentRawSubtotal = 0; 
    let currentTotalWithItemDiscounts = 0; 

    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      // CAMBIO CLAVE AQUÍ: currentRawSubtotal ya no incluye 'bonus'
      const price = parseFloat(item.price) || 0;
      const discount = parseFloat(item.discount) || 0;

      currentRawSubtotal += (quantity * price); // Las bonificaciones no se cobran
      currentTotalWithItemDiscounts += (quantity * price * (1 - discount)); // Se mantiene el cálculo de descuento basado solo en la cantidad pagada
    });

    setRawSubtotal(currentRawSubtotal);
    setItemLevelDiscountAmount(currentRawSubtotal - currentTotalWithItemDiscounts);
    setFinalTotal(currentTotalWithItemDiscounts);

  }, [items]);

  useEffect(() => {
    setItems([{ sku: "", productName: "", quantity: "1", bonus: "0", price: "0.00", discount: "0", total: "0.00" }]);
  }, [laboratory]);

  // Efecto para auto-seleccionar el cliente después de que la lista 'clients' se actualice
  useEffect(() => {
    if (clientToSelectAfterAdd && clients.some(c => c.name === clientToSelectAfterAdd)) {
      setClient(clientToSelectAfterAdd); // Establece el cliente recién agregado como el seleccionado
      setClientToSelectAfterAdd(null); // Limpia el estado temporal
    }
  }, [clients, clientToSelectAfterAdd]);


  const handleUpdateItem = (index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleAddItem = () => {
    if (laboratory) {
      setItems([...items, { sku: "", productName: "", quantity: "1", bonus: "0", price: "0.00", discount: "0", total: "0.00" }]);
    } else {
      setModalMessage("Por favor, selecciona un laboratorio primero.");
      setShowModal(true);
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Función para alternar entre el selector de cliente existente y el campo de nuevo cliente
  const handleToggleNewClient = () => {
    setIsAddingNewClient(prev => !prev);
    setClient(""); // Limpiar el cliente seleccionado al alternar
    setNewClientName(""); // Limpiar el nombre del nuevo cliente al alternar
    setClientToSelectAfterAdd(null); // Limpiar cualquier cliente pendiente de selección
  };

  // Función para confirmar la adición de un nuevo cliente
  const handleConfirmAddClient = () => {
    if (newClientName.trim()) {
      onSaveNewClient({ name: newClientName }); // Llama a la prop de App.js para guardar el nuevo cliente
      setClientToSelectAfterAdd(newClientName); // Guarda el nombre para la auto-selección
      setNewClientName(''); // Limpia el campo de entrada
      setIsAddingNewClient(false); // Regresa al modo de selección
    } else {
      console.warn('El nombre del nuevo cliente no puede estar vacío.');
    }
  };

  // Función para cancelar la adición de un nuevo cliente
  const handleCancelAddClient = () => {
    setNewClientName('');
    setIsAddingNewClient(false); // Desactiva el modo de añadir nuevo cliente, regresando al selector
    setClientToSelectAfterAdd(null); // Limpiar cualquier cliente pendiente de selección
  };
  
  const handleSubmit = () => {
    let currentClient = "";

    // Si está en modo de añadir nuevo cliente, el valor ya debería estar en 'client'
    // si se confirmó. Si no, debería ser el 'client' ya seleccionado del dropdown.
    currentClient = client;
    
    if (!currentClient || !laboratory || items.some((i) => !i.productName || !i.price || parseFloat(i.price) <= 0)) {
      setModalMessage("Por favor, completa el laboratorio, cliente y asegúrate de que todos los productos tengan nombre y precio válido.");
      setShowModal(true);
      return;
    }
    const order = {
      id: Date.now(),
      date: new Date().toISOString(),
      representative,
      client: currentClient,
      distributor,
      laboratory,
      items,
      subtotal: rawSubtotal,
      discountAmount: itemLevelDiscountAmount,
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
          {/* Laboratorio */}
          <div className="flex flex-col bg-gray-100 p-3 rounded-lg">
            <label htmlFor="laboratory-select" className="block text-gray-700 text-xs font-semibold mb-1">Laboratorio</label>
            <div className="flex items-center">
              <FlaskConical className="text-gray-500 mr-3" />
              <select 
                id="laboratory-select"
                value={laboratory} 
                onChange={(e) => setLaboratory(e.target.value)} 
                className="w-full bg-transparent focus:outline-none"
                disabled={user && user.role === 'Gerente de laboratorio'} 
              >
                <option value="">Selecciona Laboratorio</option>
                {laboratories.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
          </div>
          {/* Representante/Promotor */}
          <div className="flex flex-col bg-gray-100 p-3 rounded-lg">
            <label htmlFor="representative-select" className="block text-gray-700 text-xs font-semibold mb-1">Representante/Promotor</label>
            <div className="flex items-center">
              <UserIcon className="text-gray-500 mr-3" />
              <select 
                id="representative-select"
                value={representative} 
                onChange={(e) => setRepresentative(e.target.value)} 
                className="w-full bg-transparent focus:outline-none"
                disabled={user && (user.role === 'Representante' || user.role === 'Gerente de laboratorio')} 
              >
                <option value="">Selecciona Representante</option>
                {representatives.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
          </div>
          {/* Distribuidor */}
          <div className="flex flex-col bg-gray-100 p-3 rounded-lg">
            <label htmlFor="distributor-select" className="block text-gray-700 text-xs font-semibold mb-1">Distribuidor</label>
            <div className="flex items-center">
              <Truck className="text-gray-500 mr-3" />
              <select 
                id="distributor-select"
                value={distributor} 
                onChange={(e) => { setDistributor(e.target.value); }} 
                className="w-full bg-transparent focus:outline-none"
                disabled={user && user.role === 'Representante'}
              >
                <option value="">Selecciona Distribuidor</option>
                {distributors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
          </div>
          {/* Cliente */}
          <div className="flex flex-col bg-gray-100 p-3 rounded-lg">
            <label htmlFor="client-select" className="block text-gray-700 text-xs font-semibold mb-1">Cliente *</label>
            <div className="flex items-center">
              <UserIcon className="text-gray-500 mr-3" size={18} />
              {isAddingNewClient ? (
                <>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nombre del nuevo cliente"
                    className="w-full bg-transparent focus:outline-none text-sm text-gray-800"
                    required
                  />
                  {newClientName.trim() ? ( // Muestra los botones de Confirmar/Cancelar si hay texto
                    <div className="flex space-x-2 ml-2">
                      <button
                        onClick={handleConfirmAddClient}
                        className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 focus:outline-none transition-colors shadow-sm"
                        title="Confirmar"
                      >
                        <UserIcon size={20} /> {/* UserIcon ahora es el botón de Confirmar */}
                      </button>
                      <button
                        onClick={handleCancelAddClient}
                        className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none transition-colors shadow-sm"
                        title="Cancelar"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : ( // Si el input está vacío, solo muestra la X para cancelar y volver al selector
                    <button
                      onClick={handleCancelAddClient}
                      className="ml-2 p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none transition-colors shadow-sm"
                      title="Cancelar y volver a seleccionar cliente"
                    >
                      <X size={20} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <select
                    id="client-select"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-sm text-gray-800"
                    required
                  >
                    <option value="">Selecciona Cliente</option>
                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  {/* Botón para alternar a añadir nuevo cliente, visible cuando se está seleccionando cliente existente */}
                  <button
                    onClick={handleToggleNewClient}
                    className="ml-2 p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 focus:outline-none transition-colors shadow-sm"
                    title="Añadir nuevo cliente"
                  >
                    <Plus size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          {items.map((item, index) => (
            <ProductRow 
              key={index} 
              index={index} 
              item={item} 
              onUpdate={handleUpdateItem} 
              onRemove={handleRemoveItem} 
              productList={productsByLaboratory} 
              laboratory={laboratory} 
              user={user} 
              maxDiscountPercentage={maxDiscountAllowed} 
            />
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
            {itemLevelDiscountAmount > 0 ? (
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal del Pedido (sin descuento):</span>
                <span className="font-medium text-gray-800">${rawSubtotal.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal del Pedido:</span>
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
