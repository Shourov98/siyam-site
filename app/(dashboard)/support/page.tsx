"use client";

import { FileText, Filter, Image as ImageIcon, Search, TriangleAlert, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type CaseStatus = "Resolved" | "Pending" | "Escalated";
type Platform = "Amazon" | "eBay" | "TikTok";

type CaseRow = {
  id: string;
  caseId: string;
  platform: Platform;
  customer: string;
  orderId: string;
  disputeType: string;
  date: string;
  status: CaseStatus;
};

type ResolveEvidence = {
  id: string;
  fileName: string;
  fileSizeLabel: string;
  progress: number;
  type: "pdf" | "image";
};

const initialCases: CaseRow[] = [
  {
    id: "1",
    caseId: "#ORD-7782",
    platform: "Amazon",
    customer: "Jane Cooper",
    orderId: "#ORD-7782",
    disputeType: "Item Not Received",
    date: "Oct 24, 2023",
    status: "Resolved",
  },
  {
    id: "2",
    caseId: "#ORD-7782",
    platform: "eBay",
    customer: "Wade Warren",
    orderId: "#ORD-7782",
    disputeType: "Unauthorized Trans",
    date: "Oct 24, 2023",
    status: "Pending",
  },
  {
    id: "3",
    caseId: "#ORD-7782",
    platform: "TikTok",
    customer: "Jenny Wilson",
    orderId: "#ORD-7782",
    disputeType: "Damaged Item",
    date: "Oct 24, 2023",
    status: "Escalated",
  },
  {
    id: "4",
    caseId: "#ORD-7782",
    platform: "Amazon",
    customer: "Jane Cooper",
    orderId: "#ORD-7782",
    disputeType: "Item Not Received",
    date: "Oct 24, 2023",
    status: "Escalated",
  },
  {
    id: "5",
    caseId: "#ORD-7782",
    platform: "Amazon",
    customer: "Jane Cooper",
    orderId: "#ORD-7782",
    disputeType: "Item Not Received",
    date: "Oct 24, 2023",
    status: "Resolved",
  },
];

function statusBadge(status: CaseStatus) {
  if (status === "Resolved") {
    return <span className="rounded-full bg-[#dff8f1] px-3 py-1 text-xs font-semibold text-[#5ed2c5]">Resolved</span>;
  }

  if (status === "Pending") {
    return <span className="rounded-full bg-[#fff4df] px-3 py-1 text-xs font-semibold text-[#f3b24f]">Pending</span>;
  }

  return <span className="rounded-full bg-[#d9ecff] px-3 py-1 text-xs font-semibold text-[#55a8ff]">Escalated</span>;
}

function platformBadge(platform: Platform) {
  if (platform === "Amazon") {
    return <span className="inline-flex h-8 min-w-[98px] items-center justify-center rounded-full bg-[#f79b08] px-3 text-xs font-bold uppercase tracking-wide text-white">Amazon</span>;
  }

  if (platform === "eBay") {
    return <span className="inline-flex h-8 min-w-[98px] items-center justify-center rounded-full bg-[#1886f0] px-3 text-xs font-bold uppercase tracking-wide text-white">eBay</span>;
  }

  return <span className="inline-flex h-8 min-w-[98px] items-center justify-center rounded-full bg-[linear-gradient(90deg,#11d6bf,#0f1d2f_54%,#ff006f)] px-3 text-xs font-bold uppercase tracking-wide text-white">TikTok</span>;
}

function avatar(customer: string) {
  const initials = customer
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eceff5] text-[11px] font-bold text-[#4e607f]">
      {initials}
    </span>
  );
}

function formatFileSizeLabel(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (sizeBytes >= 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${sizeBytes} B`;
}

export default function SupportPage() {
  const [rows, setRows] = useState<CaseRow[]>(initialCases);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "new" | "duplicates">("all");

  const [activeResolveCase, setActiveResolveCase] = useState<CaseRow | null>(null);
  const [resolveMessage, setResolveMessage] = useState("");
  const [resolveFiles, setResolveFiles] = useState<ResolveEvidence[]>([]);
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let dataset = rows;

    if (activeTab === "new") {
      dataset = rows.slice(0, 3);
    }

    if (activeTab === "duplicates") {
      dataset = rows.slice(3);
    }

    if (!q) {
      return dataset;
    }

    return dataset.filter((item) => {
      return (
        item.caseId.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q) ||
        item.platform.toLowerCase().includes(q) ||
        item.disputeType.toLowerCase().includes(q)
      );
    });
  }, [rows, query, activeTab]);

  const openResolveModal = (entry: CaseRow) => {
    setActiveResolveCase(entry);
    setResolveMessage("");
    setResolveFiles([]);
  };

  const closeResolveModal = () => {
    if (isSubmittingResolve) {
      return;
    }

    setActiveResolveCase(null);
    setResolveMessage("");
    setResolveFiles([]);
  };

  const addEvidenceFiles = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const picked: ResolveEvidence[] = Array.from(files).map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      fileName: file.name,
      fileSizeLabel: formatFileSizeLabel(file.size),
      progress: index === files.length - 1 ? 45 : 100,
      type: file.type === "application/pdf" ? "pdf" : "image",
    }));

    setResolveFiles((prev) => [...prev, ...picked]);
  };

  const removeEvidenceFile = (id: string) => {
    setResolveFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const submitResolveResponse = () => {
    if (!activeResolveCase || !resolveMessage.trim()) {
      return;
    }

    setIsSubmittingResolve(true);

    window.setTimeout(() => {
      setRows((prev) => prev.map((row) => (row.id === activeResolveCase.id ? { ...row, status: "Resolved" } : row)));
      setIsSubmittingResolve(false);
      closeResolveModal();
    }, 450);
  };

  return (
    <>
      <section className="px-4 py-5 md:px-8 md:py-8">
        <div className="space-y-4">
          <header className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-5 py-5 text-white">
            <h1 className="text-2xl font-semibold">Disputes & Cases</h1>
            <p className="mt-1 text-sm text-[#a9b8d6]">Manage and resolve your cross-channel disputes efficiently.</p>
          </header>

          <article className="rounded-xl border border-[#dbe2ee] bg-[#f4f6fa] p-4 md:p-5">
            <h2 className="text-[28px] font-semibold text-[#1f2f4c]">Product Optimization</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-[#1b2748] p-4 text-white shadow-[0_16px_30px_-26px_rgba(8,16,34,0.95)]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ff3e92]/20 text-[#ff3e92]">
                    <TriangleAlert className="h-4 w-4" />
                  </span>
                  <p className="text-xs font-semibold text-[#f15ca3]">Expiring soon</p>
                </div>
                <p className="text-[13px] text-[#c7d4eb]">Action Required</p>
                <p className="mt-0.5 text-[40px] font-semibold leading-none">5 Cases</p>
              </div>

              <div className="rounded-2xl bg-[#1b2748] p-4 text-white shadow-[0_16px_30px_-26px_rgba(8,16,34,0.95)]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1886f0]/20 text-[#1886f0]">↗</span>
                  <p className="text-xs font-semibold text-[#35d3ce]">+ 12% vs last month</p>
                </div>
                <p className="text-[13px] text-[#c7d4eb]">Active Disputes</p>
                <p className="mt-0.5 text-[40px] font-semibold leading-none">142</p>
              </div>

              <div className="rounded-2xl bg-[#1b2748] p-4 text-white shadow-[0_16px_30px_-26px_rgba(8,16,34,0.95)]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#3ad279]/20 text-[#3ad279]">⏱</span>
                  <p className="text-xs font-semibold text-[#4acf86]">+ 15% faster than average</p>
                </div>
                <p className="text-[13px] text-[#c7d4eb]">Avg. Resolution Time</p>
                <p className="mt-0.5 text-[40px] font-semibold leading-none">2.4 Days</p>
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl border border-[#dbe2ee] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-5">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative min-w-[250px] flex-1 md:max-w-[390px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#99a9c7]" />
                  <input
                    className="h-11 w-full rounded-lg border border-[#d7deeb] bg-[#f8fafd] py-2 pl-10 pr-3 text-sm text-[#243251] outline-none"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, SKU, or ASIN..."
                    type="text"
                    value={query}
                  />
                </div>

                <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#d7deeb] bg-[#f8fafd] px-4 text-sm font-semibold text-[#4f6282]" type="button">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-full bg-[#eef2f8] p-1 text-xs font-semibold">
                <button
                  className={`rounded-full px-4 py-2 ${activeTab === "all" ? "bg-[#1b2748] text-white" : "text-[#7385a5]"}`}
                  onClick={() => setActiveTab("all")}
                  type="button"
                >
                  All (45)
                </button>
                <button
                  className={`rounded-full px-4 py-2 ${activeTab === "new" ? "bg-[#1b2748] text-white" : "text-[#7385a5]"}`}
                  onClick={() => setActiveTab("new")}
                  type="button"
                >
                  New (42)
                </button>
                <button
                  className={`rounded-full px-4 py-2 ${activeTab === "duplicates" ? "bg-[#1b2748] text-white" : "text-[#7385a5]"}`}
                  onClick={() => setActiveTab("duplicates")}
                  type="button"
                >
                  Duplicates (3)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-[#edf1f7]">
              <table className="w-full min-w-[1120px] border-collapse">
                <thead className="bg-[#233a69] text-xs font-semibold uppercase tracking-wide text-[#d8e4fb]">
                  <tr>
                    <th className="px-4 py-4 text-left">Case ID</th>
                    <th className="px-4 py-4 text-left">Platform</th>
                    <th className="px-4 py-4 text-left">Customer</th>
                    <th className="px-4 py-4 text-left">Order ID</th>
                    <th className="px-4 py-4 text-left">Dispute Type</th>
                    <th className="px-4 py-4 text-left">Date</th>
                    <th className="px-4 py-4 text-left">Status</th>
                    <th className="px-4 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((entry) => (
                    <tr className="border-t border-[#edf1f7] text-sm text-[#4f5f7d]" key={entry.id}>
                      <td className="px-4 py-4 font-semibold text-[#4c5b79]">{entry.caseId}</td>
                      <td className="px-4 py-4">{platformBadge(entry.platform)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {avatar(entry.customer)}
                          <p className="leading-tight text-[#4f5f7d]">
                            {entry.customer.split(" ")[0]}
                            <br />
                            {entry.customer.split(" ").slice(1).join(" ")}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#4c5b79]">{entry.orderId}</td>
                      <td className="px-4 py-4 text-[#6f7f9f]">{entry.disputeType}</td>
                      <td className="px-4 py-4 text-[#8392ae]">{entry.date}</td>
                      <td className="px-4 py-4">{statusBadge(entry.status)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="rounded-md border border-[#d6deea] bg-[#f8fafd] px-4 py-1.5 text-xs font-semibold text-[#60708d]" type="button">
                            View Details
                          </button>
                          <button
                            className={`rounded-md px-4 py-1.5 text-xs font-semibold ${
                              entry.status === "Pending"
                                ? "border border-[#d6deea] bg-[#f8fafd] text-[#9baac4]"
                                : "bg-[#35d3ce] text-white"
                            }`}
                            disabled={entry.status === "Pending"}
                            onClick={() => openResolveModal(entry)}
                            type="button"
                          >
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>

      {activeResolveCase ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#020816]/60 px-4 py-6">
          <article className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#364973] bg-[#18284d] shadow-[0_45px_120px_-35px_rgba(6,15,36,0.95)]">
            <header className="flex items-start justify-between border-b border-[#4c5f87] px-6 py-4 text-white">
              <div>
                <h2 className="text-[20px] font-semibold leading-none">Submit Dispute Response</h2>
                <p className="mt-2 text-[16px] text-[#aebddb]">Case {activeResolveCase.caseId} - {activeResolveCase.disputeType}</p>
              </div>
              <button className="mt-1 text-[#9fb0d0] transition hover:text-white" onClick={closeResolveModal} type="button">
                <X className="h-6 w-6" />
              </button>
            </header>

            <div className="space-y-6 px-6 py-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[20px] font-semibold text-[#d9e4fb]">Response Message</p>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-[#e6ebf2] px-4 py-2 text-sm font-semibold text-[#4d5f81]" type="button">
                    Load Template...
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#8ca0c8] bg-white">
                  <div className="flex h-9 items-center gap-3 bg-[#243a67] px-3 text-sm font-semibold text-[#d8e4fb]">
                    <button type="button">B</button>
                    <button className="italic" type="button">I</button>
                    <button type="button">☰</button>
                    <button type="button">◉</button>
                  </div>
                  <textarea
                    className="h-44 w-full resize-none px-4 py-3 text-base text-[#2c3f5f] outline-none placeholder:text-[#7688a8]"
                    maxLength={2000}
                    onChange={(event) => setResolveMessage(event.target.value)}
                    placeholder="Please provide details about the transaction and why the claim should be rejected or accepted..."
                    value={resolveMessage}
                  />
                </div>
                <p className="mt-2 text-right text-sm text-[#c3d0ea]">{resolveMessage.length}/2000 characters</p>
              </div>

              <div>
                <p className="mb-3 text-[20px] font-semibold text-[#d9e4fb]">Evidence Upload</p>
                <input
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  multiple
                  onChange={(event) => addEvidenceFiles(event.target.files)}
                  ref={evidenceInputRef}
                  type="file"
                />
                <button
                  className="w-full rounded-xl border border-dashed border-[#8da4cc] bg-[#f5f7fb] px-5 py-12 text-center"
                  onClick={() => evidenceInputRef.current?.click()}
                  type="button"
                >
                  <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#35d3ce] text-[#123a50]">⤴</span>
                  <p className="text-lg font-semibold text-[#4a5f83]">Click to upload</p>
                  <p className="mt-1 text-sm text-[#97a9c8]">Supported: JPG, PNG, PDF (Max 10MB)</p>
                </button>

                <div className="mt-3 space-y-2">
                  {resolveFiles.map((file) => (
                    <div className="flex items-center justify-between rounded-xl bg-[#f5f7fb] px-4 py-3" key={file.id}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${file.type === "pdf" ? "bg-[#ffd8e8] text-[#dc4e95]" : "bg-[#d6f6f5] text-[#34c9c6]"}`}>
                          {file.type === "pdf" ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-[#4a5f83]">{file.fileName}</p>
                          <p className="text-sm text-[#94a6c5]">
                            {file.fileSizeLabel} • {file.progress >= 100 ? "Uploaded just now" : `Uploading ${file.progress}%`}
                          </p>
                        </div>
                      </div>
                      <button className="text-[#9db0cf] transition hover:text-[#4f6387]" onClick={() => removeEvidenceFile(file.id)} type="button">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-between bg-[#263b67] px-6 py-5">
              <button className="rounded-xl px-4 py-2 text-base font-semibold text-[#cad7ef] transition hover:text-white" onClick={closeResolveModal} type="button">
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-[#7388b1] px-5 py-2 text-base font-semibold text-[#dbe7ff]" type="button">
                  Save Draft
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-[#35d3ce] px-6 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmittingResolve || !resolveMessage.trim()}
                  onClick={submitResolveResponse}
                  type="button"
                >
                  Submit Response
                </button>
              </div>
            </footer>
          </article>
        </div>
      ) : null}
    </>
  );
}
