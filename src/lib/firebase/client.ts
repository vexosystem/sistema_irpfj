import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { Functions, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

const isBrowser = typeof window !== "undefined";

export const firebaseApp = isBrowser ? getFirebaseApp() : (null as unknown as FirebaseApp);
export const auth = isBrowser ? getAuth(firebaseApp) : (null as unknown as Auth);
export const db = isBrowser ? getFirestore(firebaseApp) : (null as unknown as Firestore);
export const functions = isBrowser
  ? getFunctions(firebaseApp, "southamerica-east1")
  : (null as unknown as Functions);
