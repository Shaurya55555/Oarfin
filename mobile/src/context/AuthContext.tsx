import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from '../lib/api';
import { makeId } from '../lib/format';
import { getSecure, KEYS, setSecure } from '../lib/storage';
import type { User } from '../types';

type AuthState = {
  ready: boolean;
  user: User | null;
  isGuest: boolean;
  signedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: Parameters<typeof api.register>[0]) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [token, rawUser, guest] = await Promise.all([
          getSecure(KEYS.token),
          getSecure(KEYS.user),
          getSecure(KEYS.guestId),
        ]);
        if (token && rawUser) {
          api.setApiIdentity(token, null);
          setUser(JSON.parse(rawUser));
        } else if (guest) {
          api.setApiIdentity(null, guest);
          setGuestId(guest);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // The server matches emails exactly, so keep the user's casing (website sign-ups may use capitals).
    const { token, user: u } = await api.login(email.trim(), password);
    await setSecure(KEYS.token, token);
    await setSecure(KEYS.user, JSON.stringify(u));
    await setSecure(KEYS.guestId, null);
    api.setApiIdentity(token, null);
    setGuestId(null);
    setUser(u);
  }, []);

  const signUp = useCallback(
    async (input: Parameters<typeof api.register>[0]) => {
      const email = input.email.trim();
      await api.register({ ...input, email });
      await signIn(email, input.password);
    },
    [signIn],
  );

  const continueAsGuest = useCallback(async () => {
    const id = `guest-${makeId()}`;
    await setSecure(KEYS.guestId, id);
    api.setApiIdentity(null, id);
    setGuestId(id);
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([setSecure(KEYS.token, null), setSecure(KEYS.user, null), setSecure(KEYS.guestId, null)]);
    api.setApiIdentity(null, null);
    setUser(null);
    setGuestId(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      user,
      isGuest: !user && !!guestId,
      signedIn: !!user || !!guestId,
      signIn,
      signUp,
      continueAsGuest,
      signOut,
    }),
    [ready, user, guestId, signIn, signUp, continueAsGuest, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
