// ─────────────────────────────────────────────────────────────
//  STEP 1: Create a free Firebase project at https://console.firebase.google.com
//  STEP 2: Add a Web App → copy your firebaseConfig values below
//  STEP 3: In Firebase Console → Firestore → Create database (Start in test mode)
//  STEP 4: Save this file and run npm start
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// 🔥 REPLACE THESE WITH YOUR OWN VALUES FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence so app works even if internet drops briefly
enableIndexedDbPersistence(db).catch(() => {});

export default app;
