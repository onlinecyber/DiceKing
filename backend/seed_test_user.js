const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
  projectId: 'diceking-eeea2'
});

const auth = admin.auth();
const db = admin.firestore();

async function createAccount(email, password, displayName, role, balance) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`User ${email} already exists in Auth Emulator.`);
  } catch (e) {
    userRecord = await auth.createUser({
      email,
      password,
      displayName
    });
    console.log(`Created Auth user: ${email} (UID: ${userRecord.uid})`);
  }

  const uid = userRecord.uid;
  const userRef = db.collection('users').doc(uid);
  const walletRef = db.collection('wallets').doc(uid);

  await userRef.set({
    uid,
    email,
    displayName,
    role,
    referralCode: 'DK' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    referredBy: '',
    referralEarnings: 0,
    referralStatus: 'none',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await walletRef.set({
    uid,
    balance: balance,
    wageringRequired: 0.0,
    totalDeposits: balance,
    totalBets: 0.0,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`Seeded profile and wallet for ${email} with balance ₹${balance}`);
}

async function seed() {
  console.log("Seeding test accounts into Firebase Emulators...");
  await createAccount('player@diceking.com', 'password123', 'Demo Player', 'user', 1000.0);
  await createAccount('admin@diceking.com', 'password123', 'System Admin', 'admin', 10000.0);
  console.log("\n🎉 Seeding complete! You can now log in immediately with:");
  console.log("1. Player Login -> Email: player@diceking.com | Password: password123");
  console.log("2. Admin Login  -> Email: admin@diceking.com  | Password: password123");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
