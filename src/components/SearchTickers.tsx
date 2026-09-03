"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTickersMaster } from "@/hooks/useTickersMaster";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Search, ChevronRight, TrendingUp } from "lucide-react";

const SearchTickers = () => {
  const [open, setOpen] = useState<boolean>(false);
  const router = useRouter();
  const { data: tickers, isLoading } = useTickersMaster();

  // Support ⌘K and Ctrl+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelectTicker = (code: string) => {
    if (!code) return;
    setOpen(false);
    router.push(`/ticker/${code.toUpperCase()}`);
  };

  return (
    <>
      {/* Search Bar Trigger Button (Mobile Responsive) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-500 shadow-2xs backdrop-blur-sm transition-all hover:border-indigo-400 hover:bg-slate-50 w-auto sm:w-60 md:w-72"
        aria-label="Cari saham atau ticker"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="hidden sm:inline">Cari saham atau ticker...</span>
          <span className="sm:hidden font-medium">Cari...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-semibold text-slate-500 sm:flex">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Ketik kode emiten (cth: BBRI, BBCA, TLKM)..." />
        <CommandList className="max-h-[380px] p-2">
          {isLoading && (
            <div className="py-8 text-center text-xs sm:text-sm text-slate-400 font-medium">
              Memuat daftar saham...
            </div>
          )}

          <CommandEmpty className="py-8 text-center text-xs sm:text-sm text-slate-400">
            Saham tidak ditemukan.
          </CommandEmpty>

          <CommandGroup heading="Daftar Saham Terdaftar (Klik untuk Membuka)">
            {tickers &&
              tickers.map((ticker: any) => {
                const code = typeof ticker === "string" ? ticker : ticker?.code || ticker?.symbol || "";
                const name = typeof ticker === "object" ? ticker?.name : null;

                if (!code) return null;

                return (
                  <CommandItem
                    key={code}
                    value={code}
                    onSelect={() => handleSelectTicker(code)}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-indigo-50/70 aria-selected:bg-indigo-50/70 my-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs shadow-xs">
                        {code.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 tracking-wide">
                          {code.toUpperCase()}
                        </div>
                        {name && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                            {name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-indigo-600 font-semibold opacity-70 group-hover:opacity-100">
                      <span className="hidden sm:inline">Buka</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </CommandItem>
                );
              })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchTickers;