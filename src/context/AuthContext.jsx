import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { findByPin, getAccountById } from "../utils/pinStore";

const AuthContext = createContext(null);

const SESSION_KEY = "heras_session_user_id";

const toUser = (account) => ({ id: account.id, name: account.name, isAdmin: account.isAdmin === true });

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  // The session holds only the account id; name and admin rights always come
  // from the account store, so deleted or deactivated accounts are logged out.
  const restore = useCallback(async () => {
    try {
      const id = window.localStorage.getItem(SESSION_KEY);
      const account = id ? await getAccountById(id) : null;
      if (account && account.isActive) {
        setCurrentUser(toUser(account));
      } else {
        if (id) window.localStorage.removeItem(SESSION_KEY);
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    restore();
    const onStorage = () => restore();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [restore]);

  const login = useCallback(async (pin) => {
    const account = await findByPin(pin);
    if (!account) return { success: false, error: "Incorrect PIN." };
    setCurrentUser(toUser(account));
    try {
      window.localStorage.setItem(SESSION_KEY, account.id);
    } catch {
      // Ignore storage errors
    }
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const value = useMemo(
    () => ({
      ready,
      isAuthenticated: Boolean(currentUser),
      currentUser,
      isAdmin: currentUser?.isAdmin === true,
      login,
      logout,
      refresh: restore,
    }),
    [currentUser, login, logout, ready, restore],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
