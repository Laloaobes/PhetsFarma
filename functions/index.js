const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Se importan los componentes de la 2ª Generación
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// CORRECCIÓN 3: Inicializa la app solo si no ha sido inicializada antes
// Esto previene errores de timeout durante el 'firebase deploy'
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// --- FUNCIÓN PARA CREAR/ACTUALIZAR USUARIO (Sintaxis Gen 2) ---
exports.saveUser = onCall(async (request) => {
    // La información de autenticación ahora está en request.auth
    if (request.auth.token.role !== 'Admin' && request.auth.token.role !== 'Super Admin') {
        throw new HttpsError('permission-denied', 'Solo los administradores pueden gestionar usuarios.');
    }

    // Los datos enviados desde el cliente ahora están en request.data
    const { isEditing, id, email, password, name, username, role, laboratory, repsManaged } = request.data;
    if (!email || !name || !role) {
        throw new HttpsError("invalid-argument", "Email, Nombre y Rol son obligatorios.");
    }
    if (!isEditing && !password) {
        throw new HttpsError("invalid-argument", "La contraseña es obligatoria para nuevos usuarios.");
    }
    try {
        const userData = { name, username: username || "", role, laboratory: laboratory || "", repsManaged: repsManaged || [] };
        if (isEditing) {
            const user = await admin.auth().getUserByEmail(id);
            await admin.auth().setCustomUserClaims(user.uid, { role });
            if (password) {
                await admin.auth().updateUser(user.uid, { password: password });
            }
            await admin.firestore().collection("users").doc(id).update(userData);
            return { message: `Usuario ${id} actualizado.` };
        } else {
            const userRecord = await admin.auth().createUser({ email, password, displayName: name });
            await admin.auth().setCustomUserClaims(userRecord.uid, { role });
            await admin.firestore().collection("users").doc(email).set(userData);
            return { message: `Usuario ${email} creado.` };
        }
    } catch (error) {
        logger.error("Error al guardar usuario:", error);
        throw new HttpsError("internal", "Ocurrió un error al guardar el usuario.", { message: error.message });
    }
});

// --- FUNCIÓN PARA ELIMINAR UN USUARIO (Sintaxis Gen 2) ---
exports.deleteUser = onCall(async (request) => {
    if (request.auth.token.role !== 'Admin' && request.auth.token.role !== 'Super Admin') {
        throw new HttpsError('permission-denied', 'Solo los administradores pueden eliminar usuarios.');
    }
    const { email } = request.data;
    if (!email) {
        throw new HttpsError("invalid-argument", "El email es obligatorio.");
    }
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().deleteUser(user.uid);
        await admin.firestore().collection("users").doc(email).delete();
        return { result: `Usuario ${email} eliminado con éxito.` };
    } catch (error) {
        logger.error("Error al eliminar usuario:", error);
        throw new HttpsError("internal", "Ocurrió un error al eliminar el usuario.", { message: error.message });
    }
});

// --- FUNCIÓN DE REPORTE POR PRODUCTO (Sintaxis Gen 2) ---
exports.calculateProductReport = onCall(async (request) => {
    if (!request.auth) {
        logger.error("Intento de ejecución no autenticado.");
        throw new HttpsError("unauthenticated", "El usuario debe estar autenticado para realizar esta acción.");
    }

    logger.info("Iniciando 'calculateProductReport' para el usuario:", request.auth.uid);
    logger.info("Datos recibidos:", request.data);

    try {
        const { productNames, startDate, endDate, filterSeller, filterDistributor, filterLaboratory } = request.data;

        if (!productNames || !Array.isArray(productNames) || productNames.length === 0 || !filterLaboratory) {
            throw new HttpsError("invalid-argument", "La selección de laboratorio y al menos un producto es obligatoria.");
        }

        const db = admin.firestore();
        let ordersQuery = db.collection("orders");

        ordersQuery = ordersQuery.where("laboratory", "==", filterLaboratory);

        // --- INICIO DE CORRECCIÓN 1: Filtros ---
        // Se asume que el dato en Firestore es un objeto (ej. { name: '...' })
        // por lo que se filtra por la propiedad anidada 'name'.
        // ESTO REQUERIRÁ NUEVOS ÍNDICES EN FIRESTORE.
        if (filterSeller) {
            ordersQuery = ordersQuery.where("representative.name", "==", filterSeller);
        }
        if (filterDistributor) {
            ordersQuery = ordersQuery.where("distributor.name", "==", filterDistributor);
        }
        // --- FIN DE CORRECCIÓN 1 ---

        if (startDate) {
            const startOfDay = new Date(startDate);
            startOfDay.setUTCHours(0, 0, 0, 0);
            ordersQuery = ordersQuery.where("date", ">=", startOfDay);
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setUTCHours(23, 59, 59, 999);
            ordersQuery = ordersQuery.where("date", "<=", endOfDay);
        }

        const snapshot = await ordersQuery.get();
        logger.info(`Consulta a Firestore completada. Se encontraron ${snapshot.size} pedidos.`);

        if (snapshot.empty) {
            return [];
        }

        const report = {};
        productNames.forEach(name => {
            report[name] = {
                productName: name,
                totalQty: 0,
                totalAmount: 0,
                sellers: new Set(),
                distributors: new Set()
            };
        });

        snapshot.forEach((doc) => {
            const order = doc.data();
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item) => {
                    if (productNames.includes(item.productName)) {
                        const productName = item.productName;
                        const quantity = parseInt(item.quantity, 10) || 0;
                        const itemTotal = Number(item.total) || (Number(item.price) || 0) * quantity;

                        report[productName].totalQty += quantity;
                        report[productName].totalAmount += itemTotal;

                        // --- INICIO DE CORRECCIÓN 2: Extracción de datos ---
                        // Extrae el 'name' si es un objeto, o usa el valor si es un string
                        // Esto evita el error [object Object] en el frontend
                        if (order.representative) {
                            const sellerName = typeof order.representative === 'object' && order.representative.name
                                ? order.representative.name
                                : (typeof order.representative === 'string' ? order.representative : null);

                            if (sellerName) {
                                report[productName].sellers.add(sellerName);
                            }
                        }
                        if (order.distributor) {
                            const distributorName = typeof order.distributor === 'object' && order.distributor.name
                                ? order.distributor.name
                                : (typeof order.distributor === 'string' ? order.distributor : null);

                            if (distributorName) {
                                report[productName].distributors.add(distributorName);
                            }
                        }
                        // --- FIN DE CORRECCIÓN 2 ---
                    }
                });
            }
        });

        const finalReport = Object.values(report).map(item => ({
            ...item,
            sellers: Array.from(item.sellers),
            distributors: Array.from(item.distributors)
        }));

        logger.info("Reporte final generado correctamente.");
        return finalReport;

    } catch (error) {
        logger.error("Error crítico al generar el reporte:", error);
        throw new HttpsError("internal", "Ocurrió un error interno al generar el reporte.", { message: error.message });
    }
});