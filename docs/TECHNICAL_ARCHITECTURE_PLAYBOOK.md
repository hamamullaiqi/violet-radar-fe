# 🎨 Frontend Technical Architecture & UI/UX Playbook
> **Violet Radar Production Guide**  
> Panduan standar arsitektur UI/UX, tata letak dashboard finansial densitas tinggi, sistem glosarium komparatif, dan deployment Next.js yang dapat digunakan kembali pada proyek web app modern lainnya.

---

## 📑 Daftar Isi
1. [Layout Finansial Densitas Tinggi (Laptop & Ultrawide Responsive Engine)](#1-layout-finansial-densitas-tinggi-laptop--ultrawide-responsive-engine)
2. [Sistem Glosarium Komparatif Berpasangan (Shared Legend Modals)](#2-sistem-glosarium-komparatif-berpasangan-shared-legend-modals)
3. [Arsitektur Token Warna Dinamis (Semantic Badge Design System)](#3-arsitektur-token-warna-dinamis-semantic-badge-design-system)
4. [Konektivitas API Fleksibel & Dynamic Endpoint Switcher](#4-konektivitas-api-fleksibel--dynamic-endpoint-switcher)
5. [Docker Multi-Stage Build & Production Next.js Deployment](#5-docker-multi-stage-build--production-nextjs-deployment)

---

## 1. Layout Finansial Densitas Tinggi (Laptop & Ultrawide Responsive Engine)

### ⚠️ Masalah Umum pada Dashboard Data Saham/Finansial:
* Pada layar laptop standar (layar 13"-14", resolusi 1280px s/d 1440px), jika menggunakan `max-w-7xl` dengan `grid-cols-2`, kartu tabel menjadi sangat sempit (~580px).
* Kolom angka seperti harga (`Rp 5.025 / Rp 350`) atau persentase terputus/turun baris (*line break wrapping*) dan teks saling bertumpuk (*cramped overlap*).

### ✅ Solusi Reusable 3-Lapisan:
1. **Pelebaran Batas Maksimal Container (`max-w-[1680px]`):**
   ```tsx
   {/* main container fleksibel dengan margin horizontal */}
   <main className="flex-1 p-4 md:p-6 max-w-[1680px] mx-auto w-full space-y-6">
   ```
2. **Anti-Wrapping Mutlak pada Tabel (`whitespace-nowrap`):**
   ```tsx
   <Table className="text-xs w-full whitespace-nowrap">
     <TableHeader className="bg-slate-50">
       <TableRow className="hover:bg-transparent">
         <TableHead className="py-2.5 px-3">Ticker</TableHead>
         <TableHead className="text-right py-2.5 px-3">First / Last Price</TableHead>
         <TableHead className="text-right py-2.5 px-3">Chg (%)</TableHead>
       </TableRow>
     </TableHeader>
     {/* ... */}
   </Table>
   ```
3. **Scroll Horizontal Aman (`overflow-x-auto`):**
   Membungkus `<Table>` dengan `div.relative.overflow-x-auto` agar saat dibuka di layar kecil/mobile, pengguna tetap dapat menggeser tabel dengan mulus tanpa merusak kartu.

---

## 2. Sistem Glosarium Komparatif Berpasangan (Shared Legend Modals)

### 💡 Konsep Desain:
Daripada menaruh satu modal raksasa di pojok dashboard yang memuat seluruh definisi, atau membuat popup terpisah yang membingungkan:
* Pasangkan **Kartu Komparasi** (misal: *ARA vs ARB*, *Inflow vs Outflow*, *Gainers vs Losers*).
* Buat satu komponen dialog bersama (*Shared Legend Dialog*) yang dapat dipanggil dari ikon bantuan `( ? )` di kedua kartu.

### Contoh Pola Komponen Reusable:
```tsx
// components/dashboard/legends/ForeignFlowLegendDialog.tsx
import { HelpCircle, ArrowLeftRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function ForeignFlowLegendDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Panduan Komparasi Akumulasi vs Distribusi"
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-white border-slate-200 text-slate-900">
        <DialogHeader className="border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-blue-600" />
            <DialogTitle className="text-sm font-bold">Panduan: Foreign Inflow vs Outflow</DialogTitle>
          </div>
        </DialogHeader>
        {/* Konten penjelasan kedua sisi komparasi */}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 3. Arsitektur Token Warna Dinamis (Semantic Badge Design System)

Untuk membangun kebiasaan intuitif (*cognitive recognition*) bagi pengguna dashboard finansial, gunakan pemetaan token warna CSS yang konsisten antara tabel data dengan isi legenda:

```typescript
// Reusable Tier Badge Color Switcher
export const getGrowthTierBadge = (tier: string): string => {
  switch (tier) {
    case "SUPER_GROWTH":
      return "bg-emerald-600 text-white hover:bg-emerald-600";
    case "STRONG_GROWTH":
      return "bg-emerald-500 text-white hover:bg-emerald-500";
    case "MODERATE_GROWTH":
      return "bg-teal-500 text-white hover:bg-teal-500";
    case "SIDEWAYS":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "MODERATE_LOSS":
      return "bg-amber-600 text-white hover:bg-amber-600";
    case "HEAVY_LOSS":
      return "bg-rose-500 text-white hover:bg-rose-500";
    case "SEVERE_LOSS":
      return "bg-rose-700 text-white hover:bg-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};
```

---

## 4. Konektivitas API Fleksibel & Dynamic Endpoint Switcher

### 💡 Konsep:
Aplikasi frontend finansial sering berpindah antara server localhost saat dev, staging, atau backend cloud produksi. Berikan kemampuan penyimpanan konfigurasi endpoint backend dinamis ke `localStorage`:

```typescript
// lib/api.ts
import axios from 'axios';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('violet_radar_backend_url');
    if (savedUrl) return savedUrl;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
});

// Interceptor untuk menyisipkan token autentikasi JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('violet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

---

## 5. Docker Multi-Stage Build & Production Next.js Deployment

### File: `frontend/next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Wajib untuk image Docker minimalis
  reactStrictMode: true,
};

export default nextConfig;
```

### File: `frontend/Dockerfile`
```dockerfile
# -------------------------------------------------------------
# Stage 1: Dependencies Cache
# -------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# -------------------------------------------------------------
# Stage 2: Production Builder
# -------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . ./
RUN npm run build

# -------------------------------------------------------------
# Stage 3: Standalone Runner
# -------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Non-root user
USER node

COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 6. Pola Tabbed Data Fetching per Status & Legend Dialog

### 💡 Konsep:
Menghindari mengambil seluruh data sekaligus ke browser dengan memisahkan navigasi tab per status data (`ACTIVE`, `PENDING`, `HIT_TP1`, `HIT_TP2`, `HIT_SL`, `EXPIRED`, `ALL`) di mana setiap tab menembak endpoint yang terisolasi:

```tsx
// Reusable Tabbed Fetching Pattern
const [activeTab, setActiveTab] = useState<SignalTabStatus>("ACTIVE");
const [signals, setSignals] = useState<any[]>([]);
const [loading, setLoading] = useState<boolean>(false);

const fetchSignals = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    if (activeTab !== "ALL") params.append("status", activeTab);
    if (strategyFilter !== "ALL") params.append("strategy", strategyFilter);
    if (searchTicker.trim()) params.append("search", searchTicker.trim());

    const res = await api.get(`/api/signals?${params.toString()}`);
    setSignals(res.data?.data || []);
  } catch (err) {
    setSignals([]);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchSignals();
}, [activeTab, strategyFilter, searchTicker]);
```

