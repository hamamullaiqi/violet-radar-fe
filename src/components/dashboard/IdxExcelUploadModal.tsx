"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  Info,
  RefreshCw,
  X,
  FileUp,
  TrendingUp,
  Globe
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface IdxExcelUploadModalProps {
  triggerButton?: React.ReactNode;
  onSuccess?: () => void;
}

export default function IdxExcelUploadModal({ triggerButton, onSuccess }: IdxExcelUploadModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [totalParsedRows, setTotalParsedRows] = useState<number>(0);
  const [hasForeignData, setHasForeignData] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-detect date from filename if available (e.g. Stock_Summary_20260929.xlsx or Ringkasan_Saham_2026-09-29.xlsx)
  const extractDateFromFilename = (fileName: string): string | null => {
    // Check YYYY-MM-DD or YYYYMMDD
    const matchHyphen = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (matchHyphen) return `${matchHyphen[1]}-${matchHyphen[2]}-${matchHyphen[3]}`;

    const matchCompact = fileName.match(/(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
    if (matchCompact) return `${matchCompact[1]}-${matchCompact[2]}-${matchCompact[3]}`;

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setUploadResult(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Try to auto-set date from filename
    const detectedDate = extractDateFromFilename(selectedFile.name);
    if (detectedDate) {
      setTargetDate(detectedDate);
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!json || json.length === 0) {
          setErrorMsg("File Excel tidak memiliki data baris.");
          return;
        }

        setTotalParsedRows(json.length);

        // Map first 5 sample rows flexible
        const sample = json.slice(0, 5).map((r) => {
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              if (r[k] !== undefined && r[k] !== "") return r[k];
              const matchKey = Object.keys(r).find(
                (orig) => orig.toLowerCase().replace(/[\s_\-\(\)]/g, "") === k.toLowerCase().replace(/[\s_\-\(\)]/g, "")
              );
              if (matchKey && r[matchKey] !== undefined && r[matchKey] !== "") return r[matchKey];
            }
            return undefined;
          };

          const fBuy = Number(getVal("ForeignBuy", "Foreign Buy", "Asing Beli", "Buy (Foreign)") || 0);
          const fSell = Number(getVal("ForeignSell", "Foreign Sell", "Asing Jual", "Sell (Foreign)") || 0);
          const fNet = Number(getVal("ForeignNet", "Foreign Net", "Net Foreign", "Net Asing") || fBuy - fSell);

          return {
            ticker: getVal("StockCode", "Stock Code", "Kode", "Kode Saham", "Code", "Ticker", "Symbol") || "-",
            name: getVal("StockName", "Stock Name", "Nama", "Nama Saham", "Company") || "",
            previous: Number(getVal("Previous", "Prev", "Previous Price", "Harga Kemarin") || 0),
            close: Number(getVal("Close", "ClosePrice", "Close Price", "Last", "Penutupan") || 0),
            volume: Number(getVal("Volume", "Shares", "Volume (Shares)", "Vol") || 0),
            foreignBuy: fBuy,
            foreignSell: fSell,
            foreignNet: fNet
          };
        });

        // Check if file contains foreign columns
        const hasForeign = json.some((r) => {
          return Object.keys(r).some((k) => /foreign|asing/i.test(k));
        });
        setHasForeignData(hasForeign);
        setPreviewRows(sample);

        // Store parsed JSON rows for direct lightweight transmission
        setParsedJsonRecords(json);

        // Also convert to base64 for fallback
        const base64Reader = new FileReader();
        base64Reader.onloadend = () => {
          const base64String = base64Reader.result as string;
          setFileBase64(base64String);
        };
        base64Reader.readAsDataURL(selectedFile);
      } catch (err: any) {
        console.error("Gagal membaca file Excel:", err);
        setErrorMsg("Format file Excel tidak dapat dibaca: " + err.message);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const [parsedJsonRecords, setParsedJsonRecords] = useState<any[]>([]);

  const handleUploadSubmit = async () => {
    if (!parsedJsonRecords.length && !fileBase64) {
      setErrorMsg("Pilih file Excel/CSV terlebih dahulu.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    try {
      // Send parsed JSON records directly to bypass Nginx payload size limits (only ~100KB vs 5MB base64)
      const res = await api.post("/api/market-data/idx/upload-excel", {
        records: parsedJsonRecords.length > 0 ? parsedJsonRecords : undefined,
        fileBase64: parsedJsonRecords.length === 0 ? fileBase64 : undefined,
        date: targetDate
      });

      if (res.data?.success) {
        setUploadResult(res.data.data);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMsg(res.data?.message || "Gagal mengunggah data saham.");
      }
    } catch (err: any) {
      console.error("Gagal upload excel:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal mengunggah file Excel ke server.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileBase64("");
    setPreviewRows([]);
    setTotalParsedRows(0);
    setHasForeignData(false);
    setUploadResult(null);
    setErrorMsg(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 cursor-pointer shadow-2xs gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Upload Excel EOD</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span>Unggah Excel Ringkasan Saham Harian IDX (EOD)</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Unggah file Excel <strong>Stock Summary (Ringkasan Saham)</strong> resmi dari IDX untuk memperbarui harga harian, volume, dan data <strong>Foreign Flow (Asing Net Buy/Sell)</strong> secara lengkap.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Tanggal Bursa & Petunjuk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tanggal Perdagangan Bursa *</span>
              </label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-8 text-xs font-bold"
              />
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sistem otomatis menyinkronkan <strong>IHSG (^JKSE)</strong> dari Yahoo Finance.</span>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50 relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                <FileUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {file ? file.name : "Klik atau seret (drag & drop) file Excel IDX ke sini"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mendukung format resmi IDX: <strong>.xlsx, .xls, .csv</strong> (Stock Summary harian)
                </p>
              </div>
              {!file && (
                <span className="mt-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                  Pilih File Dari Komputer
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Gagal memproses file: </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Success Result Box */}
          {uploadResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Data Berhasil Diimpor & Tersimpan Permanen di Database!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[10px] text-slate-500 font-semibold">Tanggal Bursa</div>
                  <div className="text-xs font-black text-slate-900">{uploadResult.date}</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[10px] text-slate-500 font-semibold">Total Emiten</div>
                  <div className="text-xs font-black text-emerald-700">{uploadResult.totalParsed} Saham</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[10px] text-slate-500 font-semibold">Status IHSG</div>
                  <div className="text-xs font-black text-slate-900">
                    {uploadResult.ihsgClose ? `Rp ${uploadResult.ihsgClose.toLocaleString("id-ID")}` : "Tersinkron"}
                  </div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[10px] text-slate-500 font-semibold">Market Regime</div>
                  <div className="text-xs font-black text-slate-900">{uploadResult.ihsgRegime || "CALCULATED"}</div>
                </div>
              </div>
            </div>
          )}

          {/* File Preview */}
          {previewRows.length > 0 && !uploadResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold text-[10px]">
                    {totalParsedRows} Emiten Terbaca
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      hasForeignData
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px]"
                        : "bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px]"
                    }
                  >
                    {hasForeignData ? "✅ Kolom Asing (Foreign Flow) Terdeteksi" : "⚠️ Tanpa Kolom Asing"}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Ganti File
                </button>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 flex justify-between items-center">
                  <span>Pratinjau Data Saham (5 Baris Pertama)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Target Tanggal: {targetDate}</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-1.5 text-left font-bold">Ticker</th>
                        <th className="p-1.5 text-right font-bold">Prev</th>
                        <th className="p-1.5 text-right font-bold">Close</th>
                        <th className="p-1.5 text-right font-bold">Volume</th>
                        <th className="p-1.5 text-right font-bold">Foreign Buy</th>
                        <th className="p-1.5 text-right font-bold">Foreign Sell</th>
                        <th className="p-1.5 text-right font-bold">Foreign Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((row: any, idx: number) => {
                        const isNetBuy = row.foreignNet > 0;
                        const isNetSell = row.foreignNet < 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="p-1.5 font-black text-slate-900">{row.ticker}</td>
                            <td className="p-1.5 text-right text-slate-500">Rp {row.previous?.toLocaleString("id-ID")}</td>
                            <td className="p-1.5 text-right font-bold text-slate-800">Rp {row.close?.toLocaleString("id-ID")}</td>
                            <td className="p-1.5 text-right text-slate-600">{row.volume?.toLocaleString("id-ID")}</td>
                            <td className="p-1.5 text-right text-slate-600">{row.foreignBuy?.toLocaleString("id-ID")}</td>
                            <td className="p-1.5 text-right text-slate-600">{row.foreignSell?.toLocaleString("id-ID")}</td>
                            <td
                              className={`p-1.5 text-right font-bold ${
                                isNetBuy ? "text-emerald-600" : isNetSell ? "text-rose-600" : "text-slate-500"
                              }`}
                            >
                              {isNetBuy ? "+" : ""}
                              {row.foreignNet?.toLocaleString("id-ID")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              handleReset();
            }}
            className="text-xs h-8 text-slate-600 cursor-pointer"
          >
            {uploadResult ? "Tutup" : "Batal"}
          </Button>
          {!uploadResult && (
            <Button
              type="button"
              onClick={handleUploadSubmit}
              disabled={!fileBase64 || uploading || totalParsedRows === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 shadow-xs cursor-pointer gap-1.5 disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>
                {uploading
                  ? "Sedang Mengimpor Data Saham..."
                  : `Simpan & Update Data (${totalParsedRows} Emiten)`}
              </span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
