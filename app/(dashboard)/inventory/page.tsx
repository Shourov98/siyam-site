"use client";

import {
  AlertTriangle,
  CloudUpload,
  Edit3,
  FileDown,
  Filter,
  Package2,
  Plus,
  Search,
  TriangleAlert,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

type ChannelState = "active" | "paused";

type ChannelInfo = {
  value: string;
  state: ChannelState;
};

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  asin: string;
  thumbTone: string;
  masterCount: string;
  amazon: ChannelInfo;
  ebay: ChannelInfo;
  tiktok: ChannelInfo;
  safetyBuffer: string;
  available: string;
};

const initialInventory: InventoryItem[] = [
  {
    id: "1",
    name: "Smart Watch Series 7",
    sku: "WTCH-S7-BLK",
    asin: "B0C1W7A001",
    thumbTone: "bg-[#e6d6be]",
    masterCount: "142",
    amazon: { value: "142", state: "active" },
    ebay: { value: "65", state: "active" },
    tiktok: { value: "16", state: "active" },
    safetyBuffer: "10",
    available: "196",
  },
  {
    id: "2",
    name: "Smart Watch Series 7",
    sku: "WTCH-S7-BLK",
    asin: "B0C1W7A002",
    thumbTone: "bg-[#e6d6be]",
    masterCount: "142",
    amazon: { value: "142", state: "active" },
    ebay: { value: "65", state: "active" },
    tiktok: { value: "16", state: "active" },
    safetyBuffer: "10",
    available: "80",
  },
  {
    id: "3",
    name: "Smart Watch Series 7",
    sku: "WTCH-S7-BLK",
    asin: "B0C1W7A003",
    thumbTone: "bg-[#e6d6be]",
    masterCount: "142",
    amazon: { value: "142", state: "active" },
    ebay: { value: "65", state: "active" },
    tiktok: { value: "16", state: "active" },
    safetyBuffer: "10",
    available: "44",
  },
  {
    id: "4",
    name: "Smart Watch Series 7",
    sku: "WTCH-S7-BLK",
    asin: "B0C1W7A004",
    thumbTone: "bg-[#e6d6be]",
    masterCount: "142",
    amazon: { value: "142", state: "active" },
    ebay: { value: "65", state: "active" },
    tiktok: { value: "16", state: "active" },
    safetyBuffer: "10",
    available: "12",
  },
  {
    id: "5",
    name: "Smart Watch Series 7",
    sku: "WTCH-S7-BLK",
    asin: "B0C1W7A005",
    thumbTone: "bg-[#e6d6be]",
    masterCount: "142",
    amazon: { value: "142", state: "active" },
    ebay: { value: "65", state: "active" },
    tiktok: { value: "16", state: "active" },
    safetyBuffer: "10",
    available: "196",
  },
];

function AvailabilityText({ value }: { value: string }) {
  const count = Number(value);
  if (count <= 20) {
    return <span className="font-semibold text-[#f05694]">{value}</span>;
  }
  if (count <= 80) {
    return <span className="font-semibold text-[#f3ad2f]">{value}</span>;
  }
  return <span className="font-semibold text-[#4ec9cd]">{value}</span>;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(initialInventory);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.asin.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery]);

  const updateItem = <K extends keyof InventoryItem>(id: string, key: K, value: InventoryItem[K]) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const updateChannel = (id: string, channel: "amazon" | "ebay" | "tiktok", value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [channel]: {
                ...item[channel],
                value,
                state: value.trim() ? "active" : "paused",
              },
            }
          : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-5">
        <div className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-4 py-4 text-white md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Inventory Overview</h1>
              <p className="mt-1 text-sm text-[#a9b8d6]">Manage stock levels across Amazon, TikTok, and eBay</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cbd6ea] bg-white px-4 text-sm font-semibold text-[#425370]"
                type="button"
              >
                <Filter className="h-4 w-4" />
                Adjust Safety Buffer
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#35d3ce] px-4 text-sm font-semibold text-white"
                type="button"
              >
                <FileDown className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-5">
          <h2 className="text-lg font-semibold text-[#1f2c44]">Product Optimization</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <Package2 className="h-4 w-4 text-[#a9b7d3]" />
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">+12%</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Total SKUs</p>
              <p className="mt-1 text-3xl font-semibold">1,240</p>
            </div>

            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <CloudUpload className="h-4 w-4 text-[#a9b7d3]" />
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">+5%</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Available Stock</p>
              <p className="mt-1 text-3xl font-semibold">45,302</p>
            </div>

            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <AlertTriangle className="h-4 w-4 text-[#f1b83d]" />
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">-2%</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Low Stock</p>
              <p className="mt-1 text-3xl font-semibold text-[#f2b239]">12</p>
            </div>

            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <TriangleAlert className="h-4 w-4 text-[#ef4a89]" />
                <span className="rounded-full bg-[#3f2347] px-2 py-0.5 text-[10px] text-[#ef4a89]">+1%</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Out of Stock</p>
              <p className="mt-1 text-3xl font-semibold text-[#ef4a89]">3</p>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row lg:max-w-[710px]">
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
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-11 items-center gap-3 rounded-full border border-[#d7deeb] bg-[#eaf2fd] px-4 text-sm font-semibold text-[#33466a]">
              Global Edit Mode
              <button
                className={`relative h-6 w-12 rounded-full transition ${globalEditMode ? "bg-[#1f2d4d]" : "bg-[#c8d2e5]"}`}
                onClick={() => setGlobalEditMode((prev) => !prev)}
                type="button"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    globalEditMode ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </label>

            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-5 text-sm font-semibold text-[#465574]" type="button">
              <CloudUpload className="h-4 w-4" />
              Import
            </button>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#172544] px-5 text-sm font-semibold text-white" type="button">
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>

        <article className="overflow-hidden rounded-2xl border border-[#e1e6f0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead className="text-xs font-semibold uppercase tracking-wide text-[#d8e4fb]">
                <tr>
                  <th className="w-12 bg-[#233a69] px-3 py-4 text-center">○</th>
                  <th className="w-[280px] bg-[#233a69] px-4 py-4">Product Details</th>
                  <th className="w-[130px] bg-[#233a69] px-4 py-4 text-center">Master Count</th>
                  <th className="w-[150px] bg-[#f8a100] px-4 py-4 text-center">
                    <p className="text-sm normal-case text-white">a Amazon</p>
                    <p className="mt-1 text-[11px] normal-case text-white">Price + Shipping</p>
                  </th>
                  <th className="w-[150px] bg-[#0b72de] px-4 py-4 text-center">
                    <p className="text-sm normal-case text-white">eb eBay</p>
                    <p className="mt-1 text-[11px] normal-case text-white">BIN Price</p>
                  </th>
                  <th className="w-[150px] bg-gradient-to-r from-[#00d4d1] via-[#0ea4d6] to-[#eb0f67] px-4 py-4 text-center">
                    <p className="text-sm normal-case text-white">♪ TikTok</p>
                    <p className="mt-1 text-[11px] normal-case text-white">Shop Price</p>
                  </th>
                  <th className="w-[140px] bg-[#233a69] px-4 py-4 text-center">Safety Buffer</th>
                  <th className="w-[120px] bg-[#233a69] px-4 py-4 text-center">Available</th>
                  <th className="w-[120px] bg-[#233a69] px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => {
                  const canEdit = globalEditMode || editingRowId === item.id;

                  const renderCountCell = (
                    value: string,
                    onChange: (nextValue: string) => void,
                    className?: string,
                  ) => {
                    if (canEdit) {
                      return (
                        <input
                          className={`h-8 w-[84px] rounded-lg border border-[#cfd8e7] bg-white px-2 text-center text-sm text-[#3f4d65] outline-none ${className ?? ""}`}
                          onChange={(event) => onChange(event.target.value)}
                          type="number"
                          value={value}
                        />
                      );
                    }

                    return <div className="mx-auto text-sm font-semibold text-[#5a6a86]">{value}</div>;
                  };

                  return (
                    <tr className="border-t border-[#e9eef7] text-sm text-[#44526d]" key={item.id}>
                      <td className="px-3 py-4 text-center">
                        <span className="inline-block h-3.5 w-3.5 rounded-full border border-[#c7d1e3]" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${item.thumbTone}`}>
                            <div className="h-7 w-4 rounded-[3px] bg-white/85" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight text-[#202b44]">{item.name}</p>
                            <p className="mt-0.5 text-xs text-[#7d89a2]">SKU: {item.sku}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {renderCountCell(item.masterCount, (value) => updateItem(item.id, "masterCount", value))}
                        <p className="mt-1 text-xs text-[#40cacc]">In Stock</p>
                      </td>

                      <td className="border-l border-[#ffe0bc] px-4 py-4 text-center">
                        {renderCountCell(item.amazon.value, (value) => updateChannel(item.id, "amazon", value), "border-[#7ca0af] bg-[#d5eced]")}
                        <p className="mt-1 text-xs text-[#7f91ac]"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#2ccac4]" />Active</p>
                      </td>

                      <td className="border-l border-[#d2e5ff] px-4 py-4 text-center">
                        {renderCountCell(item.ebay.value, (value) => updateChannel(item.id, "ebay", value), "border-[#7ca0af] bg-[#d5eced]")}
                        <p className="mt-1 text-xs text-[#7f91ac]"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#2ccac4]" />Active</p>
                      </td>

                      <td className="border-l border-[#f5d4e6] px-4 py-4 text-center">
                        {renderCountCell(item.tiktok.value, (value) => updateChannel(item.id, "tiktok", value), "border-[#e58fc0] bg-[#fbe3f0] text-[#dd4a95]")}
                        <p className="mt-1 text-xs text-[#7f91ac]"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#2ccac4]" />Active</p>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {renderCountCell(item.safetyBuffer, (value) => updateItem(item.id, "safetyBuffer", value), "border-[#d5ddea]")}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <AvailabilityText value={item.available} />
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
                          <button className="text-[#f03f8f]" onClick={() => removeItem(item.id)} type="button">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 ? (
            <div className="border-t border-[#edf1f7] px-4 py-6 text-center text-sm text-[#6f7f9f]">No inventory rows found.</div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
