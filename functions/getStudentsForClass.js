// functions/getStudentsForClass.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.getStudentsForClass = functions.https.onCall(async (data) => {
  const { classId } = data;

  if (!classId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "classId is required"
    );
  }

  const snap = await admin.firestore()
    .collection("users")
    .where("classId", "==", classId)
    .where("role", "==", "student")
    .limit(500)
    .get();

  return snap.docs.map(d => ({
    id: d.id,
    name: d.data().name || "",
    photoUrl: d.data().photoUrl || "",
    classId: d.data().classId
  }));
});
