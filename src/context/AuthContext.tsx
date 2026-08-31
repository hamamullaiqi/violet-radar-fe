"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check local storage for existing session
    const storedToken = localStorage.getItem("violet_token");
    const storedUser = localStorage.getItem("violet_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      
      const { token: tokenData, user: userData } = res.data.data || res.data;
      
      localStorage.setItem("violet_token", tokenData);
      localStorage.setItem("violet_user", JSON.stringify(userData));
      
      setToken(tokenData);
      setUser(userData);
      
      router.push("/");
    } catch (e: any) {
      console.error("Login failed:", e);
      const msg = e.response?.data?.message || "Email atau password salah.";
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem("violet_token");
    localStorage.removeItem("violet_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
