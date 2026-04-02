import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export type OwnerProfile = {
  name: string;
  email: string;
  role: "owner";
  isActive: true;
};

function getOwnerProfilePayload(user: User): OwnerProfile {
  return {
    name: user.displayName ?? user.email?.split("@")[0] ?? "Owner",
    email: user.email ?? "",
    role: "owner",
    isActive: true,
  };
}

async function waitForOwnerDocument(userRef: ReturnType<typeof doc>, expectedEmail: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const snapshot = await getDocFromServer(userRef);

    if (
      snapshot.exists() &&
      snapshot.get("role") === "owner" &&
      snapshot.get("isActive") === true &&
      snapshot.get("email") === expectedEmail
    ) {
      return;
    }
  }

  throw new Error("Nao foi possivel inicializar o perfil do owner.");
}

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOutUser() {
  return signOut(auth);
}

export function watchAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function syncOwnerUser(user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const baseProfile = getOwnerProfilePayload(user);

  try {
    const snapshotBeforeWrite = await getDocFromServer(userRef);

    if (!snapshotBeforeWrite.exists()) {
      await setDoc(userRef, {
        ...baseProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        userRef,
        {
          ...baseProfile,
          createdAt: snapshotBeforeWrite.get("createdAt") ?? serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    await waitForOwnerDocument(userRef, baseProfile.email);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Falha ao sincronizar o owner.");
  }
}
