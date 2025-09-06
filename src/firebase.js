// Archivo: src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"; // Importa la función de persistencia
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Tu configuración con variables de entorno es excelente.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

// Inicialización de los servicios de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1'); // Opcional: especifica la región si no es us-central1

// --- OPTIMIZACIÓN DE VELOCIDAD CLAVE ---
// Habilitar el caché offline de Firestore.
// Esto mejora drásticamente el tiempo de carga en visitas posteriores.
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Probablemente múltiples pestañas abiertas, la persistencia
      // solo se puede habilitar en la primera.
      console.warn("Múltiples pestañas abiertas, la persistencia solo se habilitará en una.");
    } else if (err.code === 'unimplemented') {
      // El navegador no soporta esta funcionalidad.
      console.warn("El navegador actual no soporta la persistencia offline.");
    }
  });

// Exporta las instancias de los servicios para usarlas en toda la app
export { db, auth, functions };