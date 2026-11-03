import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from '../lib/api';
import type { Friend } from '../types';
import { useAuth } from './AuthContext';

type FriendsState = {
  friends: Friend[];
  pending: Friend[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  sendRequest: (email: string) => Promise<void>;
  respond: (requestId: string, accept: boolean) => Promise<void>;
  remove: (friendshipId: string) => Promise<void>;
};

const FriendsContext = createContext<FriendsState | null>(null);

const FRIENDS_REFRESH_MS = 2 * 60 * 1000;

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [accepted, waiting] = await Promise.all([api.fetchFriends('accepted'), api.fetchFriends('pending')]);
      setFriends(accepted || []);
      setPending(waiting || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not load friends.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, FRIENDS_REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [user, refresh]);

  const sendRequest = useCallback(
    async (email: string) => {
      await api.sendFriendRequest(email.trim().toLowerCase());
      await refresh();
    },
    [refresh],
  );

  const respond = useCallback(
    async (requestId: string, accept: boolean) => {
      await api.respondToFriendRequest(requestId, accept);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (friendshipId: string) => {
      await api.removeFriend(friendshipId);
      setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
      setPending((prev) => prev.filter((f) => f.id !== friendshipId));
    },
    [],
  );

  // Hide the previous account's list immediately after sign-out.
  const value = useMemo(
    () => ({
      friends: user ? friends : [],
      pending: user ? pending : [],
      loading,
      error: user ? error : null,
      refresh,
      sendRequest,
      respond,
      remove,
    }),
    [user, friends, pending, loading, error, refresh, sendRequest, respond, remove],
  );
  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used inside FriendsProvider');
  return ctx;
}
