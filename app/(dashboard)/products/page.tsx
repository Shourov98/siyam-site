"use client";

import {
  AlertTriangle,
  Box,
  CheckCircle2,
  CircleAlert,
  CloudUpload,
  Edit3,
  Filter,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type MarketState = "active" | "pending" | "out_of_stock" | "not_listed";

type MarketInfo = {
  price: string;
  status: MarketState;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  asin: string;
  stock: number;
  stockStatus: "in_stock" | "low_stock";
  thumbTone: string;
  amazon: MarketInfo;
  ebay: MarketInfo;
  tiktok: MarketInfo;
};

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Smart Watch Series 7",
    sku: "WTCH-S7-BLK",
    asin: "B0C1W7A001",
    stock: 142,
    stockStatus: "in_stock",
    thumbTone: "bg-[#e8d7bd]",
    amazon: { price: "329.00", status: "active" },
    ebay: { price: "335.50", status: "active" },
    tiktok: { price: "319.99", status: "pending" },
  },
  {
    id: "2",
    name: "Nike Air Zoom Pegasus",
    sku: "NK-ZOOM-RED",
    asin: "B0C1W7A002",
    stock: 45,
    stockStatus: "in_stock",
    thumbTone: "bg-[#e2caa4]",
    amazon: { price: "119.99", status: "out_of_stock" },
    ebay: { price: "", status: "not_listed" },
    tiktok: { price: "115.00", status: "active" },
  },
  {
    id: "3",
    name: "Sony WH-1000XM4",
    sku: "SNY-WH4-SIL",
    asin: "B0C1W7A003",
    stock: 89,
    stockStatus: "low_stock",
    thumbTone: "bg-[#e5d8bd]",
    amazon: { price: "348.00", status: "active" },
    ebay: { price: "345.00", status: "active" },
    tiktok: { price: "", status: "not_listed" },
  },
  {
    id: "4",
    name: "iPhone 14 Pro Max Case",
    sku: "CS-IP14PM-CLR",
    asin: "B0C1W7A004",
    stock: 1205,
    stockStatus: "in_stock",
    thumbTone: "bg-[#aabbb3]",
    amazon: { price: "19.99", status: "active" },
    ebay: { price: "18.50", status: "active" },
    tiktok: { price: "15.99", status: "active" },
  },
  {
    id: "5",
    name: "iPhone 14 Pro Max Case",
    sku: "CS-IP14PM-CLR",
    asin: "B0C1W7A005",
    stock: 1205,
    stockStatus: "in_stock",
    thumbTone: "bg-[#aabbb3]",
    amazon: { price: "19.99", status: "active" },
    ebay: { price: "18.50", status: "active" },
    tiktok: { price: "15.99", status: "active" },
  },
  {
    id: "6",
    name: "iPhone 14 Pro Max Case",
    sku: "CS-IP14PM-CLR",
    asin: "B0C1W7A006",
    stock: 1205,
    stockStatus: "in_stock",
    thumbTone: "bg-[#aabbb3]",
    amazon: { price: "19.99", status: "active" },
    ebay: { price: "18.50", status: "active" },
    tiktok: { price: "15.99", status: "active" },
  },
];

const marketLabels: Record<MarketState, string> = {
  active: "Active",
  pending: "Pending",
  out_of_stock: "Out of Stock",
  not_listed: "Not Listed",
};

const marketLabelClasses: Record<MarketState, string> = {
  active: "text-[#5b6e89]",
  pending: "text-[#8a8f9e]",
  out_of_stock: "text-[#ef4444]",
  not_listed: "text-[#9aa5bc]",
};

const marketDotClasses: Record<MarketState, string> = {
  active: "bg-[#2bc7c4]",
  pending: "bg-[#e3b101]",
  out_of_stock: "bg-[#ef4444]",
  not_listed: "bg-[#d4dceb]",
};

function toStockStatus(value: number): Product["stockStatus"] {
  if (value < 100) {
    return "low_stock";
  }

  return "in_stock";
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalEditMode, setGlobalEditMode] = useState(false);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.asin.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);

  const updateProduct = <K extends keyof Product>(id: string, key: K, value: Product[K]) => {
    setProducts((prev) => prev.map((product) => (product.id === id ? { ...product, [key]: value } : product)));
  };

  const updateMarket = (id: string, market: "amazon" | "ebay" | "tiktok", price: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              [market]: {
                ...product[market],
                price,
                status: price.trim() ? "active" : "not_listed",
              },
            }
          : product,
      ),
    );
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl bg-[#283d6e] p-4 text-white shadow-[0_18px_40px_-28px_rgba(17,33,64,0.9)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f5ff]">
              <Box className="h-5 w-5 text-[#2f3f63]" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#f2f6ff]">Total Products</p>
            <p className="mt-1 text-3xl font-semibold leading-none">128</p>
          </article>
          <article className="rounded-2xl bg-[#1a2548] p-4 text-white shadow-[0_18px_40px_-28px_rgba(17,33,64,0.9)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#d2fae7]">
              <CheckCircle2 className="h-5 w-5 text-[#29c5b8]" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#f2f6ff]">Active Listings</p>
            <p className="mt-1 text-3xl font-semibold leading-none">342</p>
          </article>
          <article className="rounded-2xl bg-[#1a2548] p-4 text-white shadow-[0_18px_40px_-28px_rgba(17,33,64,0.9)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff7cb]">
              <AlertTriangle className="h-5 w-5 text-[#c98510]" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#f2f6ff]">Low Stock</p>
            <p className="mt-1 text-3xl font-semibold leading-none">12</p>
          </article>
          <article className="rounded-2xl bg-[#1a2548] p-4 text-white shadow-[0_18px_40px_-28px_rgba(17,33,64,0.9)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffe5e7]">
              <CircleAlert className="h-5 w-5 text-[#ea2e3f]" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#f2f6ff]">Sync Errors</p>
            <p className="mt-1 text-3xl font-semibold leading-none">3</p>
          </article>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row lg:max-w-[710px]">
            <div className="relative w-full md:max-w-[390px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#96a3bc]" />
              <input
                className="h-11 w-full rounded-xl border border-[#d6dce9] bg-white py-2 pl-10 pr-3 text-sm text-[#243251] outline-none transition placeholder:text-[#8f9bb1] focus:border-[#98abcf]"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, SKU, or ASIN..."
                type="text"
                value={searchQuery}
              />
            </div>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-5 text-sm font-semibold text-[#465574] transition hover:bg-[#f8fafe]"
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

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-5 text-sm font-semibold text-[#465574] transition hover:bg-[#f8fafe]"
              type="button"
            >
              <CloudUpload className="h-4 w-4" />
              Import
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#172544] px-5 text-sm font-semibold text-white transition hover:bg-[#101e3b]"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e1e6f0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left">
              <thead className="text-xs font-semibold uppercase tracking-wide text-[#d8e4fb]">
                <tr>
                  <th className="w-14 bg-[#233a69] px-4 py-4 text-center">
                    SL
                  </th>
                  <th className="w-[118px] bg-[#233a69] px-4 py-4">Thumbnail</th>
                  <th className="w-[290px] bg-[#233a69] px-4 py-4">Product Details</th>
                  <th className="w-[130px] bg-[#233a69] px-4 py-4">Stock</th>
                  <th className="w-[170px] bg-[#f8a100] px-4 py-4">
                    <p className="text-sm normal-case leading-none text-white">a Amazon</p>
                    <p className="mt-1 text-[11px] normal-case text-white">Price + Shipping</p>
                  </th>
                  <th className="w-[170px] bg-[#0b72de] px-4 py-4">
                    <p className="text-sm normal-case leading-none text-white">eb eBay</p>
                    <p className="mt-1 text-[11px] normal-case text-white">BIN Price</p>
                  </th>
                  <th className="w-[170px] bg-gradient-to-r from-[#00d4d1] via-[#0ea4d6] to-[#eb0f67] px-4 py-4">
                    <p className="text-sm normal-case leading-none text-white">♪ TikTok</p>
                    <p className="mt-1 text-[11px] normal-case text-white">Shop Price</p>
                  </th>
                  <th className="w-[120px] bg-[#233a69] px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => {
                  const canEdit = globalEditMode;
                  const stockLabel = product.stockStatus === "in_stock" ? "In Stock" : "Low Stock";
                  const stockColor = product.stockStatus === "in_stock" ? "text-[#16c4cb]" : "text-[#d28e10]";

                  const renderMarketCell = (
                    marketName: "amazon" | "ebay" | "tiktok",
                    actionLabel: string,
                    marketData: MarketInfo,
                  ) => {
                    if (marketData.status === "not_listed" && !canEdit) {
                      return (
                        <>
                          <p className="text-sm text-[#97a3ba]">{marketLabels.not_listed}</p>
                          <p className="mt-1 text-xs font-semibold text-[#f03f8f]">+ {actionLabel}</p>
                        </>
                      );
                    }

                    return (
                      <>
                        <div className="relative mx-auto w-[112px]">
                          {canEdit ? (
                            <>
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#95a1b8]">
                                $
                              </span>
                              <input
                                className="h-8 w-full rounded-lg border border-[#cfd8e7] bg-white py-1 pl-6 pr-2 text-center text-sm text-[#3f4d65] outline-none transition focus:border-[#90a5cd]"
                                onChange={(event) => updateMarket(product.id, marketName, event.target.value)}
                                type="text"
                                value={marketData.price}
                              />
                            </>
                          ) : (
                            <div className="mx-auto flex h-8 w-full items-center justify-center rounded-lg border border-transparent bg-transparent px-2 text-sm text-[#3f4d65]">
                              $ {marketData.price || "--"}
                            </div>
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${marketDotClasses[marketData.status]}`} />
                          <span className={`text-xs ${marketLabelClasses[marketData.status]}`}>
                            {marketLabels[marketData.status]}
                          </span>
                        </div>
                      </>
                    );
                  };

                    return (
                      <tr className="border-t border-[#e9eef7] text-sm text-[#44526d]" key={product.id}>
                        <td className="px-4 py-4 text-center">
                          {index + 1}
                        </td>
                      <td className="px-4 py-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${product.thumbTone}`}>
                          <div className="h-7 w-4 rounded-[3px] bg-white/85 shadow-sm" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-lg font-semibold leading-tight text-[#202b44]">{product.name}</p>
                        <p className="mt-1 text-xs text-[#7d89a2]">SKU: {product.sku}</p>
                      </td>
                      <td className="px-4 py-4">
                        {canEdit ? (
                          <input
                            className="h-8 w-[84px] rounded-lg border border-[#cfd8e7] bg-white px-2 text-center text-sm text-[#3f4d65] outline-none transition focus:border-[#90a5cd]"
                            min={0}
                            onChange={(event) => {
                              const stockValue = Number(event.target.value);
                              updateProduct(product.id, "stock", stockValue);
                              updateProduct(product.id, "stockStatus", toStockStatus(stockValue));
                            }}
                            type="number"
                            value={product.stock}
                          />
                        ) : (
                          <div className="mx-auto flex h-8 w-[84px] items-center justify-center rounded-lg border border-transparent bg-transparent px-2 text-center text-sm text-[#3f4d65]">
                            {product.stock}
                          </div>
                        )}
                        <p className={`mt-1 text-center text-xs ${stockColor}`}>{stockLabel}</p>
                      </td>
                      <td className="border-l border-[#ffe0bc] px-4 py-4 text-center">
                        {renderMarketCell("amazon", "Add to Amazon", product.amazon)}
                      </td>
                      <td className="border-l border-[#d2e5ff] px-4 py-4 text-center">
                        {renderMarketCell("ebay", "Add to eBay", product.ebay)}
                      </td>
                      <td className="border-l border-[#f5d4e6] px-4 py-4 text-center">
                        {renderMarketCell("tiktok", "Add to TikTok", product.tiktok)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            className="text-[#223763] transition hover:text-[#121f39]"
                            href={`/products/${product.id}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <button
                            className="text-[#f03f8f] transition hover:text-[#cf216f]"
                            onClick={() => removeProduct(product.id)}
                            type="button"
                          >
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

          {filteredProducts.length === 0 && (
            <div className="border-t border-[#edf1f7] px-4 py-6 text-center text-sm text-[#6f7f9f] md:px-6">
              No products found for &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#e1e6f0] bg-white px-4 py-3 text-xs text-[#7b89a6]">
          <p>Showing 1 to {Math.min(filteredProducts.length, 6)} of 128 results</p>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-[#d7deea] px-3 py-1.5 text-xs text-[#637291]" type="button">
              Previous
            </button>
            <button className="rounded-lg border border-[#d7deea] px-3 py-1.5 text-xs text-[#637291]" type="button">
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
