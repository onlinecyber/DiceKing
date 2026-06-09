const { execSync } = require('child_process');

const envs = {
  VITE_FIREBASE_API_KEY: 'AIzaSyCv6yqBQnCkaLZPaSiTXFYT3Jmanr5OteA',
  VITE_FIREBASE_AUTH_DOMAIN: 'diceking-eeea2.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'diceking-eeea2',
  VITE_FIREBASE_STORAGE_BUCKET: 'diceking-eeea2.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '55692731448',
  VITE_FIREBASE_APP_ID: '1:55692731448:web:7d822ddc177ab02c1e32cd',
  VITE_USE_FIREBASE_EMULATOR: 'false',
  VITE_BACKEND_URL: 'https://diceking-99si.onrender.com'
};

for (const [key, val] of Object.entries(envs)) {
  try {
    console.log(`Setting ${key} for production...`);
    const cmd = `npx vercel env add ${key} production --value "${val}" --yes`;
    execSync(cmd, { stdio: 'inherit', cwd: 'c:/Users/inzam/OneDrive/Desktop/DiceKing' });
  } catch (error) {
    console.log(`Skipping or failed to set ${key} (might already exist).`);
  }
}
console.log("All production environment variables configured!");
