import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

// Create a context — this lets any component in the app read auth state
// without having to pass props down through every level
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage so login persists on page refresh
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // On app start, verify the stored token is still valid
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      api.get("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => logout()); // Token expired — clear everything
    }
  }, []);

  const register = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/register", { username, email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — components call useAuth() instead of useContext(AuthContext)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};