import React, { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("tms_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("tms_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem("tms_token", t);
    localStorage.setItem("tms_user", JSON.stringify(u));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("tms_token");
    localStorage.removeItem("tms_user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
