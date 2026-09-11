"use client";

import React, { useState } from "react";

interface TickerLogoProps {
  ticker: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  xs: {
    container: "w-4 h-4 text-[8px] rounded-full",
    img: "w-4 h-4 p-[1px]",
  },
  sm: {
    container: "w-5 h-5 text-[9px] rounded-full",
    img: "w-5 h-5 p-[2px]",
  },
  md: {
    container: "w-7 h-7 text-xs rounded-lg",
    img: "w-7 h-7 p-1",
  },
  lg: {
    container: "w-10 h-10 text-sm rounded-xl",
    img: "w-10 h-10 p-1.5",
  },
  xl: {
    container: "w-14 h-14 text-xl rounded-2xl",
    img: "w-14 h-14 p-2",
  },
};

export default function TickerLogo({
  ticker,
  size = "sm",
  className = "",
}: TickerLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (!ticker) return null;

  const symbol = ticker.trim().toUpperCase();
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;
  const logoUrl = `https://assets.stockbit.com/logos/companies/${symbol}.png`;

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center font-black bg-gradient-to-br from-slate-700 to-indigo-900 text-white shadow-2xs shrink-0 select-none ${sizeConfig.container} ${className}`}
        title={symbol}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-white border border-slate-200/90 shadow-2xs overflow-hidden shrink-0 ${sizeConfig.container} ${className}`}
    >
      <img
        src={logoUrl}
        alt={`${symbol} logo`}
        loading="lazy"
        onError={() => setHasError(true)}
        className={`object-contain bg-white transition-opacity duration-200 ${sizeConfig.img}`}
      />
    </div>
  );
}
