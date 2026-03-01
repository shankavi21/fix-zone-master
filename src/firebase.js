import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB06kWuBogbkYYi20KbMZDV20PbmQ2u6u8",
  authDomain: "fixzone-927de.firebaseapp.com",
  projectId: "fixzone-927de",
  storageBucket: "fixzone-927de.firebasestorage.app",
  messagingSenderId: "287593835554",
  appId: "1:287593835554:web:beacc5a864a9c812b6ae7b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Safe Analytics initialization
export let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(err => console.error("Analytics not supported:", err));
