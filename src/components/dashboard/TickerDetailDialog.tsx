"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import TickerLogo from "@/components/ui/TickerLogo";

interface TickerDetailDialogProps {
  ticker: string | null;
  className?: string;
  showIcon?: boolean;
  showLogo?: boolean;
  logoSize?: "xs" | "sm" | "md";
}

/**
 * TickerDetailDialog - Navigates directly to the dedicated /ticker/[symbol] page
 * Maintained with the same name for drop-in backward compatibility across all dashboard cards.
 */
export default function TickerDetailDialog({
  ticker,
  className = "",
  showIcon = true,
  showLogo = true,
  logoSize = "sm",
}: TickerDetailDialogProps) {
  if (!ticker) return null;

  const symbol = ticker.toUpperCase();

  return (
    <Link
      href={`/ticker/${symbol}`}
      className={`font-bold text-slate-900 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5 group hover:underline ${className}`}
      title={`Buka analisis komprehensif & grafik ${symbol}`}
    >
      {showLogo && <TickerLogo ticker={symbol} size={logoSize} />}
      <span>{symbol}</span>
      {showIcon && (
        <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
      )}
    </Link>
  );
}
