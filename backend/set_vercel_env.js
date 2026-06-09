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

const targets = ['production', 'preview', 'development'];

for (const [key, val] of Object.entries(envs)) {
  for (const target of targets) {
    try {
      console.log(`Setting ${key} for ${target}...`);
      const cmd = `npx vercel env add ${key} ${target} --value "${val}" --yes`;
      execSync(cmd, { stdio: 'inherit', cwd: 'c:/Users/inzam/OneDrive/Desktop/DiceKing' });
    } catch (error) {
      console.error(`Failed to set ${key} for ${target}:`, error.message);
    }
  }
}
console.log("All environment variables configuration complete!");
