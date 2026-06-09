const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

admin.initializeApp({
  projectId: 'diceking-eeea2'
});

const db = admin.firestore();

async function run() {
  const email = 'inzamamulh753338@gmail.com';
  const snap = await db.collection('users').where('email', '==', email).get();
  if (snap.empty) {
    console.log(`User ${email} not found.`);
    return;
  }
  const docRef = snap.docs[0].ref;
  await docRef.update({ role: 'admin' });
  console.log(`Successfully made ${email} an Admin!`);
}

run().catch(console.error);
