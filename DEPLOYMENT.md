# Dice King - Firebase Deployment Guide

This guide details how to run Dice King locally using the **Firebase Emulator Suite** and deploy it to production on **Firebase Hosting, Firestore, and Cloud Functions**.

---

## Prerequisites

Before starting, ensure you have:
1. A [Firebase Account](https://firebase.google.com/) and a new Firebase Project created in the console.
2. [Node.js v18+](https://nodejs.org/) installed.
3. Firebase CLI installed globally:
   ```bash
   npm install -g firebase-tools
   ```

---

## 1. Firebase Project Setup

1. **Log in** to Firebase in your terminal:
   ```bash
   firebase login
   ```
2. **Associate your project** (replace `diceking-game` with your project ID):
   ```bash
   firebase use --add diceking-game
   ```
3. Enable services in the [Firebase Console](https://console.firebase.google.com/):
   - **Authentication**: Enable **Email/Password** sign-in.
   - **Firestore Database**: Create database in Native Mode.
   - **Cloud Functions**: Upgrade your Firebase project to the **Blaze (pay-as-you-go) Plan** (required by Firebase to deploy Node.js 18+ functions; includes a generous free tier of 2M invocations/month).
   - **Hosting**: Enable hosting.

---

## 2. Environment Variables (.env)

Create a `.env` file in the project root to link the React app to your specific Firebase Project credentials:

```properties
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Toggle to 'true' to connect to local emulator suite instead of production
VITE_USE_FIREBASE_EMULATOR=false
```

---

## 3. Running Locally with Firebase Emulators

The Firebase Emulator Suite lets you run Auth, Firestore, and Cloud Functions completely offline on your computer.

1. **Install Cloud Functions Dependencies**:
   ```bash
   cd functions
   npm install
   cd ..
   ```
2. **Initialize Emulator Suite** (if not already set up in config):
   ```bash
   firebase init emulators
   # Select: Authentication, Firestore, Functions
   ```
3. **Start the Emulators**:
   ```bash
   firebase emulators:start
   ```
4. **Run React Client**:
   Change `VITE_USE_FIREBASE_EMULATOR=true` in your `.env` file, and run:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173`. Open `http://localhost:4000` to view the Firebase Emulator Suite GUI where you can inspect database writes, trigger functions, and inspect wallets!

---

## 4. Production Deployment

When you are ready to launch your application:

1. **Build the React Production Bundle**:
   ```bash
   npm run build
   ```
   This compiles all React components, CSS, and assets into the `/dist` folder.

2. **Deploy to Firebase**:
   You can deploy everything with a single command:
   ```bash
   firebase deploy
   ```
   Or deploy components individually:
   - **Deploy Security Rules & Indexes**:
     ```bash
     firebase deploy --only firestore
     ```
   - **Deploy Cloud Functions**:
     ```bash
     firebase deploy --only functions
     ```
   - **Deploy React Website**:
     ```bash
     firebase deploy --only hosting
     ```

Once deployment completes, the CLI will output your live URL (e.g. `https://your-project-id.web.app`).

---

## 5. Security Rules Verification

The deployment automatically provisions `/firestore.rules` which protects user data:
- **Wallets** and **Bets** are writeable **only** by the secure Cloud Functions backend.
- Users can **only** inspect their own transactions, deposits, and profile records.
- Admins can query all pending withdrawal requests for settlement.
