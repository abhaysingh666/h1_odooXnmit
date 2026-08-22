import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(user, token) {
  try {
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  } catch {
    // ignore quota / private-mode failures
  }
}

function clearSession() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  // Hydrate optimistically from storage so a refresh doesn't flash the login
  // screen, then confirm against /api/auth/me below.
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  /**
   * Verify the session against the server. The stored user is only a cache —
   * the httpOnly cookie is the real credential, and it can expire (JWT TTL
   * defaults to 1 hour) or be blocklisted in Redis by a logout elsewhere.
   */
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.me();
      setUser(data);
      persistSession(data);
      return data;
    } catch {
      setUser(null);
      clearSession();
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      await refreshUser();
      if (active) setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    const { data } = await authAPI.login(credentials);
    const { user: loggedIn, access_token: accessToken } = data;

    persistSession(loggedIn, accessToken);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // The cookie may already be gone or blocklisted; clearing locally is
      // still the right outcome.
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  /**
   * Changing the password also flips `is_first_login` to false server-side, so
   * the local user is patched to match and the first-login gate releases.
   */
  const changePassword = useCallback(async (payload) => {
    const { data } = await authAPI.changePassword(payload);
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, is_first_login: false, is_verified: true };
      persistSession(next);
      return next;
    });
    return data;
  }, []);

  const completeRegistration = useCallback(async (payload) => {
    const { data } = await authAPI.completeRegistration(payload);
    persistSession(data.user, data.access_token);
    setUser(data.user);
    return data;
  }, []);

  const bootstrapAdmin = useCallback(async () => {
    const { data } = await authAPI.bootstrapAdmin();
    persistSession(data.user, data.access_token);
    setUser(data.user);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
      changePassword,
      completeRegistration,
      bootstrapAdmin,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isEmployee: user?.role === 'employee',
      /** True while the user is still on their admin-issued temporary password. */
      mustChangePassword: !!user?.is_first_login,
      /** Where this user belongs after signing in. */
      homePath: user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard',
    }),
    [user, loading, login, logout, refreshUser, changePassword, completeRegistration, bootstrapAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
