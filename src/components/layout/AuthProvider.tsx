"use client";

import { createContext, ReactNode, useEffect, useMemo, useState } from "react";
import { User } from "firebase/auth";
import { syncOwnerUser, watchAuthState } from "@/lib/auth/auth-client";

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isOwnerReady: boolean;
  error: string | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnerReady, setIsOwnerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (nextUser) => {
      setLoading(true);
      setError(null);

      if (!nextUser) {
        setUser(null);
        setIsOwnerReady(false);
        setLoading(false);
        return;
      }

      setUser(nextUser);

      try {
        await syncOwnerUser(nextUser);
        setIsOwnerReady(true);
      } catch (syncError) {
        setIsOwnerReady(false);
        setError(syncError instanceof Error ? syncError.message : "Falha ao sincronizar o owner.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, isOwnerReady, error }),
    [error, isOwnerReady, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
