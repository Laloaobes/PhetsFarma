const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createUser = functions.https.onCall(async (data, context) => {
  const {email, password, name, username, role, laboratory} = data;

  if (!email || !password || !name || !role) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Faltan datos (email, password, name, role).",
    );
  }

  try {
    // 1. Crear el usuario en Firebase Authentication
    await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // 2. Guardar los datos adicionales en Firestore
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
