"use client";

import { AlertTriangle, CheckCircle2, CloudUpload, Edit3, FileText, Loader2, Search, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type ImportStatus = "imported" | "needs_review" | "duplicate" | "parse_issue" | "uploaded";
type ImportRow = {
  id: string;
  status: ImportStatus;
  created_at: string;
  updated_at: string;
  normalized_title: string;
  category: string;
  product_type: string;
  preview_image_path: string;
  linked_product_id: string | null;
  missing_fields: string[];
  notes: string[];
};

function StatusBadge({ status }: { status: ImportStatus }) {
  const styles: Record<ImportStatus, string> = {
    imported: "bg-[#ddf7f0] text-[#56cbc2]",
    needs_review: "bg-[#e9f0ff] text-[#4a84ef]",
    duplicate: "bg-[#fff2d6] text-[#f4a632]",
    parse_issue: "bg-[#ffe4e4] text-[#d25353]",
    uploaded: "bg-[#eefbf4] text-[#267a4f]",
  };
  const labels: Record<ImportStatus, string> = {
    imported: "Imported",
    needs_review: "Needs Review",
    duplicate: "Duplicate",
    parse_issue: "Parse Issue",
    uploaded: "Uploaded",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>;
}

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [busyRecordId, setBusyRecordId] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState("Uploaded import records stay here until you delete them or upload them as products.");

  async function loadImports() {
    const response = await fetch("/api/product-ai/imports/products", { cache: "no-store" });
    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
      throw new Error(errorBody?.detail ?? "Could not load imported products.");
    }
    return (await response.json()) as ImportRow[];
  }

  useEffect(() => {
    let active = true;
    void loadImports()
      .then((data) => {
        if (active) {
          setRows(data);
        }
      })
      .catch((error) => {
        if (active) {
          setPageMessage(error instanceof Error ? error.message : "Could not load imported products.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return rows;
    }
    return rows.filter((row) =>
      row.normalized_title.toLowerCase().includes(query) ||
      row.category.toLowerCase().includes(query) ||
      row.product_type.toLowerCase().includes(query),
    );
  }, [rows, searchQuery]);

  const metrics = useMemo(() => ({
    total: rows.length,
    uploaded: rows.filter((row) => row.status === "uploaded").length,
    review: rows.filter((row) => row.status === "needs_review" || row.status === "parse_issue").length,
    duplicates: rows.filter((row) => row.status === "duplicate").length,
  }), [rows]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    try {
      const response = await fetch("/api/product-ai/imports/products/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not upload import file.");
      }
      const refreshed = await loadImports();
      setRows(refreshed);
      setPageMessage("Import file processed and saved to the database.");
    } catch (error) {
      setPageMessage(error instanceof Error ? error.message : "Could not upload import file.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function deleteImportRecord(recordId: string) {
    setBusyRecordId(recordId);
    try {
      const response = await fetch(`/api/product-ai/imports/products/${recordId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not delete import record.");
      }
      setRows((current) => current.filter((row) => row.id !== recordId));
      setPageMessage("Import record deleted.");
    } catch (error) {
      setPageMessage(error instanceof Error ? error.message : "Could not delete import record.");
    } finally {
      setBusyRecordId(null);
    }
  }

  async function uploadAsProduct(recordId: string) {
    setBusyRecordId(recordId);
    try {
      const response = await fetch(`/api/product-ai/imports/products/${recordId}/upload-as-product`, { method: "POST" });
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not upload import record as product.");
      }
      const result = (await response.json()) as { import_record: { linked_product_id: string | null; status: ImportStatus } };
      setRows((current) =>
        current.map((row) =>
          row.id === recordId
            ? { ...row, status: result.import_record.status, linked_product_id: result.import_record.linked_product_id }
            : row,
        ),
      );
      setPageMessage("Import record uploaded as a real product and linked.");
    } catch (error) {
      setPageMessage(error instanceof Error ? error.message : "Could not upload import record as product.");
    } finally {
      setBusyRecordId(null);
    }
  }

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-5 py-5 text-white">
          <h1 className="text-2xl font-semibold">Bulk Product Import</h1>
          <p className="mt-1 text-sm text-[#a9b8d6]">Imported records stay in this workspace until you delete them or upload them as real products.</p>
        </div>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-6">
          <h2 className="text-2xl font-semibold text-[#1f2c44]">Import Overview</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Imported" value={metrics.total} accent="☰" />
            <MetricCard label="Uploaded As Product" value={metrics.uploaded} accent="✓" />
            <MetricCard label="Needs Review" value={metrics.review} accent="↺" />
            <MetricCard label="Duplicates" value={metrics.duplicates} accent="⊖" />
          </div>
        </article>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row lg:max-w-[840px]">
            <div className="relative w-full md:max-w-[390px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#96a3bc]" />
              <input
                className="h-11 w-full rounded-xl border border-[#d6dce9] bg-white py-2 pl-10 pr-3 text-sm text-[#243251] outline-none placeholder:text-[#8f9bb1] focus:border-[#98abcf]"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search imported products..."
                type="text"
                value={searchQuery}
              />
            </div>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-5 text-sm font-semibold text-[#465574] disabled:opacity-60"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>

        <input accept=".csv,.xlsx,.xls,.pdf" className="hidden" onChange={handleFileChange} ref={inputRef} type="file" />

        <div className="rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#5d708e]">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 text-[#4a84ef]" />
            <div>
              <p className="font-semibold text-[#30435f]">Import workflow</p>
              <p className="mt-1">CSV, Excel, and PDF uploads are persisted immediately. Edit the import record, generate or optimize data, then click `Upload as Product` when ready.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-sm text-[#546884]">{pageMessage}</div>

        <article className="overflow-hidden rounded-2xl border border-[#e1e6f0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead className="bg-[#233a69] text-xs font-semibold uppercase tracking-wide text-[#d8e4fb]">
                <tr>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Missing</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Linked Product</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? filteredRows.map((row) => (
                  <tr className="border-t border-[#e9eef7] text-sm text-[#44526d]" key={row.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#2c3a57]">{row.normalized_title}</p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">{row.product_type} • {row.updated_at.slice(0, 10)}</p>
                      {row.notes[0] ? <p className="mt-2 text-xs text-[#d28e10]">{row.notes[0]}</p> : null}
                    </td>
                    <td className="px-4 py-4">{row.category}</td>
                    <td className="px-4 py-4">
                      {row.missing_fields.length ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-semibold text-[#5e718e]">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {row.missing_fields.join(", ")}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 rounded-full bg-[#eefbf4] px-3 py-1 text-xs font-semibold text-[#267a4f]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-4">{row.linked_product_id ? row.linked_product_id.slice(0, 12) : "--"}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <Link className="inline-flex items-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-3 py-2 text-xs font-semibold text-[#465574]" href={`/import/${row.id}`}>
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <button
                          className="inline-flex items-center gap-2 rounded-xl bg-[#35d3ce] px-3 py-2 text-xs font-semibold text-[#153c53] disabled:opacity-60"
                          disabled={busyRecordId === row.id || Boolean(row.linked_product_id)}
                          onClick={() => void uploadAsProduct(row.id)}
                          type="button"
                        >
                          {busyRecordId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          Upload as Product
                        </button>
                        <button className="text-[#f03f8f]" disabled={busyRecordId === row.id} onClick={() => void deleteImportRecord(row.id)} type="button">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-[#7f92b1]" colSpan={6}>No import records found yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl bg-[#1a2748] p-5 text-white">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#198eff] text-white">{accent}</div>
      <p className="text-sm text-[#c0cce4]">{label}</p>
      <p className="mt-1 text-4xl font-semibold">{value}</p>
    </div>
  );
}
