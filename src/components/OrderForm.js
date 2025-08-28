import React, { useState, useEffect } from 'react';
import { ShoppingCart, User as UserIcon, Truck, DollarSign, Plus, Trash2, FlaskConical, Check, X } from 'lucide-react';

// El componente ProductRow se mantiene sin cambios
const ProductRow = ({ item, index, onUpdate, onRemove, productList, laboratory, user, maxDiscountPercentage }) => {
  const itemDiscountOptions = Array.from({ length: Math.floor(maxDiscountPercentage / 0.05) + 1 }, (_, i) => ({
    label: `${(i * 5)}%`,
    value: (i * 0.05)
  }));

  const quantity = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.price) || 0;
  const discount = parseFloat(item.discount) || 0;
  const rawItemSubtotal = quantity * price;
  const itemDiscountAmount = rawItemSubtotal * discount;
  const itemFinalTotal = rawItemSubtotal - itemDiscountAmount;

  const handleProductSelect = (productName) => {
    const product = productList.find((p) => p.name === productName);
    let updatedItem;
    if (product) {
      const selectedPrice = product.price;
      const currentQuantity = parseFloat(item.quantity) || 1;
      const currentDiscount = parseFloat(item.discount) || 0;
      const newTotal = (currentQuantity * selectedPrice * (1 - currentDiscount)).toFixed(2);
      updatedItem = { ...item, sku: product.code, productName: product.name, price: selectedPrice.toFixed(2), total: newTotal };
    } else {
      updatedItem = { ...item, sku: "", productName: "", price: "0.00", total: "0.00" };
    }
    onUpdate(index, updatedItem);
  };

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
        {/* SKU */}
        <div className="col-span-1 md:col-span-1 flex items-center text-gray-700">
            <span className="text-gray-500 mr-1 text-xs">SKU:</span>
            <span className="font-medium text-sm">{item.sku || 'N/A'}</span>
        </div>
        {/* Selección de Producto */}
        <div className="col-span-1 md:col-span-3">
            <label htmlFor={`product-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Producto</label>
            <select id={`product-${index}`} value={item.productName} onChange={(e) => handleProductSelect(e.target.value)} className="w-full p-2 border rounded-md bg-white text-sm" disabled={!laboratory}>
                <option value="">Selecciona un producto</option>
                {productList.map((product) => (<option key={product.id} value={product.name}>{product.name}</option>))}
            </select>
        </div>
        {/* Cantidad */}
        <div className="col-span-1 md:col-span-1">
            <label htmlFor={`quantity-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Cant.</label>
            <input id={`quantity-${index}`} type="number" placeholder="Cant." value={item.quantity} onChange={(e) => handleInputChange("quantity", e.target.value)} className="w-full p-2 border rounded-md text-sm" />
        </div>
        {/* Bonus */}
        <div className="col-span-1 md:col-span-1">
            <label htmlFor={`bonus-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Bonus</label>
            <input id={`bonus-${index}`} type="number" placeholder="Bonus" value={item.bonus} onChange={(e) => handleInputChange("bonus", e.target.value)} className="w-full p-2 border rounded-md text-sm" />
        </div>
        {/* Precio Unitario */}
        <div className="col-span-1 md:col-span-2">
            <label htmlFor={`price-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Precio Unit.</label>
            <div className="flex items-center">
                <span className="text-gray-500 mr-1 text-sm">$</span>
                <span className="font-medium text-gray-800 p-2 bg-white border rounded-md w-full text-sm">{parseFloat(item.price).toFixed(2)}</span>
            </div>
        </div>
        {/* Descuento por ítem */}
        <div className="col-span-1 md:col-span-1">
            <label htmlFor={`discount-${index}`} className="block text-gray-700 text-xs font-semibold mb-1">Desc. (%)</label>
            <select id={`discount-${index}`} value={item.discount} onChange={(e) => handleInputChange("discount", parseFloat(e.target.value))} className="w-full p-2 border rounded-md text-sm">
                {itemDiscountOptions.map((option, idx) => (<option key={idx} value={option.value}>{option.label}</option>))}
            </select>
        </div>
        {/* Totales individuales */}
        <div className="col-span-1 md:col-span-2 flex flex-col items-end text-right">
            {itemDiscountAmount > 0 ? (<span className="text-xs text-gray-600">Subt: ${rawItemSubtotal.toFixed(2)}</span>) : (<span className="text-xs text-gray-600">&nbsp;</span>)}
            <span className="font-bold text-gray-800 text-sm">Total: ${itemFinalTotal.toFixed(2) || "0.00"}</span>
        </div>
        {/* Botón de Eliminar */}
        <div className="col-span-1 md:col-span-1 flex justify-end items-center">
            <button onClick={() => onRemove(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default function OrderForm({ 
    onSaveOrder, 
    products, 
    clients, 
    representatives = [], 
    distributors = [], 
    laboratories = [], 
    user, 
    onSaveNewClient,
    // --- NUEVAS PROPS REQUERIDAS ---
    onSaveNewRepresentative,
    onSaveNewDistributor
}) {
    // Estados generales
    const [laboratory, setLaboratory] = useState(user?.role === 'Gerente de laboratorio' ? user.laboratory : "");
    const [representative, setRepresentative] = useState(user?.role === 'Representante' ? user.name : "");
    const [distributor, setDistributor] = useState(user?.role === 'Representante' ? user.name : "");
    const [client, setClient] = useState("");

    // --- NUEVOS ESTADOS PARA AÑADIR REPRESENTANTE Y DISTRIBUIDOR ---
    const [isAddingNewClient, setIsAddingNewClient] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [clientToSelectAfterAdd, setClientToSelectAfterAdd] = useState(null);

    const [isAddingNewRep, setIsAddingNewRep] = useState(false);
    const [newRepName, setNewRepName] = useState("");
    const [repToSelectAfterAdd, setRepToSelectAfterAdd] = useState(null);

    const [isAddingNewDist, setIsAddingNewDist] = useState(false);
    const [newDistName, setNewDistName] = useState("");
    const [distToSelectAfterAdd, setDistToSelectAfterAdd] = useState(null);

    // Estados de ítems y totales
    const [items, setItems] = useState([{ sku: "", productName: "", quantity: "1", bonus: "0", price: "0.00", discount: "0", total: "0.00" }]);
    const [rawSubtotal, setRawSubtotal] = useState(0);
    const [itemLevelDiscountAmount, setItemLevelDiscountAmount] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);

    // Estado del modal
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const productsByLaboratory = products[laboratory] || [];
    const maxDiscountAllowed = laboratory === 'Pets Pharma' ? 0.65 : (laboratory === 'Kiron' || laboratory === 'Vets Pharma' ? 0.35 : 0);

    useEffect(() => {
        let currentRawSubtotal = 0;
        let currentTotalWithItemDiscounts = 0;
        items.forEach(item => {
            const quantity = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.price) || 0;
            const discount = parseFloat(item.discount) || 0;
            currentRawSubtotal += quantity * price;
            currentTotalWithItemDiscounts += quantity * price * (1 - discount);
        });
        setRawSubtotal(currentRawSubtotal);
        setItemLevelDiscountAmount(currentRawSubtotal - currentTotalWithItemDiscounts);
        setFinalTotal(currentTotalWithItemDiscounts);
    }, [items]);

    useEffect(() => {
        setItems([{ sku: "", productName: "", quantity: "1", bonus: "0", price: "0.00", discount: "0", total: "0.00" }]);
    }, [laboratory]);

    // --- EFECTOS PARA AUTO-SELECCIÓN ---
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

    // --- MANEJADORES PARA AÑADIR NUEVOS (CLIENTE, REP, DIST) ---
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

    const handleSubmit = () => {
        if (!client || !laboratory || items.some((i) => !i.productName || !i.price || parseFloat(i.price) <= 0)) {
            setModalMessage("Por favor, completa laboratorio, cliente y asegúrate de que todos los productos tengan nombre y precio válido.");
            setShowModal(true);
            return;
        }
        const order = { id: Date.now(), date: new Date().toISOString(), representative, client, distributor, laboratory, items, subtotal: rawSubtotal, discountAmount: itemLevelDiscountAmount, grandTotal: finalTotal };
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
                    {/* Laboratorio */}
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
                    {/* Representante/Promotor */}
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
                    {/* Distribuidor */}
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
                    {/* Cliente */}
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
                    {items.map((item, index) => (<ProductRow key={index} index={index} item={item} onUpdate={handleUpdateItem} onRemove={handleRemoveItem} productList={productsByLaboratory} laboratory={laboratory} user={user} maxDiscountPercentage={maxDiscountAllowed} />))}
                </div>
                <div className="flex justify-between items-start mb-6">
                    <button onClick={handleAddItem} className="flex items-center text-blue-600 hover:text-blue-800 font-medium py-2 px-4 rounded-lg transition duration-200"><Plus size={18} className="mr-2" /> Agregar Producto</button>
                </div>
                <div className="flex justify-end items-end flex-col mb-6">
                    <div className="text-right w-full max-w-xs">
                        {itemLevelDiscountAmount > 0 ? (
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Subtotal (sin descuento):</span>
                                <span className="font-medium text-gray-800">${rawSubtotal.toFixed(2)}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Subtotal del Pedido:</span>
                                <span className="font-medium text-gray-800">${rawSubtotal.toFixed(2)}</span>
                            </div>
                        )}
                        {itemLevelDiscountAmount > 0 && (
                            <div className="flex justify-between py-1 border-t">
                                <span className="text-red-500">Descuento aplicado:</span>
                                <span className="font-medium text-red-500">-${itemLevelDiscountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-t mt-2">
                            <span className="text-xl font-bold text-gray-800">{itemLevelDiscountAmount > 0 ? 'Total Final:' : 'Total del Pedido:'}</span>
                            <span className="text-xl font-bold text-gray-900">${finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <button onClick={handleSubmit} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center text-lg shadow-md"><DollarSign className="mr-2" /> Generar Pedido</button>
            </div>
        </>
    );
}