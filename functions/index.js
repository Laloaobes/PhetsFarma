const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// --- FUNCIÓN AGREGADA: Para obtener el resumen global de ventas ---
exports.getSalesSummary = functions.https.onCall(async (data, context) => {
  // Opcional: Verificar que el usuario esté autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "La función debe ser llamada por un usuario autenticado."
    );
  }

  try {
    const ordersRef = admin.firestore().collection("orders");
    const snapshot = await ordersRef.get();

    if (snapshot.empty) {
      return { totalGlobalSales: 0, totalGlobalOrders: 0 };
    }

    let totalSales = 0;
    // Itera sobre todos los pedidos en el backend
    snapshot.forEach(doc => {
      const orderData = doc.data();
      // Se asegura de que grandTotal sea un número antes de sumarlo
      if (typeof orderData.grandTotal === 'number') {
        totalSales += orderData.grandTotal;
      }
    });

    const totalOrders = snapshot.size;

    // Devuelve solo los valores calculados
    return { totalGlobalSales: totalSales, totalGlobalOrders: totalOrders };

  } catch (error) {
    console.error("Error al calcular el resumen de ventas:", error);
    throw new functions.https.HttpsError("internal", "No se pudo calcular el resumen de ventas.");
  }
});


// Tu función existente para crear usuarios
exports.createUser = functions.https.onCall(async (data, context) => {
  const {email, password, name, username, role, laboratory} = data;

  if (!email || !password || !name || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Faltan datos (email, password, name, role).",
    );
  }

  try {
    await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    await admin.firestore().collection("users").doc(email).set({
      name: name,
      username: username,
      role: role,
      laboratory: laboratory || "",
    });

    return {message: `Usuario ${email} creado exitosamente.`};
  } catch (error) {
    console.error("Error al crear usuario:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});