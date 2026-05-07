import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAgTP4Z6hp6sDfScxC5SDLEJTtMLvHBRPg",
  authDomain: "emerald-app-da985.firebaseapp.com",
  projectId: "emerald-app-da985",
  storageBucket: "emerald-app-da985.firebasestorage.app",
  messagingSenderId: "799787181926",
  appId: "1:799787181926:web:473ab1dce9ea158f144aa7",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
