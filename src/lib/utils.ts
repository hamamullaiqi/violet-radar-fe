import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(val: number, includeSign: boolean = false): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  const sign = val >= 0 ? (includeSign ? '+' : '') : '-';
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000_000).toFixed(1)} T`;
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)} M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)} Jt`;
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}
