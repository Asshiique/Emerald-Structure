import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAgTP4Z6hp6sDfScxC5SDLEJTtMlvHBRPg",
  authDomain: "emerald-app-da985.firebaseapp.com",
  projectId: "emerald-app-da985",
  storageBucket: "emerald-app-da985.firebasestorage.app",
  messagingSenderId: "799787181926",
  appId: "1:799787181926:web:473ab1dce9ea158f144aa7",
  measurementId: "G-JZR8Y3JPYS",
};

// Initialize the default Firebase app only once.
// Hot-reloads in Expo will hit this module multiple times — getApps() guards it.
const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApps()[0];

// On first init, use React Native AsyncStorage persistence so the auth token
// survives app restarts and background/foreground cycles.
// On subsequent module evaluations (fast-refresh), getAuth() returns the
// already-initialized instance without re-configuring persistence.
export const auth = isFirstInit
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export const db = getFirestore(app);
export { app };
