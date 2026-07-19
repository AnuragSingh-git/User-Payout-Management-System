import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("payout.token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("payout.user");
    return raw ? JSON.parse(raw) : null;
  });

  const persist = (t, u) => {
    setToken(t);
    setUser(u);
    if (t) localStorage.setItem("payout.token", t);
    else localStorage.removeItem("payout.token");
    if (u) localStorage.setItem("payout.user", JSON.stringify(u));
    else localStorage.removeItem("payout.user");
  };

  const login = useCallback(async (userId, password) => {
    const { data } = await api.post("/auth/login", { userId, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ userId, name, password, role }) => {
    const { data } = await api.post("/auth/register", { userId, name, password, role });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => persist(null, null), []);

  // If any API call comes back 401 (expired/invalid token), drop the
  // stale session so the user is routed back to /login.
  useEffect(() => {
    const handler = () => persist(null, null);
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
