const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const targetEmail = process.argv[2] || 'mrinzu636@gmail.com';

admin.initializeApp({
  projectId: 'diceking-eeea2'
});

const db = admin.firestore();

async function makeAdmin() {
  console.log(`Searching for user with email: "${targetEmail}"...`);

  const usersSnap = await db.collection('users').where('email', '==', targetEmail).get();
  if (!usersSnap.empty) {
    const docRef = usersSnap.docs[0].ref;
    await docRef.update({ role: 'admin' });
    console.log(`\n🎉 SUCCESS! Existing account "${targetEmail}" has been granted ADMIN role!`);
  } else {
    // Create new user profile document in Firestore
    const newRef = db.collection('users').doc();
    await newRef.set({
      uid: newRef.id,
      email: targetEmail,
      displayName: targetEmail.split('@')[0],
      role: 'admin',
      referralCode: 'DK' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const walletRef = db.collection('wallets').doc(newRef.id);
    await walletRef.set({
      uid: newRef.id,
      balance: 10000.0,
      wageringRequired: 0.0,
      totalDeposits: 10000.0,
      totalBets: 0.0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`\n🎉 SUCCESS! Created Admin profile & wallet for "${targetEmail}"!`);
  }
  process.exit(0);
}

makeAdmin().catch(err => {
  console.error("Error making admin:", err);
  process.exit(1);
});
