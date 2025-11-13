import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Importa componentes de la aplicación
import AdminPanel from './components/AdminPanel';
import OrderForm from './components/OrderForm';
import OrderSummary from './components/OrderSummary';
import ReportsView from './components/ReportsView';
import ProductReportView from './components/ProductReportView';
import GenericManagement from './components/GenericManagement';
import ProductManagement from './components/ProductManagement';
import UserManagement from './components/UserManagement';
import Login from './components/Login';

// ---- IMPORTS DE FIREBASE ----
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from './firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc } from "firebase/firestore";
// <-- AÑADIR ESTAS LÍNEAS para llamar a las Cloud Functions
import { getFunctions, httpsCallable } from "firebase/functions";


// --- DATOS LOCALES ---
const initialData = {
    laboratories: [
        { id: 1, name: 'Pets Pharma' },
        { id: 2, name: 'Kiron' },
        { id: 3, name: 'Vets Pharma' },
    ]
};

export default function App() {
    const [user, setUser] = useState(null);
    const [currentView, setCurrentView] = useState('login');
    const [lastView, setLastView] = useState('login');
    const [currentOrder, setCurrentOrder] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    const [clients, setClients] = useState([]);
    const [representatives, setRepresentatives] = useState([]);
    const [distributors, setDistributors] = useState([]);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.email);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        ...userDocSnap.data()
                    });
                } else {
                    console.error("Usuario autenticado pero sin perfil en Firestore.");
                    await signOut(auth);
                }
            } else {
                setUser(null);
            }
            setIsLoadingUser(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) {
            setProducts([]);
            setClients([]);
            setRepresentatives([]);
            setDistributors([]);
            setUsers([]);
            return;
        }

        if (currentView === 'login') {
            setCurrentView('orderForm');
        }

        console.log("Usuario autenticado. Cargando datos de Firestore...");
        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubClients = onSnapshot(collection(db, "clients"), (snapshot) => setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubReps = onSnapshot(collection(db, "representatives"), (snapshot) => setRepresentatives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubDists = onSnapshot(collection(db, "distributors"), (snapshot) => setDistributors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

        return () => {
            console.log("Cerrando sesión. Desconectando listeners de Firestore.");
            unsubProducts();
            unsubClients();
            unsubReps();
            unsubDists();
            unsubUsers();
        };
    }, [user, currentView]);

    const handleLogout = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            setCurrentView('login');
        });
    };

    const handleNavigate = (view, order = null) => {
        setLastView(currentView);
        setCurrentView(view);
        setCurrentOrder(order);
    };

    const handleSaveOrder = async (orderData) => {
        try {
            const orderToSave = { ...orderData, date: new Date() };
            const docRef = await addDoc(collection(db, "orders"), orderToSave);
            handleNavigate('orderSummary', { ...orderToSave, id: docRef.id });
        } catch (error) {
            console.error("Error al guardar el pedido: ", error);
        }
    };
    
    const genericHandlers = (key) => ({
        handleAddItem: async (item) => {
            try {
                const { id, ...itemData } = item;
                if (key === 'products') { itemData.price = parseFloat(itemData.price) || 0; }
                await addDoc(collection(db, key), itemData);
            } catch (error) { console.error(`Error al añadir en ${key}: `, error); }
        },
        handleUpdateItem: async (updatedItem) => {
            try {
                const { id, ...itemData } = updatedItem;
                if (key === 'products') { itemData.price = parseFloat(itemData.price) || 0; }
                const itemDoc = doc(db, key, id);
                await updateDoc(itemDoc, itemData);
            } catch (error) { console.error(`Error al actualizar en ${key}: `, error); }
        },
        handleDeleteItem: async (id) => {
            try {
                const itemDoc = doc(db, key, id);
                await deleteDoc(itemDoc);
                return Promise.resolve();
            } catch (error) {
                console.error(`Error al eliminar en ${key}: `, error);
                return Promise.reject(error);
            }
        },
    });

    const userHandlers = {
        handleAddItem: async (newUser) => {
            // "newUser" es el objeto que viene del formulario de UserManagement
            // (Incluye email, password, name, role, etc.)
            
            // 1. Preparamos la llamada a la Cloud Function 'saveUser'
            const functions = getFunctions();
            const saveUser = httpsCallable(functions, 'saveUser');
            
            try {
                // 2. Llamamos a la función con los datos del formulario
                // Le añadimos "isEditing: false" para que la función sepa que es un usuario NUEVO
                await saveUser({ ...newUser, isEditing: false });
                
                // ¡Listo! onSnapshot detectará el nuevo usuario y actualizará la lista.
                
            } catch (error) {
                console.error("Error al crear usuario (Cloud Function):", error);
                // Lanzamos el error para que UserManagement.js lo atrape y muestre un toast
                throw error;
            }
        },
        handleUpdateItem: async (updatedUser) => {
            // 1. Preparamos la llamada a la Cloud Function 'saveUser'
            const functions = getFunctions();
            const saveUser = httpsCallable(functions, 'saveUser');
            
            try {
                // 2. Llamamos a la función con los datos del formulario
                // Le añadimos "isEditing: true" para que sepa que es una ACTUALIZACIÓN
                // Usamos 'updatedUser.id' que es el email
                await saveUser({ ...updatedUser, isEditing: true, id: updatedUser.id });
                
                // ¡Listo! onSnapshot detectará la actualización.
                
            } catch (error) {
                console.error("Error al actualizar usuario (Cloud Function):", error);
                throw error;
            }
        },
        handleDeleteItem: async (userEmail) => {
            // 1. Preparamos la llamada a la Cloud Function 'deleteUser'
            const functions = getFunctions();
            const deleteUser = httpsCallable(functions, 'deleteUser');
            
            try {
                // 2. Llamamos a la función pasándole el email del usuario a borrar
                await deleteUser({ email: userEmail });
                
                // ¡Listo! onSnapshot detectará la eliminación.

            } catch (error) {
                console.error("Error al eliminar usuario (Cloud Function):", error);
                throw error;
            }
        },
    };

    const renderContent = () => {
        // ✅ CORRECCIÓN: La lógica de renderizado ahora es más simple
        if (!user) {
            return <Login />;
        }

        switch (currentView) {
            case 'orderForm':
                return <OrderForm onSaveOrder={handleSaveOrder} products={products} clients={clients} representatives={representatives} distributors={distributors} laboratories={initialData.laboratories} user={user} onSaveNewClient={genericHandlers('clients').handleAddItem} onSaveNewRepresentative={genericHandlers('representatives').handleAddItem} onSaveNewDistributor={genericHandlers('distributors').handleAddItem} />;
            case 'orderSummary':
                return <OrderSummary order={currentOrder} clients={clients} onNavigate={handleNavigate} previousView={lastView} user={user} />;
            case 'reports':
                return <ReportsView onNavigate={handleNavigate} distributors={distributors} laboratories={initialData.laboratories} user={user} onDeleteOrder={genericHandlers('orders').handleDeleteItem} representatives={representatives} products={products}  />;
            case 'productReport':
                return <ProductReportView products={products} user={user} representatives={representatives} distributors={distributors} laboratories={initialData.laboratories} />;
            case 'manageClients':
                return <GenericManagement items={clients} handlers={genericHandlers('clients')} itemName="Cliente" user={user} />;
            case 'manageSellers':
                return <GenericManagement items={representatives} handlers={genericHandlers('representatives')} itemName="Vendedor" user={user} />;
            case 'manageDistributors':
                return <GenericManagement items={distributors} handlers={genericHandlers('distributors')} itemName="Distribuidor" user={user} />;
            case 'manageLaboratories':
                return <GenericManagement items={initialData.laboratories} handlers={{}} itemName="Laboratorio" user={user} isReadOnly={true} />;
            case 'manageProducts':
                return <ProductManagement products={products} laboratories={initialData.laboratories} user={user} handlers={genericHandlers('products')} />;
            case 'manageUsers':
                return <UserManagement users={users} handlers={userHandlers} user={user} />;
            default:
                return <div>Vista no encontrada</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Toaster position="top-right" />
            {user && (
                <AdminPanel onNavigate={handleNavigate} onLogout={handleLogout} currentView={currentView} user={user} />
            )}
            <main className="container mx-auto p-4 md:p-6 flex-grow">
                {isLoadingUser ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
                    </div>
                ) : (
                    renderContent()
                )}
            </main>
        </div>
    );
}