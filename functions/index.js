// functions/index.js

const { setGlobalOptions } = require('firebase-functions');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

// highlight-start
// Load the service account key
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  // Initialize the app with a service account credential
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Limit max concurrent containers across all v2 functions
setGlobalOptions({ maxInstances: 10 });

/**
 * Callable function for admins to create new users in Auth + Firestore
 */
exports.adminCreateUser = onCall(async (request) => {
  const { data, auth } = request;
  // Must be signed in
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in to call this function.');
  }

  const callerRole   = auth.token.role;
  const callerlocation = auth.token.locationId;

  // Only platformAdmin or locationAdmin may create users
  if (callerRole !== 'platformAdmin' && callerRole !== 'locationAdmin') {
    logger.warn(`Unauthorized createUser by ${auth.uid} (role=${callerRole})`);
    throw new HttpsError('permission-denied', 'Only admins can create users.');
  }

  const { email, password, displayName, role, locationId } = data;
  if (!email || !password || !displayName || !role || !locationId) {
    throw new HttpsError('invalid-argument', 'Missing required user fields.');
  }

  // location-admin may only create teacher/student/parent in their own location
  if (callerRole === 'locationAdmin') {
    if (locationId !== callerlocation) {
      throw new HttpsError('permission-denied', 'You can only create users within your own location.');
    }
    if (!['teacher','student','parent'].includes(role)) {
      throw new HttpsError('permission-denied', 'location‐admins may only create teacher, student, or parent roles.');
    }
  }

  // 1) Create the Auth user
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({ email, password, displayName });
  } catch (err) {
    logger.error('Error creating Auth user:', err);
    throw new HttpsError('internal', 'Failed to create Auth user: ' + err.message);
  }

  // 2) Set their custom claims
  try {
    // *** IMPORTANT FIX ***
    // When creating a student, we must also set the classId claim, even if it's null.
    const classId = data.classId || null;
    await admin.auth().setCustomUserClaims(userRecord.uid, { role, locationId, classId });
  } catch (err) {
    logger.error('Error setting custom claims:', err);
    // You might want to rollback the Auth user here in a real app
    throw new HttpsError('internal', 'Failed to set user claims: ' + err.message);
  }

  // 3) Create the Firestore profile
  try {
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      displayName,
      email,
      role,
      status:    'approved',
      locationId,
      classId: data.classId || null, // Also store classId in the document
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    logger.error('Error writing Firestore user doc:', err);
    throw new HttpsError('internal', 'Failed to create user profile: ' + err.message);
  }

  logger.info(`User ${userRecord.uid} created by ${auth.uid}`);
  return { uid: userRecord.uid };
});


/**
 * Callable function for admins to update existing users
 */
exports.adminUpdateUser = onCall(async (request) => {
  const { data, auth } = request;
  // Must be signed in
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in to call this function.');
  }

  const callerRole   = auth.token.role;
  const callerlocation = auth.token.locationId;

  // Only platformAdmin or locationAdmin may update users
  if (callerRole !== 'platformAdmin' && callerRole !== 'locationAdmin') {
    logger.warn(`Unauthorized updateUser by ${auth.uid} (role=${callerRole})`);
    throw new HttpsError('permission-denied', 'Only admins can update users.');
  }

  const { uid, updates } = data;
  if (!uid || typeof updates !== 'object') {
    throw new HttpsError('invalid-argument', 'uid and updates are required.');
  }

  // Fetch existing user profile
  const userRef = admin.firestore().doc(`users/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', `User ${uid} not found.`);
  }
  const target = userSnap.data();

  // location-admin cannot modify users outside their location
  if (callerRole === 'locationAdmin' && target.locationId !== callerlocation) {
    throw new HttpsError('permission-denied', 'Cannot edit users in another location.');
  }

  // If changing role, locationId, or classId, update Auth custom claims too
  const claimUpdates = {};
  if (updates.role && updates.role !== target.role) {
    claimUpdates.role = updates.role;
  }
  if (updates.locationId && updates.locationId !== target.locationId) {
    // platformAdmin can change any location; locationAdmin only within their own
    if (callerRole === 'locationAdmin' && updates.locationId !== callerlocation) {
      throw new HttpsError('permission-denied', 'Cannot reassign user to another location.');
    }
    claimUpdates.locationId = updates.locationId;
  }
  // *** IMPORTANT FIX ***
  // Add check for classId changes to update claims
  if ('classId' in updates && updates.classId !== target.classId) {
    claimUpdates.classId = updates.classId || null;
  }

  if (Object.keys(claimUpdates).length) {
    try {
      // Fetch existing claims to merge with new ones
      const existingUser = await admin.auth().getUser(uid);
      const existingClaims = existingUser.customClaims || {};
      await admin.auth().setCustomUserClaims(uid, { ...existingClaims, ...claimUpdates });
    } catch (err) {
      logger.error('Error updating custom claims for', uid, err);
      throw new HttpsError('internal', 'Failed to update user claims: ' + err.message);
    }
  }

  // Write back to Firestore (merge updates + updatedAt)
  try {
    await userRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    logger.error('Error updating Firestore user doc:', err);
    throw new HttpsError('internal', 'Failed to update user profile: ' + err.message);
  }

  logger.info(`User ${uid} updated by ${auth.uid}`, updates);
  return { success: true };
});


/**
 * 🔐 studentLogin
 * Verifies a student's fruit password and returns a Firebase Custom Token.
 * Automatically creates the Auth user if missing.
 */
exports.studentLogin = onCall({ cors: { origin: true } }, async (request) => {
  try {
    const { studentId, fruitPassword } = request.data;
    console.log("🔥 studentLogin called:", { studentId, fruitPassword });

    // 1️⃣ Validate input
    if (!studentId || !Array.isArray(fruitPassword) || fruitPassword.length !== 4) {
      console.log("❌ Invalid input:", { studentId, fruitPassword });
      throw new HttpsError(
        "invalid-argument",
        "A valid studentId and a 4-fruit password array are required."
      );
    }

    // Force UID to string to avoid Firebase Auth errors
    const uid = String(studentId).trim();
    console.log("🆔 Using UID:", uid);

    // 2️⃣ Fetch student Firestore document
    const userRef = admin.firestore().collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log("❌ Firestore doc not found for UID:", uid);
      throw new HttpsError("not-found", "Student profile not found.");
    }

    const userData = userDoc.data();
    console.log("📘 Loaded Firestore data for user:", userData);

    // 3️⃣ Get stored password (support legacy key names)
    const storedPassword = userData.fruit || userData.fruitPassword;
    console.log("🔑 Stored password field:", storedPassword);

    if (!storedPassword || !Array.isArray(storedPassword)) {
      console.log("❌ No valid fruit password found for user:", uid);
      throw new HttpsError("unauthenticated", "No valid password stored.");
    }

    // 4️⃣ Compare entered vs stored fruit passwords
    const isMatch = JSON.stringify(storedPassword) === JSON.stringify(fruitPassword);
    console.log("🧩 Password comparison result:", isMatch);

    if (!isMatch) {
      console.log("❌ Incorrect fruit password for:", uid);
      throw new HttpsError("unauthenticated", "Incorrect fruit password.");
    }

    // 5️⃣ Ensure user exists in Firebase Authentication
    let userRecord;
    try {
      userRecord = await admin.auth().getUser(uid);
      console.log("✅ Found existing Auth user:", userRecord.uid);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        console.log("⚙️ Creating new Auth user for:", uid);
        userRecord = await admin.auth().createUser({
          uid,
          displayName: userData.displayName || "Student",
        });

        console.log("🛠️ Setting custom claims for new user:", {
          role: userData.role || "student",
          classId: userData.classId || null,
        });

        await admin.auth().setCustomUserClaims(uid, {
          role: userData.role || "student",
          classId: userData.classId || null,
        });
      } else {
        console.error("❌ Auth lookup failed:", error);
        throw new HttpsError("internal", "Auth user lookup failed: " + error.message);
      }
    }

    // 6️⃣ Generate and return custom token
    try {
      const customToken = await admin.auth().createCustomToken(userRecord.uid);
      console.log("🎫 Issued custom token for:", userRecord.uid);
      return { token: customToken };
    } catch (error) {
      console.error("❌ Token creation failed:", error);
      throw new HttpsError("internal", "Could not create authentication token.");
    }

  } catch (error) {
    console.error("🔥 studentLogin FAILED:", error);
    throw error instanceof HttpsError
      ? error
      : new HttpsError("internal", "Unexpected server error: " + error.message);
  }
});
/**
 * 👀 getStudentsForClass
 * Public-safe callable function used BEFORE login
 * Returns only minimal student info for the login screen
 */
exports.getStudentsForClass = onCall(async (request) => {
  const { classId } = request.data;

  if (!classId) {
    throw new HttpsError(
      "invalid-argument",
      "classId is required"
    );
  }

  try {
    const snap = await admin
      .firestore()
      .collection("users")
      .where("classId", "==", classId)
      .where("role", "==", "student")
      .limit(500)
      .get();

    return snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || d.displayName || "",
        photoUrl: d.photoUrl || "",
        classId: d.classId || null
      };
    });

  } catch (err) {
    logger.error("getStudentsForClass failed", err);
    throw new HttpsError(
      "internal",
      "Failed to fetch students for class"
    );
  }
});




