import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Tu configuración con variables de entorno
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

// 1. Inicializa la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// 2. Obtiene las instancias de los servicios
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1'); // Especifica la región para consistencia

// 3. Conecta a los emuladores PRIMERO si estás en entorno de desarrollo
// Esto asegura que cualquier configuración posterior se aplique a los emuladores.
if (window.location.hostname === "localhost") {
  console.log("Conectando a los emuladores de Firebase...");
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099');
}

// 4. Habilita la persistencia offline de Firestore DESPUÉS de conectar a los emuladores
// De esta manera, la persistencia se habilitará tanto en producción como en el emulador.
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Este error es normal si tienes varias pestañas abiertas.
      console.warn("Múltiples pestañas abiertas, la persistencia offline solo se habilitará en la primera.");
    } else if (err.code === 'unimplemented') {
      // El navegador (ej. modo incógnito en algunos casos) no soporta esta funcionalidad.
      console.warn("Este navegador no soporta la persistencia offline.");
    }
  });

// 5. Exporta las instancias ya configuradas de los servicios
export { db, auth, functions };

