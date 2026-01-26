import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiLogin, apiMe } from '../services/apiClient';
import { clearTokens, getAccessToken, setTokens } from '../services/tokenStorage';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return null;
    }

    const me = await apiMe();
    setUser(me);
    return me;
  }, []);

  const login = useCallback(async ({ username, password }) => {
    const tokens = await apiLogin(username, password);
    setTokens(tokens);
    await refreshMe();
  }, [refreshMe]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshMe]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshMe,
    }),
    [user, loading, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
