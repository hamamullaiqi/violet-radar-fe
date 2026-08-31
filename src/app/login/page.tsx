"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const { user, login, error, clearError, loading } = useAuth();
  const [email, setEmail] = useState("admin@violet-radar.com");
  const [password, setPassword] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      router.push("/");
    }
    clearError();
  }, [user, router, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      // Handled by AuthContext error state
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Memuat sesi...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            VIOLETRADAR COCKPIT
          </h1>
          <p className="text-sm text-slate-500 mt-1">Sistem Pemantau Sinyal & Portofolio</p>
        </div>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Masuk Akun</CardTitle>
            <CardDescription className="text-xs">
              Masukkan email dan password administrator Anda.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-900">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertTitle className="text-xs font-bold">Error Login</AlertTitle>
                  <AlertDescription className="text-[11px]">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@violet-radar.com"
                  required
                  className="border-slate-200 bg-slate-50 text-slate-900 focus-visible:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="border-slate-200 bg-slate-50 text-slate-900 focus-visible:ring-blue-600"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                {submitting ? "Memproses..." : "Masuk"}
              </Button>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <ShieldAlert className="h-3 w-3" />
                <span>Hanya untuk akses administrator internal.</span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
