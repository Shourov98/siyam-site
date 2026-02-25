"use client";

import { CloudUpload, Edit3, Filter, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type ImportPlatform = "AMAZON" | "EBAY" | "TIKTOK";
type ImportStatus = "New" | "Duplicate" | "Delivered";
type ImportTab = "all" | "new" | "duplicate";

type ImportItem = {
  id: string;
  selected: boolean;
  name: string;
  sku: string;
  platform: ImportPlatform;
  stock: string;
  amount: string;
  status: ImportStatus;
};

const initialItems: ImportItem[] = [
  { id: "1", selected: false, name: "Smart Watch Series 7", sku: "WTCH-S7-BLK", platform: "AMAZON", stock: "3", amount: "+$25.99", status: "New" },
  { id: "2", selected: true, name: "Smart Watch Series 7", sku: "WTCH-S7-BLK", platform: "EBAY", stock: "3", amount: "+$25.99", status: "Duplicate" },
  { id: "3", selected: false, name: "Smart Watch Series 7", sku: "WTCH-S7-BLK", platform: "TIKTOK", stock: "3", amount: "+$25.99", status: "Delivered" },
  { id: "4", selected: true, name: "Smart Watch Series 7", sku: "WTCH-S7-BLK", platform: "AMAZON", stock: "3", amount: "+$25.99", status: "Delivered" },
  { id: "5", selected: true, name: "Smart Watch Series 7", sku: "WTCH-S7-BLK", platform: "AMAZON", stock: "3", amount: "+$25.99", status: "New" },
  { id: "6", selected: false, name: "Smart Watch Series 7", sku: "WTCH-S7-BLK", platform: "AMAZON", stock: "3", amount: "+$25.99", status: "New" },
];

function PlatformBadge({ platform }: { platform: ImportPlatform }) {
  if (platform === "AMAZON") {
    return <span className="rounded-full bg-[#f8a100] px-3 py-1 text-xs font-semibold text-white">AMAZON</span>;
  }

  if (platform === "EBAY") {
    return <span className="rounded-full bg-[#0b72de] px-3 py-1 text-xs font-semibold text-white">EBAY</span>;
  }

  return (
    <span className="rounded-full bg-gradient-to-r from-[#00d4d1] via-[#0ea4d6] to-[#eb0f67] px-3 py-1 text-xs font-semibold text-white">
      TIKTOK
    </span>
  );
}

function StatusBadge({ status }: { status: ImportStatus }) {
  if (status === "New") {
    return <span className="rounded-full bg-[#ddf7f0] px-3 py-1 text-xs font-semibold text-[#56cbc2]">New</span>;
  }

  if (status === "Duplicate") {
    return <span className="rounded-full bg-[#fff2d6] px-3 py-1 text-xs font-semibold text-[#f4a632]">Duplicate</span>;
  }

  return <span className="rounded-full bg-[#d9efff] px-3 py-1 text-xs font-semibold text-[#4aa6ff]">Delivered</span>;
}

export default function ImportPage() {
  const [items, setItems] = useState<ImportItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ImportTab>("all");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const all = items.length;
    const next = items.filter((item) => item.status === "New").length;
    const dup = items.filter((item) => item.status === "Duplicate").length;
    return { all, next, dup };
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "new" && item.status === "New") ||
        (activeTab === "duplicate" && item.status === "Duplicate");

      if (!matchesTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      return item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query);
    });
  }, [items, activeTab, searchQuery]);

  const removeRow = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateStock = (id: string, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, stock: value } : item)));
  };

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-5 py-5 text-white">
          <h1 className="text-2xl font-semibold">We Found Products</h1>
          <p className="mt-1 text-sm text-[#a9b8d6]">We detected 45 items from your connected Amazon store.</p>
        </div>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-6">
          <h2 className="text-2xl font-semibold text-[#1f2c44]">Product Optimization</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-[#1a2748] p-5 text-white">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#198eff] text-white">☰</div>
              <p className="text-sm text-[#c0cce4]">Total Selected</p>
              <p className="mt-1 text-4xl font-semibold">1,240</p>
            </div>

            <div className="rounded-2xl bg-[#1a2748] p-5 text-white">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2fd15f] text-white">＋</div>
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-xs font-semibold text-[#53e1d6]">↗ +850 to catalog</span>
              </div>
              <p className="text-sm text-[#c0cce4]">New Products</p>
              <p className="mt-1 text-4xl font-semibold">45</p>
            </div>

            <div className="rounded-2xl bg-[#1a2748] p-5 text-white">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6559ff] text-white">⛓</div>
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-xs font-semibold text-[#53e1d6]">Update</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Linked</p>
              <p className="mt-1 text-4xl font-semibold">850</p>
            </div>

            <div className="rounded-2xl bg-[#1a2748] p-5 text-white">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8a100] text-white">⊖</div>
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-xs font-semibold text-[#53e1d6]">Review</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Skipped</p>
              <p className="mt-1 text-4xl font-semibold">350</p>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row lg:max-w-[700px]">
            <div className="relative w-full md:max-w-[390px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#96a3bc]" />
              <input
                className="h-11 w-full rounded-xl border border-[#d6dce9] bg-white py-2 pl-10 pr-3 text-sm text-[#243251] outline-none placeholder:text-[#8f9bb1] focus:border-[#98abcf]"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, SKU, or ASIN..."
                type="text"
                value={searchQuery}
              />
            </div>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-5 text-sm font-semibold text-[#465574]"
              type="button"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-5 text-sm font-semibold text-[#465574]"
              type="button"
            >
              <CloudUpload className="h-4 w-4" />
              Import
            </button>
          </div>

          <div className="inline-flex items-center rounded-xl border border-[#d8dfeb] bg-white p-1 text-sm font-semibold text-[#5f6e8b]">
            <button
              className={`rounded-lg px-4 py-2 transition ${activeTab === "all" ? "bg-[#1b2748] text-white" : "hover:bg-[#f2f5fb]"}`}
              onClick={() => setActiveTab("all")}
              type="button"
            >
              All ({counts.all})
            </button>
            <button
              className={`rounded-lg px-4 py-2 transition ${activeTab === "new" ? "bg-[#1b2748] text-white" : "hover:bg-[#f2f5fb]"}`}
              onClick={() => setActiveTab("new")}
              type="button"
            >
              New ({counts.next})
            </button>
            <button
              className={`rounded-lg px-4 py-2 transition ${activeTab === "duplicate" ? "bg-[#1b2748] text-white" : "hover:bg-[#f2f5fb]"}`}
              onClick={() => setActiveTab("duplicate")}
              type="button"
            >
              Duplicates ({counts.dup})
            </button>
          </div>
        </div>

        <article className="overflow-hidden rounded-2xl border border-[#e1e6f0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-[#233a69] text-xs font-semibold uppercase tracking-wide text-[#d8e4fb]">
                <tr>
                  <th className="w-12 px-4 py-4">●</th>
                  <th className="px-4 py-4">Order ID</th>
                  <th className="px-4 py-4">Platform</th>
                  <th className="px-4 py-4">Stock</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr className="border-t border-[#e9eef7] text-sm text-[#44526d]" key={item.id}>
                    <td className="px-4 py-4">
                      <span className={`inline-block h-3.5 w-3.5 rounded-full border ${item.selected ? "border-[#1b355f] bg-[#1b355f]" : "border-[#95a3bd]"}`} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e6d6be]">
                          <div className="h-8 w-4 rounded-[3px] bg-white/85" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#2c3a57]">{item.name}</p>
                          <p className="text-xs text-[#8ea0bf]">SKU: {item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <PlatformBadge platform={item.platform} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      {editingRowId === item.id ? (
                        <input
                          className="mx-auto h-8 w-16 rounded-lg border border-[#cfd8e7] bg-white px-2 text-center text-sm font-semibold text-[#3f4d65] outline-none"
                          onChange={(event) => updateStock(item.id, event.target.value)}
                          type="number"
                          value={item.stock}
                        />
                      ) : (
                        <div className="mx-auto h-8 w-16 rounded-lg border border-[#d8e1ee] bg-[#f7f9fd] py-1.5 text-sm font-semibold text-[#6b7c99]">
                          {item.stock}
                        </div>
                      )}
                      <p className="mt-1 text-[11px] text-[#8acfd6]">Items</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-[#4a5b78]">{item.amount}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        {item.status === "Duplicate" ? (
                          <Link
                            className="rounded-lg border border-[#f4d7a2] bg-[#fff5df] px-2.5 py-1 text-xs font-semibold text-[#f4a632]"
                            href={`/import/resolve/${item.id}`}
                          >
                            Resolve
                          </Link>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          className="text-[#223763]"
                          onClick={() => setEditingRowId((prev) => (prev === item.id ? null : item.id))}
                          type="button"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button className="text-[#f03f8f]" onClick={() => removeRow(item.id)} type="button">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#e5ebf5] px-5 py-3 text-sm text-[#6f809f]">
            <p>Showing 1 to {Math.min(filteredItems.length, 4)} of 128 results</p>
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-[#c7d3e6] px-4 py-1.5 font-semibold text-[#60708d]" type="button">
                Previous
              </button>
              <button className="rounded-xl border border-[#c7d3e6] px-4 py-1.5 font-semibold text-[#60708d]" type="button">
                Next
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
