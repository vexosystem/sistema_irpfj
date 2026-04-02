"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { syncOwnerUser, watchAuthState } from "@/lib/auth/auth-client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = watchAuthState((nextUser) => {
      if (nextUser) {
        void syncOwnerUser(nextUser);
      }
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
