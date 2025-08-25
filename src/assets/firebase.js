// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
 import { getAnalytics } from "firebase/analytics";
  import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkuZxH-kKG93PZd_hbJbzq8fDZZS8oaQQ",
  authDomain: "bridge-docente.firebaseapp.com",
  projectId: "bridge-docente",
  storageBucket: "bridge-docente.firebasestorage.app",
  messagingSenderId: "722845026686",
  appId: "1:722845026686:web:f9ce7cc7ea617e35bacb2f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth=getAuth(app);

export default app;