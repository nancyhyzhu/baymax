import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDPSizqRsolHOvnZGkzJfJfXd_tDpRG8zo",
  authDomain: "baymax-a7713.firebaseapp.com",
  projectId: "baymax-a7713",
  storageBucket: "baymax-a7713.firebasestorage.app",
  messagingSenderId: "513298298376",
  appId: "1:513298298376:web:cfdeabf53772ce8f0103bd",
  measurementId: "G-EPCK3QCPRP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
