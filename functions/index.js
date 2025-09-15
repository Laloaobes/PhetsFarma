const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// --- FUNCIÓN PARA CREAR/ACTUALIZAR USUARIO ---
exports.saveUser = functions.https.onCall(async (data, context) => {
  // if (context.auth.token.role !== 'Super Admin') { ... } // Opcional: Añadir verificación de rol

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
