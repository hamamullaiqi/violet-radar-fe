"use client"

import { useState } from "react"
import { useTickersMaster } from "@/hooks/useTickersMaster"
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command"
import { Search } from "lucide-react"
import TickerDetailDialog from "./dashboard/TickerDetailDialog"

const SearchTickers = () => {
    const [open, setOpen] = useState<boolean>(false)

    const { data: tickers, isLoading } = useTickersMaster()


    return (
        <>
            {/* Search Bar Trigger Button yang Modern */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full max-w-sm items-center justify-between rounded-xl border border-input/60 bg-background/50 px-3.5 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-accent/40"
            >
                <div className="flex items-center gap-2.5">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>Cari saham atau ticker...</span>
                </div>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* Command Dialog (Tanpa wrapper <Command> ganda) */}
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Ketik kode emiten (cth: BBRI, ASII)..." />
                <CommandList className="max-h-[340px] p-2">
                    {isLoading && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Memuat data ticker...
                        </div>
                    )}

                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                        Saham tidak ditemukan.
                    </CommandEmpty>

                    <CommandGroup heading="Daftar Saham Terdaftar">
                        {tickers &&
                            tickers.map((ticker: any) => {
                                const code = typeof ticker === "string" ? ticker : ticker?.code || ticker?.symbol || ""
                                const name = typeof ticker === "object" ? ticker?.name : null

                                return (
                                    <CommandItem
                                        key={code}
                                        value={code}
                                        className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-accent aria-selected:bg-accent"
                                    >
                                        <div
                                            className="flex items-center gap-3"

                                        >
                                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-md">
                                                {code?.slice(0, 2)}
                                            </div>
                                            {/* Avatar / Badge Ticker */}
                                            <TickerDetailDialog
                                                ticker={code}
                                            />
                                        </div>
                                    </CommandItem>
                                )
                            })}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>


        </>
    )
}

export default SearchTickers