import { useEffect, useState } from "react";
import api from "../services/api";
import AuthContext from "./AuthContext";

const readStoredUser = (value) => {
  try {
    const user = JSON.parse(value || "null");
    return user && typeof user === "object" ? user : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (!localStorage.getItem("token")) return null;
    return readStoredUser(localStorage.getItem("user"));
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const clearUser = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    };

    const handleStorage = (event) => {
      if (event.key === "user") {
        setUser(readStoredUser(event.newValue));
      }
      if (event.key === "token" && !event.newValue) {
        setUser(null);
      }
    };

    window.addEventListener("auth:unauthorized", clearUser);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("auth:unauthorized", clearUser);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.error?.message ||
          "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      const { token, user } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.error?.message ||
          "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};