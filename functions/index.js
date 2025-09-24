const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();

// --- FUNCIÓN PARA CREAR/ACTUALIZAR USUARIO ---
exports.saveUser = functions.https.onCall(async (data, context) => {
  const {isEditing, id, email, password, name, username, role, laboratory, repsManaged} = data;
  if (!email || !name || !role) {
    throw new functions.https.HttpsError("invalid-argument", "Email, Nombre y Rol son obligatorios.");
  }
  if (!isEditing && !password) {
    throw new functions.https.HttpsError("invalid-argument", "La contraseña es obligatoria para nuevos usuarios.");
  }
  try {
    const userData = {name, username: username || "", role, laboratory: laboratory || "", repsManaged: repsManaged || []};
    if (isEditing) {
      const user = await admin.auth().getUserByEmail(id);
      await admin.auth().setCustomUserClaims(user.uid, {role});
      if (password) {
        await admin.auth().updateUser(user.uid, {password: password});
      }
      await admin.firestore().collection("users").doc(id).update(userData);
      return {message: `Usuario ${id} actualizado.`};
    } else {
      const userRecord = await admin.auth().createUser({email, password, displayName: name});
      await admin.auth().setCustomUserClaims(userRecord.uid, {role});
      await admin.firestore().collection("users").doc(email).set(userData);
      return {message: `Usuario ${email} creado.`};
    }
  } catch (error) {
    console.error("Error al guardar usuario:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// --- FUNCIÓN PARA ELIMINAR UN USUARIO ---
exports.deleteUser = functions.https.onCall(async (data, context) => {
  const {email} = data;
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(user.uid);
    await admin.firestore().collection("users").doc(email).delete();
    return {result: `Usuario ${email} eliminado con éxito.`};
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    throw new functions.https.HttpsError("internal", "Ocurrió un error al eliminar el usuario.");
  }
});

// --- FUNCIÓN DE REPORTE POR PRODUCTO CON CORS Y VERIFICACIÓN DE AUTH ---
exports.calculateProductReport = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // --- PASO CLAVE: VERIFICACIÓN MANUAL DE AUTENTICACIÓN ---
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
      console.error("No se encontró el token de autorización. La petición no está autenticada.");
      res.status(403).send("Unauthorized");
      return;
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      idToken = req.headers.authorization.split("Bearer ")[1];
    } else {
      console.error("Token de autorización mal formado.");
      res.status(403).send("Unauthorized");
      return;
    }

    try {
      // Verificar el token con Firebase Admin SDK
      await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Error al verificar el token de autorización:", error);
      res.status(403).send("Unauthorized");
      return;
    }
    // --- FIN DE LA VERIFICACIÓN DE AUTENTICACIÓN ---


    try {
      const { productNames, startDate, endDate, filterSeller, filterDistributor, filterLaboratory } = req.body.data;

      if (!productNames || productNames.length === 0 || !filterLaboratory) {
        return res.status(400).send({ error: "La selección de laboratorio y al menos un producto es obligatoria." });
      }

      const db = admin.firestore();
      let ordersQuery = db.collection("orders");

      ordersQuery = ordersQuery.where("laboratory", "==", filterLaboratory);
      if (filterSeller) ordersQuery = ordersQuery.where("representative", "==", filterSeller);
      if (filterDistributor) ordersQuery = ordersQuery.where("distributor", "==", filterDistributor);
      if (startDate) ordersQuery = ordersQuery.where("date", ">=", new Date(startDate));
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        ordersQuery = ordersQuery.where("date", "<=", endOfDay);
      }
    
      const snapshot = await ordersQuery.get();

      if (snapshot.empty) {
        return res.status(200).send({ data: [] });
      }

      const report = {};
      productNames.forEach(name => {
        report[name] = {
          productName: name,
          totalQty: 0,
          totalAmount: 0,
          salesBySeller: {},
          salesByDistributor: {}
        };
      });

      snapshot.forEach((doc) => {
        const order = doc.data();
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            if (productNames.includes(item.productName)) {
              const productName = item.productName;
              const qty = parseInt(item.qty, 10) || 0;
              const itemTotal = Number(item.total) || (Number(item.price) || 0) * qty;
              
              report[productName].totalQty += qty;
              report[productName].totalAmount += itemTotal;

              const seller = order.representative || 'N/A';
              const distributor = order.distributor || 'N/A';

              if(seller) {
                report[productName].salesBySeller[seller] = (report[productName].salesBySeller[seller] || 0) + qty;
              }
              if(distributor) {
                report[productName].salesByDistributor[distributor] = (report[productName].salesByDistributor[distributor] || 0) + qty;
              }
            }
          });
        }
      });
      
      const finalReport = Object.values(report).map(item => ({
          ...item,
          salesBySeller: Object.entries(item.salesBySeller).map(([sellerName, qty]) => ({ sellerName, qty })),
          salesByDistributor: Object.entries(item.salesByDistributor).map(([distributorName, qty]) => ({ distributorName, qty }))
      }));

      return res.status(200).send({ data: finalReport });

    } catch (error) {
      console.error("Error crítico al generar el reporte:", error);
      return res.status(500).send({ error: "Ocurrió un error interno al generar el reporte." });
    }
  });
});

