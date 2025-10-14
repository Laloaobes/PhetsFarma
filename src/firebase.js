import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

// --- LÓGICA DE INICIALIZACIÓN ROBUSTA ---
// Esto previene que Firebase se inicialice múltiples veces
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');

// --- SE ELIMINÓ EL BLOQUE DE CONEXIÓN A EMULADORES ---

// Habilitar la persistencia offline
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Múltiples pestañas abiertas, la persistencia de Firestore solo se habilita en una.");
    } else if (err.code === 'unimplemented') {
      console.warn("Este navegador no soporta la persistencia offline de Firestore.");
    }
  });

// Exporta las instancias de los servicios
export { db, auth, functions };

