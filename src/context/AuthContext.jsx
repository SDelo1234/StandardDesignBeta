import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { findByPin } from "../utils/pinStore";

const AuthContext = createContext(null);

const STORAGE_KEY = "heras_demo_authed";
const USER_KEY = "heras_current_user";

const normalisePin = (value) => (value || "").replace(/\D/g, "").trim();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") {
        const user = JSON.parse(window.localStorage.getItem(USER_KEY) || "null");
        setIsAuthenticated(true);
        setCurrentUser(user);
      }
    } catch (e) {
      // Ignore storage errors in non-browser environments
    }
  }, []);

  const login = (pin) => {
    const normalised = normalisePin(pin);
    const account = findByPin(normalised);

    if (account) {
      const user = { id: account.id, name: account.name, isAdmin: account.isAdmin };
      setIsAuthenticated(true);
      setCurrentUser(user);
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch (e) {
        // Ignore storage errors
      }
      return { success: true };
    }
    return { success: false, error: "Incorrect PIN." };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch (e) {
      // Ignore storage errors
    }
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      currentUser,
      isAdmin: currentUser?.isAdmin === true,
      login,
      logout,
    }),
    [isAuthenticated, currentUser]
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
