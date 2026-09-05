"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  PowerOff,
  Power,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { user: currentUser, token, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Notifications / Alert message
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form States
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "ADMIN" | "USER",
    isActive: true
  });
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto clear feedback after 4s
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/users");
      const list = res.data.data || res.data || [];
      setUsers(list);
    } catch (err: any) {
      console.error("Gagal mengambil daftar pengguna:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Gagal memuat data pengguna dari server."
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push("/login");
      } else if (currentUser.role !== "ADMIN") {
        // Bukan admin, jangan izinkan
      } else {
        fetchUsers();
      }
    }
  }, [authLoading, currentUser, router, fetchUsers]);

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setFeedback({ type: "error", message: "Harap isi semua kolom wajib." });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/api/users", formData);
      setFeedback({
        type: "success",
        message: res.data.message || "Pengguna baru berhasil ditambahkan."
      });
      setIsAddOpen(false);
      setFormData({ name: "", email: "", password: "", role: "USER", isActive: true });
      fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Gagal membuat pengguna baru."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      const res = await api.put(`/api/users/${selectedUser._id}`, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive
      });
      setFeedback({
        type: "success",
        message: res.data.message || "Data pengguna berhasil diperbarui."
      });
      setIsEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Gagal memperbarui data pengguna."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (targetUser: ManagedUser) => {
    if (targetUser._id === currentUser?.id) {
      setFeedback({ type: "error", message: "Anda tidak dapat menonaktifkan akun Anda sendiri." });
      return;
    }

    try {
      const res = await api.patch(`/api/users/${targetUser._id}/status`);
      setFeedback({
        type: "success",
        message: res.data.message || "Status pengguna berhasil diubah."
      });
      fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Gagal mengubah status pengguna."
      });
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword || newPassword.length < 6) {
      setFeedback({ type: "error", message: "Password minimal 6 karakter." });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/api/users/${selectedUser._id}/reset-password`, {
        password: newPassword
      });
      setFeedback({
        type: "success",
        message: res.data.message || `Password untuk ${selectedUser.name} berhasil direset.`
      });
      setIsResetPassOpen(false);
      setNewPassword("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Gagal mereset kata sandi."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (selectedUser._id === currentUser?.id) {
      setFeedback({ type: "error", message: "Anda tidak dapat menghapus akun Anda sendiri." });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.delete(`/api/users/${selectedUser._id}`);
      setFeedback({
        type: "success",
        message: res.data.message || "Pengguna berhasil dihapus secara permanen."
      });
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Gagal menghapus pengguna."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (target: ManagedUser) => {
    setSelectedUser(target);
    setFormData({
      name: target.name,
      email: target.email,
      password: "",
      role: target.role,
      isActive: target.isActive
    });
    setIsEditOpen(true);
  };

  // Open Reset Pass Modal
  const openResetPassModal = (target: ManagedUser) => {
    setSelectedUser(target);
    setNewPassword("");
    setIsResetPassOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (target: ManagedUser) => {
    setSelectedUser(target);
    setIsDeleteOpen(true);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.isActive) ||
        (statusFilter === "INACTIVE" && !u.isActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const standardUsers = users.filter((u) => u.role === "USER").length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = total - active;

    return { total, admins, standardUsers, active, inactive };
  }, [users]);

  // If role is not admin
  if (!authLoading && currentUser && currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 shadow-lg text-center p-6 bg-white">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-slate-600 mb-6">
            Halaman Manajemen Pengguna hanya dapat diakses oleh akun dengan hak akses <strong>ADMIN</strong>.
          </p>
          <Button onClick={() => router.push("/")} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* HEADER NAVBAR */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  Manajemen Pengguna
                </h1>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                  RBAC Admin
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Kelola hak akses akun, status lisensi, dan kredensial sistem VioletRadar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
              className="text-slate-600 border-slate-200 hover:bg-slate-100 text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setFormData({ name: "", email: "", password: "", role: "USER", isActive: true });
                setIsAddOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Pengguna</span>
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between text-sm shadow-xs animate-in fade-in duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold text-xs sm:text-sm">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* METRIC STATS CARDS */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          <Card className="border-slate-200 shadow-2xs bg-white">
            <CardHeader className="pb-1 pt-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500">Total Pengguna</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-black text-slate-900">{stats.total}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Akun terdaftar dalam database</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs bg-white">
            <CardHeader className="pb-1 pt-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500">Administrator</CardTitle>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-black text-amber-600">{stats.admins}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Akses penuh sistem & job</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs bg-white">
            <CardHeader className="pb-1 pt-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500">Akun Aktif</CardTitle>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Dapat login & pantau radar</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs bg-white">
            <CardHeader className="pb-1 pt-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500">Akun Suspended</CardTitle>
              <PowerOff className="w-4 h-4 text-rose-500" />
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
              <div className="text-2xl font-black text-rose-600">{stats.inactive}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Akses masuk dinonaktifkan</p>
            </CardContent>
          </Card>
        </section>

        {/* SEARCH, FILTER & DATA TABLE */}
        <Card className="border-slate-200 shadow-2xs bg-white overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama atau email pengguna..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50/70 border-slate-200 text-xs h-9"
                />
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span>Role:</span>
                  <Select
                    value={roleFilter}
                    onValueChange={(val: any) => setRoleFilter(val)}
                  >
                    <SelectTrigger className="w-[110px] h-9 text-xs bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Role</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                      <SelectItem value="USER">USER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span>Status:</span>
                  <Select
                    value={statusFilter}
                    onValueChange={(val: any) => setStatusFilter(val)}
                  >
                    <SelectTrigger className="w-[120px] h-9 text-xs bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Status</SelectItem>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="text-xs font-bold text-slate-700 py-3 pl-4 sm:pl-6">Pengguna</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-3">Role</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-3">Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-3">Tanggal Dibuat</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 py-3 text-right pr-4 sm:pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-36 text-center text-slate-400 text-xs">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                        Memuat data pengguna...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-36 text-center text-slate-400 text-xs">
                        Tidak ada pengguna yang cocok dengan kriteria pencarian.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u._id === currentUser?.id;
                      const formattedDate = u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })
                        : "-";

                      return (
                        <TableRow key={u._id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                          {/* USER INFO */}
                          <TableCell className="py-3.5 pl-4 sm:pl-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 ${
                                  u.role === "ADMIN"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}
                              >
                                {u.name.slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                    {u.name}
                                  </span>
                                  {isSelf && (
                                    <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[9px] py-0 px-1.5 font-bold">
                                      Akun Anda
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                  <Mail className="w-3 h-3" />
                                  <span className="font-mono">{u.email}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* ROLE */}
                          <TableCell className="py-3.5">
                            {u.role === "ADMIN" ? (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold gap-1">
                                <Shield className="w-3 h-3" /> ADMIN
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                                USER
                              </Badge>
                            )}
                          </TableCell>

                          {/* STATUS */}
                          <TableCell className="py-3.5">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Suspended
                              </span>
                            )}
                          </TableCell>

                          {/* REGISTERED DATE */}
                          <TableCell className="py-3.5 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formattedDate}</span>
                            </div>
                          </TableCell>

                          {/* ACTIONS */}
                          <TableCell className="py-3.5 text-right pr-4 sm:pr-6">
                            <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                              {/* Edit Profile / Role */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(u)}
                                title="Edit Pengguna"
                                className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>

                              {/* Reset Password */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openResetPassModal(u)}
                                title="Reset Kata Sandi"
                                className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </Button>

                              {/* Toggle Status (Active / Suspended) */}
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isSelf}
                                onClick={() => handleToggleStatus(u)}
                                title={isSelf ? "Tidak dapat menonaktifkan akun sendiri" : u.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                                className={`h-8 w-8 rounded-md ${
                                  isSelf
                                    ? "text-slate-300 cursor-not-allowed"
                                    : u.isActive
                                    ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                }`}
                              >
                                {u.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                              </Button>

                              {/* Delete Permanently */}
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isSelf}
                                onClick={() => openDeleteModal(u)}
                                title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus Pengguna"}
                                className={`h-8 w-8 rounded-md ${
                                  isSelf
                                    ? "text-slate-300 cursor-not-allowed"
                                    : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* MODAL 1: TAMBAH PENGGUNA BARU */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-white border-slate-200 sm:max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <UserPlus className="w-4 h-4 text-blue-600" /> Tambah Pengguna Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Buat akun pengguna baru dengan hak akses dan peran yang sesuai.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Lengkap *</label>
                <Input
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Address *</label>
                <Input
                  required
                  type="email"
                  placeholder="budi@violet-radar.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Kata Sandi Awal *</label>
                <Input
                  required
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Hak Akses (Role)</label>
                  <Select
                    value={formData.role}
                    onValueChange={(val: any) => setFormData({ ...formData, role: val })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER (Standar)</SelectItem>
                      <SelectItem value="ADMIN">ADMIN (Full Control)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Status Awal</label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(val) => setFormData({ ...formData, isActive: val === "active" })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif Langsung</SelectItem>
                      <SelectItem value="inactive">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                {submitting ? "Menyimpan..." : "Buat Pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDIT PENGGUNA */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white border-slate-200 sm:max-w-md">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Edit2 className="w-4 h-4 text-blue-600" /> Perbarui Data Pengguna
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Ubah informasi profil dan peran akses pengguna terpilih.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Lengkap</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Address</label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Hak Akses (Role)</label>
                  <Select
                    value={formData.role}
                    disabled={selectedUser?._id === currentUser?.id}
                    onValueChange={(val: any) => setFormData({ ...formData, role: val })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER (Standar)</SelectItem>
                      <SelectItem value="ADMIN">ADMIN (Full Control)</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedUser?._id === currentUser?.id && (
                    <span className="text-[10px] text-amber-600">Tidak dapat mengubah role akun sendiri</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Status Akun</label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    disabled={selectedUser?._id === currentUser?.id}
                    onValueChange={(val) => setFormData({ ...formData, isActive: val === "active" })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: RESET KATA SANDI */}
      <Dialog open={isResetPassOpen} onOpenChange={setIsResetPassOpen}>
        <DialogContent className="bg-white border-slate-200 sm:max-w-md">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <KeyRound className="w-4 h-4 text-amber-600" /> Reset Kata Sandi Pengguna
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Tetapkan kata sandi baru untuk <strong>{selectedUser?.name}</strong> ({selectedUser?.email}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Kata Sandi Baru *</label>
                <Input
                  required
                  type="password"
                  placeholder="Masukkan password baru (min. 6 karakter)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Pengguna akan dapat langsung masuk menggunakan kata sandi baru ini.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsResetPassOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                {submitting ? "Mereset..." : "Simpan Password Baru"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: KONFIRMASI HAPUS PENGGUNA */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white border-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600">
              <Trash2 className="w-4 h-4 text-rose-600" /> Hapus Pengguna
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tindakan ini tidak dapat dibatalkan. Akun pengguna akan dihapus permanen dari sistem.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 text-xs text-slate-700">
            Apakah Anda yakin ingin menghapus akun pengguna:
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md mt-2 font-mono text-[11px] space-y-1">
              <div><strong>Nama:</strong> {selectedUser?.name}</div>
              <div><strong>Email:</strong> {selectedUser?.email}</div>
              <div><strong>Role:</strong> {selectedUser?.role}</div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={handleDeleteUser}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              {submitting ? "Menghapus..." : "Ya, Hapus Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
