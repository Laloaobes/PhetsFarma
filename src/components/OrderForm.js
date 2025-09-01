import React, { useState, useEffect } from 'react';
import { ShoppingCart, User as UserIcon, Truck, DollarSign, Plus, Trash2, FlaskConical, Check, X } from 'lucide-react';

// Función para formatear un número con separador de miles y 2 decimales.
const formatNumber = (num) => {
  if (isNaN(num)) return "0.00";
  return parseFloat(num).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Componente para cada fila de producto en el formulario.
const ProductRow = ({ item, index, onUpdate, onRemove, productList, laboratory }) => {
  // Se define el descuento máximo permitido.
  const maxDiscountPercentage = 0.70; // 70%

  // Se generan las opciones para el menú desplegable de descuentos (0%, 5%, 10%, etc.).
  const itemDiscountOptions = Array.from(
    { length: Math.floor((maxDiscountPercentage / 0.05) + 0.00001) + 1 },
    (_, i) => ({
      label: `${i * 5}%`,
      value: i * 0.05,
    })
  );

  // Cálculos para la visualización en tiempo real.
  const quantity = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.price) || 0;
  const discount = parseFloat(item.discount) || 0;
  const rawItemSubtotal = quantity * price;
  const itemDiscountAmount = rawItemSubtotal * discount;
  const itemFinalTotal = rawItemSubtotal - itemDiscountAmount;

  // Maneja la selección de un producto del dropdown.
  const handleProductSelect = (productName) => {
    const product = productList.find((p) => p.name === productName);
    let updatedItem;

    if (product) {
      const selectedPrice = parseFloat(product.price) || 0;
      const currentQuantity = parseFloat(item.quantity) || 1;
      const currentDiscount = parseFloat(item.discount) || 0;
      const newTotal = (currentQuantity * selectedPrice * (1 - currentDiscount)).toFixed(2);
      
      updatedItem = { 
        ...item, 
        sku: product.code, 
        productName: product.name, 
        price: selectedPrice.toFixed(2),
        total: newTotal 
      };
    } else {
      updatedItem = { ...item, sku: "", productName: "", price: "0.00", total: "0.00" };
    }
    onUpdate(index, updatedItem);
  };

  // Maneja los cambios en los campos de la fila.
  const handleInputChange = (field, value) => {
    const newItem = { ...item, [field]: value };
    const currentQuantity = parseFloat(newItem.quantity) || 0;
    const currentPrice = parseFloat(newItem.price) || 0;
    const currentDiscount = parseFloat(newItem.discount) || 0;
    const newTotal = (currentQuantity * currentPrice * (1 - currentDiscount)).toFixed(2);
    newItem.total = newTotal;
    onUpdate(index, newItem);
  };
  
  return (
    <div className="flex flex-col p-3 bg-gray-50 rounded-lg mb-4 shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <div className="col-span-1 md:col-span-1 flex items-center text-gray-700">
          <span className="text-gray-500 mr-1 text-xs">SKU:</span>
          <span className="font-medium text-sm">{item.sku || 'N/A'}</span>
        </div>
        <div className="col-span-1 md:col-span-3">
          <label htmlFor={`product-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Producto</label>
          <select id={`product-${index}`} value={item.productName} onChange={(e) => handleProductSelect(e.target.value)} className="w-full p-2 border rounded-md bg-white text-sm" disabled={!laboratory}>
            <option value="">Selecciona un producto</option>
            {productList.map((product) => (<option key={product.id} value={product.name}>{product.name}</option>))}
          </select>
        </div>
        <div className="col-span-1 md:col-span-1">
          <label htmlFor={`quantity-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Cant.</label>
          <input id={`quantity-${index}`} type="number" placeholder="Cant." value={item.quantity} onChange={(e) => handleInputChange("quantity", e.target.value)} className="w-full p-2 border rounded-md text-sm" />
        </div>
        <div className="col-span-1 md:col-span-1">
          <label htmlFor={`bonus-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Bonificación</label>
          <input id={`bonus-${index}`} type="number" placeholder="Bonus" value={item.bonus} onChange={(e) => handleInputChange("bonus", e.target.value)} className="w-full p-2 border rounded-md text-sm" />
        </div>
        <div className="col-span-1 md:col-span-2 text-right">
          <label className="block text-gray-700 text-xs font-semibold mb-1">Precio Unit.</label>
          <span className="font-medium text-gray-800 p-2 bg-gray-100 border rounded-md w-full text-sm inline-block">${formatNumber(item.price)}</span>
        </div>
        <div className="col-span-1 md:col-span-1">
          <label htmlFor={`discount-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Desc. (%)</label>
          <select id={`discount-${index}`} value={item.discount} onChange={(e) => handleInputChange("discount", parseFloat(e.target.value))} className="w-full p-2 border rounded-md bg-white text-sm">
            {itemDiscountOptions.map((option, idx) => (<option key={idx} value={option.value}>{option.label}</option>))}
          </select>
        </div>
        <div className="col-span-1 md:col-span-2 flex flex-col items-end text-right">
          {itemDiscountAmount > 0 ? (
            <span className="text-xs text-gray-600">Subt: ${formatNumber(rawItemSubtotal)}</span>
          ) : (
            <span className="text-xs text-gray-600">&nbsp;</span>
          )}
          <span className="font-bold text-gray-800 text-sm">Total: ${formatNumber(itemFinalTotal)}</span>
        </div>
        <div className="col-span-1 md:col-span-1 flex justify-end items-center self-end">
          <button onClick={() => onRemove(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
        </div>
      </div>
    </div>
  );
};

// Componente principal del formulario de pedidos.
export default function OrderForm({ 
  onSaveOrder, 
  products, 
  clients, 
  representatives = [], 
  distributors = [], 
  laboratories = [], 
  user, 
  onSaveNewClient,
  onSaveNewRepresentative,
  onSaveNewDistributor
}) {
  // Estados generales del formulario
  const [laboratory, setLaboratory] = useState(user?.role === 'Gerente de laboratorio' ? user.laboratory : "");
  const [representative, setRepresentative] = useState(user?.role === 'Representante' ? user.name : "");
  const [distributor, setDistributor] = useState("");
  const [client, setClient] = useState("");
  const [items, setItems] = useState([{ sku: "", productName: "", quantity: "1", bonus: "0", price: "0.00", discount: "0", total: "0.00" }]);
  
  // Estados para la funcionalidad de agregar nuevos clientes, vendedores, etc.
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [clientToSelectAfterAdd, setClientToSelectAfterAdd] = useState(null);

  const [isAddingNewRep, setIsAddingNewRep] = useState(false);
  const [newRepName, setNewRepName] = useState("");
  const [repToSelectAfterAdd, setRepToSelectAfterAdd] = useState(null);

  const [isAddingNewDist, setIsAddingNewDist] = useState(false);
  const [newDistName, setNewDistName] = useState("");
  const [distToSelectAfterAdd, setDistToSelectAfterAdd] = useState(null);
  
  // Estado para el modal de alerta
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // ¡LA CORRECCIÓN CLAVE!
  // Filtra el array de productos que viene de Firebase en lugar de buscar en un objeto.
  const productsByLaboratory = laboratory ? products.filter(p => p.laboratory === laboratory) : [];

  // Efecto que recalcula los totales cada vez que la lista de items cambia.
  const { rawSubtotal, discountAmount, grandTotal } = items.reduce(
    (totals, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      const discount = parseFloat(item.discount) || 0;

      const itemSubtotal = quantity * price;
      const itemDiscount = itemSubtotal * discount;
      
      totals.rawSubtotal += itemSubtotal;
      totals.discountAmount += itemDiscount;
      totals.grandTotal += (itemSubtotal - itemDiscount);

      return totals;
    },
    { rawSubtotal: 0, discountAmount: 0, grandTotal: 0 }
  );

  // Efecto para limpiar los productos cuando se cambia de laboratorio.
  useEffect(() => {
    setItems([{ sku: "", productName: "", quantity: "1", bonus: "0", price: "0.00", discount: "0", total: "0.00" }]);
  }, [laboratory]);

  // Efectos para auto-seleccionar el nuevo ítem después de crearlo.
  useEffect(() => {
    if (clientToSelectAfterAdd && clients.some(c => c.name === clientToSelectAfterAdd)) {
        setClient(clientToSelectAfterAdd);
        setClientToSelectAfterAdd(null);
    }
  }, [clients, clientToSelectAfterAdd]);
  
  useEffect(() => {
    if (repToSelectAfterAdd && representatives.some(r => r.name === repToSelectAfterAdd)) {
        setRepresentative(repToSelectAfterAdd);
        setRepToSelectAfterAdd(null);
    }
  }, [representatives, repToSelectAfterAdd]);

  useEffect(() => {
    if (distToSelectAfterAdd && distributors.some(d => d.name === distToSelectAfterAdd)) {
        setDistributor(distToSelectAfterAdd);
        setDistToSelectAfterAdd(null);
    }
  }, [distributors, distToSelectAfterAdd]);

  // Manejadores de ítems
  const handleUpdateItem = (index, updatedItem) => setItems(items.map((item, i) => i === index ? updatedItem : item));
  const handleAddItem = () => laboratory ? setItems([...items, { sku: "", productName: "", quantity: "1", bonus: "0", price: "0.00", discount: "0", total: "0.00" }]) : (setModalMessage("Por favor, selecciona un laboratorio primero."), setShowModal(true));
  const handleRemoveItem = (index) => setItems(items.filter((_, i) => i !== index));

  // Manejadores para añadir nuevos (cliente, rep, dist)
  const createToggleHandler = (setter) => () => setter(prev => !prev);
  const createConfirmHandler = (name, onSave, setName, setToggle, setSelectAfter) => () => {
    if (name.trim()) {
      onSave({ name });
      setSelectAfter(name);
      setName('');
      setToggle(false);
    }
  };
  const createCancelHandler = (setName, setToggle) => () => {
    setName('');
    setToggle(false);
  };

  const handleToggleNewClient = createToggleHandler(setIsAddingNewClient);
  const handleConfirmAddClient = createConfirmHandler(newClientName, onSaveNewClient, setNewClientName, setIsAddingNewClient, setClientToSelectAfterAdd);
  const handleCancelAddClient = createCancelHandler(setNewClientName, setIsAddingNewClient);

  const handleToggleNewRep = createToggleHandler(setIsAddingNewRep);
  const handleConfirmAddRep = createConfirmHandler(newRepName, onSaveNewRepresentative, setNewRepName, setIsAddingNewRep, setRepToSelectAfterAdd);
  const handleCancelAddRep = createCancelHandler(setNewRepName, setIsAddingNewRep);

  const handleToggleNewDist = createToggleHandler(setIsAddingNewDist);
  const handleConfirmAddDist = createConfirmHandler(newDistName, onSaveNewDistributor, setNewDistName, setIsAddingNewDist, setDistToSelectAfterAdd);
  const handleCancelAddDist = createCancelHandler(setNewDistName, setIsAddingNewDist);

  // Valida y envía el pedido para ser guardado.
  const handleSubmit = () => {
    if (!client || !laboratory || items.some((i) => !i.productName)) {
      setModalMessage("Completa laboratorio, cliente y asegúrate que todos los productos tengan nombre.");
      setShowModal(true);
      return;
    }

    // "Limpia" los datos para asegurar que se guardan como números en Firebase.
    const itemsToSave = items.map(item => ({
      sku: item.sku,
      productName: item.productName,
      quantity: parseFloat(item.quantity) || 0,
      bonus: parseFloat(item.bonus) || 0,
      price: parseFloat(item.price) || 0,
      discount: parseFloat(item.discount) || 0,
      total: parseFloat(item.total) || 0,
    }));

    const order = { 
      date: new Date(), 
      representative, 
      client, 
      distributor, 
      laboratory, 
      items: itemsToSave, 
      subtotal: rawSubtotal,
      discountAmount: discountAmount,
      grandTotal: grandTotal 
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
            <button onClick={() => setShowModal(false)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Entendido</button>
          </div>
        </div>
      )}
      <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><ShoppingCart className="mr-3 text-blue-500" /> Nuevo Pedido</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex flex-col bg-gray-100 p-3 rounded-lg">
                <label htmlFor="laboratory-select" className="block text-gray-700 text-xs font-semibold mb-1">Laboratorio</label>
                <div className="flex items-center">
                    <FlaskConical className="text-gray-500 mr-3" />
                    <select id="laboratory-select" value={laboratory} onChange={(e) => setLaboratory(e.target.value)} className="w-full bg-transparent focus:outline-none" disabled={user?.role === 'Gerente de laboratorio'}>
                        <option value="">Selecciona Laboratorio</option>
                        {laboratories.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex flex-col bg-gray-100 p-3 rounded-lg">
                <label htmlFor="representative-select" className="block text-gray-700 text-xs font-semibold mb-1">Representante/Promotor</label>
                <div className="flex items-center">
                  <UserIcon className="text-gray-500 mr-3" />
                  {isAddingNewRep ? (
                    <div className="flex w-full items-center">
                      <input type="text" value={newRepName} onChange={(e) => setNewRepName(e.target.value)} placeholder="Nuevo representante" className="w-full bg-transparent focus:outline-none text-sm" />
                      <button onClick={handleConfirmAddRep} className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 ml-2" title="Confirmar"><Check size={20} /></button>
                      <button onClick={handleCancelAddRep} className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 ml-1" title="Cancelar"><X size={20} /></button>
                    </div>
                  ) : (
                    <>
                      <select id="representative-select" value={representative} onChange={(e) => setRepresentative(e.target.value)} className="w-full bg-transparent focus:outline-none" disabled={user && (user.role === 'Representante' || user.role === 'Gerente de laboratorio')}>
                          <option value="">Selecciona Representante</option>
                          {representatives.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                      <button onClick={handleToggleNewRep} className="ml-2 p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200" title="Añadir nuevo representante"><Plus size={20} /></button>
                    </>
                  )}
                </div>
            </div>
            <div className="flex flex-col bg-gray-100 p-3 rounded-lg">
                <label htmlFor="distributor-select" className="block text-gray-700 text-xs font-semibold mb-1">Distribuidor</label>
                 <div className="flex items-center">
                  <Truck className="text-gray-500 mr-3" />
                  {isAddingNewDist ? (
                    <div className="flex w-full items-center">
                      <input type="text" value={newDistName} onChange={(e) => setNewDistName(e.target.value)} placeholder="Nuevo distribuidor" className="w-full bg-transparent focus:outline-none text-sm" />
                      <button onClick={handleConfirmAddDist} className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 ml-2" title="Confirmar"><Check size={20} /></button>
                      <button onClick={handleCancelAddDist} className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 ml-1" title="Cancelar"><X size={20} /></button>
                    </div>
                  ) : (
                    <>
                      <select id="distributor-select" value={distributor} onChange={(e) => setDistributor(e.target.value)} className="w-full bg-transparent focus:outline-none" disabled={user?.role === 'Representante'}>
                          <option value="">Selecciona Distribuidor</option>
                          {distributors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                      <button onClick={handleToggleNewDist} className="ml-2 p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200" title="Añadir nuevo distribuidor"><Plus size={20} /></button>
                    </>
                  )}
                </div>
            </div>
            <div className="flex flex-col bg-gray-100 p-3 rounded-lg">
                <label htmlFor="client-select" className="block text-gray-700 text-xs font-semibold mb-1">Cliente *</label>
                <div className="flex items-center">
                  <UserIcon className="text-gray-500 mr-3" size={18} />
                  {isAddingNewClient ? (
                    <div className="flex w-full items-center">
                      <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Nombre del nuevo cliente" className="w-full bg-transparent focus:outline-none text-sm" required />
                      <button onClick={handleConfirmAddClient} className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 ml-2" title="Confirmar"><Check size={20} /></button>
                      <button onClick={handleCancelAddClient} className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 ml-1" title="Cancelar"><X size={20} /></button>
                    </div>
                  ) : (
                    <>
                      <select id="client-select" value={client} onChange={(e) => setClient(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm" required>
                          <option value="">Selecciona Cliente</option>
                          {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <button onClick={handleToggleNewClient} className="ml-2 p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200" title="Añadir nuevo cliente"><Plus size={20} /></button>
                    </>
                  )}
                </div>
            </div>
        </div>
        <div className="mb-4">
          {items.map((item, index) => (<ProductRow key={index} index={index} item={item} onUpdate={handleUpdateItem} onRemove={handleRemoveItem} productList={productsByLaboratory} laboratory={laboratory} />))}
        </div>
        <div className="flex justify-between items-start mb-6">
          <button onClick={handleAddItem} className="flex items-center text-blue-600 hover:text-blue-800 font-medium py-2 px-4 rounded-lg transition duration-200"><Plus size={18} className="mr-2" /> Agregar Producto</button>
        </div>
        
        <div className="flex justify-end items-end flex-col mb-6">
          <div className="text-right w-full max-w-xs">
            {discountAmount > 0 && (
              <>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Subtotal (sin desc.):</span>
                  <span className="font-medium text-gray-800">${formatNumber(rawSubtotal)}</span>
                </div>
                <div className="flex justify-between py-1 border-t">
                  <span className="text-red-500">Descuento aplicado:</span>
                  <span className="font-medium text-red-500">-${formatNumber(discountAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-2 border-t mt-2">
              <span className="text-xl font-bold text-gray-800">Total Final:</span>
              <span className="text-xl font-bold text-gray-900">${formatNumber(grandTotal)}</span>
            </div>
          </div>
        </div>
        
        <button onClick={handleSubmit} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center text-lg shadow-md"><DollarSign className="mr-2" /> Generar Pedido</button>
      </div>
    </>
  );
}