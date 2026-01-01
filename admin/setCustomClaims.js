// admin/setCustomClaims.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Load service account key
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf-8'));

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

// === Parse command line arguments ===
// Usage:
//   node setCustomClaims.js set <email> <role> [classId]
//   node setCustomClaims.js get <email>

const [,, command, emailArg, roleArg, classIdArg] = process.argv;

if (!command || !emailArg) {
  console.error("❌ Usage:");
  console.error("   node setCustomClaims.js set <email> <role> [classId]");
  console.error("   node setCustomClaims.js get <email>");
  process.exit(1);
}

const auth = getAuth();

if (command === "set") {
  if (!roleArg) {
    console.error("❌ Role required when using 'set'");
    process.exit(1);
  }

  // Build claims dynamically
  const customClaims = { role: roleArg };
  if (classIdArg) {
    customClaims.classId = classIdArg;
  }

  auth.getUserByEmail(emailArg)
    .then(user => auth.setCustomUserClaims(user.uid, customClaims))
    .then(() => {
      console.log(`✅ Custom claims set for ${emailArg}:`, { role: roleArg, classId: classIdArg });
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error setting custom claims:', error);
      process.exit(1);
    });

} else if (command === "get") {
  auth.getUserByEmail(emailArg)
    .then(user => {
      console.log(`👤 User: ${user.email}`);
      console.log(`UID: ${user.uid}`);
      console.log("Custom Claims:", user.customClaims || {});
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fetching user:', error);
      process.exit(1);
    });

} else {
  console.error("❌ Unknown command. Use 'set' or 'get'.");
  process.exit(1);
}
