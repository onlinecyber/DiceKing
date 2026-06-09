const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

admin.initializeApp({
  projectId: 'diceking-eeea2'
});

const db = admin.firestore();

async function run() {
  const snap = await db.collection('users').get();
  console.log(`Total users in emulator: ${snap.size}`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`UID: ${data.uid}, Email: ${data.email}, Role: ${data.role}`);
  });
}

run().catch(console.error);
