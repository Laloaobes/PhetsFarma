import React, { useState, useEffect } from 'react';

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
// Se añaden getAuth, onAuthStateChanged y signOut para la autenticación real
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from './firebase';
// Se añade getDoc para poder leer el perfil del usuario al iniciar sesión
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc } from "firebase/firestore";

// --- DATOS LOCALES ---
const initialData = {
    laboratories: [
        { id: 1, name: 'Pets Pharma' },
        { id: 2, name: 'Kiron' },
        { id: 3, name: 'Vets Pharma' },
    ]
};

export default function App() {
    // Estados de la aplicación
    const [user, setUser] = useState(null);
    const [currentView, setCurrentView] = useState('login');
    const [lastView, setLastView] = useState('login');
    const [currentOrder, setCurrentOrder] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true); // Para mostrar pantalla de carga inicial

    // ---- ESTADOS PARA DATOS DE FIRESTORE ----
    const [clients, setClients] = useState([]);
    const [representatives, setRepresentatives] = useState([]);
    const [distributors, setDistributors] = useState([]);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);

    // --- SECCIÓN DE AUTENTICACIÓN CORREGIDA ---
    useEffect(() => {
        const auth = getAuth();
        // onAuthStateChanged es el listener oficial de Firebase.
        // Se ejecuta cuando el usuario inicia sesión, cierra sesión o al cargar la página.
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // El usuario está autenticado en Firebase.
                // Ahora, buscamos su perfil en nuestra colección "users" para obtener su rol y datos.
                const userDocRef = doc(db, "users", firebaseUser.email);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    // Si encontramos su perfil, lo guardamos en el estado 'user'.
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        ...userDocSnap.data()
                    });
                    setCurrentView("orderForm"); // Vista por defecto al iniciar sesión
                } else {
                    // Si no tiene perfil en Firestore, lo deslogueamos para evitar errores.
                    console.error("Usuario autenticado pero sin perfil en Firestore.");
                    signOut(auth);
                }
            } else {
                // El usuario no está autenticado.
                setUser(null);
                setCurrentView("login");
            }
            setIsLoadingUser(false); // Terminamos la carga inicial
        });

        // Limpiamos el listener cuando el componente se desmonta.
        return () => unsubscribe();
    }, []);

    // --- SECCIÓN DE CARGA DE DATOS CORREGIDA ---
    // Este useEffect ahora DEPENDE del estado del 'user'.
    // Solo se ejecutará para cargar datos CUANDO el usuario haya iniciado sesión.
    useEffect(() => {
        if (!user) {
            // Si no hay usuario, limpiamos los datos para que no se muestren datos de sesiones anteriores.
            setProducts([]);
            setClients([]);
            setRepresentatives([]);
            setDistributors([]);
            setUsers([]);
            return;
        }

        // Si hay un usuario, activamos los listeners para escuchar datos en tiempo real.
        // Estos ahora pasarán las reglas de seguridad porque el usuario está autenticado.
        console.log("Usuario autenticado. Cargando datos de Firestore...");
        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubClients = onSnapshot(collection(db, "clients"), (snapshot) => setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubReps = onSnapshot(collection(db, "representatives"), (snapshot) => setRepresentatives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubDists = onSnapshot(collection(db, "distributors"), (snapshot) => setDistributors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

        // La función de limpieza se ejecutará cuando el usuario cierre sesión (porque 'user' cambiará a null)
        return () => {
            console.log("Cerrando sesión. Desconectando listeners de Firestore.");
            unsubProducts();
            unsubClients();
            unsubReps();
            unsubDists();
            unsubUsers();
        };
    }, [user]); // La dependencia clave que activa/desactiva la carga de datos

    const handleLogout = () => {
        const auth = getAuth();
        signOut(auth);
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
    
    // La lógica de genericHandlers y userHandlers no necesita cambios.
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
            try {
                const userDocRef = doc(db, "users", newUser.email);
                await setDoc(userDocRef, { name: newUser.name, username: newUser.username, role: newUser.role, laboratory: newUser.laboratory || '', repsManaged: newUser.repsManaged || [] });
            } catch (error) { console.error("Error adding user to Firestore: ", error); }
        },
        handleUpdateItem: async (updatedUser) => {
            try {
                const userDocRef = doc(db, "users", updatedUser.id);
                await updateDoc(userDocRef, { name: updatedUser.name, username: updatedUser.username, role: updatedUser.role, laboratory: updatedUser.laboratory || '', repsManaged: updatedUser.repsManaged || [] });
            } catch (error) { console.error("Error updating user in Firestore: ", error); }
        },
        handleDeleteItem: async (userId) => {
            try {
                await deleteDoc(doc(db, "users", userId));
            } catch (error) { console.error("Error deleting user from Firestore: ", error); }
        },
    };

    const renderView = () => {
        // Muestra una pantalla de carga mientras se verifica la sesión del usuario.
        if (isLoadingUser) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    Cargando...
                </div>
            );
        }

        // Si no hay usuario, muestra el componente de Login.
        if (!user) {
            return <Login />;
        }

        // Si hay usuario, muestra la vista correspondiente.
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
            {user && currentView !== 'login' && (
                <AdminPanel onNavigate={handleNavigate} onLogout={handleLogout} currentView={currentView} user={user} />
            )}
            <main className="container mx-auto p-4 md:p-6 flex-grow">
                {renderView()}
            </main>
        </div>
    );
}