import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "heras_demo_authed";
const VALID_PIN = "1234";

const normalisePin = (value) => (value || "").replace(/\D/g, "").trim();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") {
        setIsAuthenticated(true);
      }
    } catch (e) {
      // Ignore storage errors in non-browser environments
    }
  }, []);

  const login = (pin) => {
    const valid = normalisePin(pin) === VALID_PIN;
    if (valid) {
      setIsAuthenticated(true);
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch (e) {
        // Ignore storage errors
      }
      return { success: true };
    }
    return { success: false, error: "Incorrect PIN. Try 1234 for the demo." };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Ignore storage errors
    }
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated]
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

