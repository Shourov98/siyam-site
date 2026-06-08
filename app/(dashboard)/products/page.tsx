"use client";

import {
  AlertTriangle,
  Box,
  CheckCircle2,
  CircleAlert,
  CloudUpload,
  Edit3,
  Filter,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ApiClientError } from "@/lib/auth";
import { productsApi, type ProductListItem, type ShopifyInventoryLevel } from "@/lib/products";

type ExternalMarketState = "empty";

type ProductRow = {
  id: string;
  shopifyProductId: string;
  title: string;
  sku: string;
  vendor: string;
  productType: string;
  status: string;
  stock: number;
  featuredImage?: string;
  shopifyPrice: string;
  shopifyVariantId?: string;
  inventoryItemId?: string;
  inventoryLocationId?: string;
  source: "shopify" | "product_ai";
  createdAt?: string;
  updatedAt?: string;
};

type RowFeedback = {
  tone: "idle" | "saving" | "success" | "error";
  message: string;
};

const EMPTY_MARKET_STATUS: Record<ExternalMarketState, string> = {
  empty: "Empty",
};

function getProductDocumentId(product: ProductListItem) {
  return product._id ?? product.id ?? product.shopifyProductId;
}

function toCurrencyValue(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "--";
  }

  return `$ ${numeric.toFixed(2)}`;
}

function toStockTone(value: number) {
  if (value <= 10) {
    return {
      label: "Low Stock",
      className: "text-[#d28e10]",
    };
  }

  return {
    label: "In Stock",
    className: "text-[#16c4cb]",
  };
}

function buildInventoryLocationMap(levels: ShopifyInventoryLevel[]) {
  return new Map(
    levels
      .filter((level) => level.inventoryItemId && level.locationId)
      .map((level) => [level.inventoryItemId, level.locationId]),
  );
}

function mapProductRows(products: ProductListItem[], inventoryLevels: ShopifyInventoryLevel[]) {
  const inventoryLocationByItemId = buildInventoryLocationMap(inventoryLevels);

  return products.map<ProductRow>((product) => {
    const primaryVariant = product.variants[0];
    const inventoryItemId = primaryVariant?.inventoryItemId;

    return {
      id: getProductDocumentId(product),
      shopifyProductId: product.shopifyProductId,
      title: product.title,
      sku: primaryVariant?.sku ?? "",
      vendor: product.vendor ?? "",
      productType: product.productType ?? "",
      status: product.status ?? "DRAFT",
      stock: primaryVariant?.inventoryQuantity ?? product.totalInventory ?? 0,
      featuredImage: product.featuredImage,
      shopifyPrice: primaryVariant?.price ?? "",
      shopifyVariantId: primaryVariant?.shopifyVariantId,
      inventoryItemId,
      inventoryLocationId: inventoryItemId ? (inventoryLocationByItemId.get(inventoryItemId) ?? "") : "",
      source: "shopify",
      createdAt: product.updatedAt,
      updatedAt: product.updatedAt,
    };
  });
}

type ProductAiListItem = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  normalized_title: string;
  category: string;
  product_type: string;
  preview_image_path: string;
};

function mapProductAiRows(products: ProductAiListItem[]) {
  return products.map<ProductRow>((product) => ({
    id: product.id,
    shopifyProductId: `product-ai:${product.id}`,
    title: product.normalized_title,
    sku: "",
    vendor: "Product AI Agent",
    productType: product.product_type,
    status: product.status ?? "DRAFT",
    stock: 0,
    featuredImage: product.preview_image_path,
    shopifyPrice: "",
    source: "product_ai",
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }));
}

function sortProductRows(rows: ProductRow[]) {
  return [...rows].sort((left, right) => {
    if (left.source !== right.source) {
      return left.source === "product_ai" ? -1 : 1;
    }

    const leftTime = Date.parse(left.updatedAt ?? left.createdAt ?? "");
    const rightTime = Date.parse(right.updatedAt ?? right.createdAt ?? "");
    const safeLeftTime = Number.isFinite(leftTime) ? leftTime : 0;
    const safeRightTime = Number.isFinite(rightTime) ? rightTime : 0;
    return safeRightTime - safeLeftTime;
  });
}

function MarketPlaceholder() {
  return (
    <>
      <div className="mx-auto flex h-8 w-full items-center justify-center rounded-lg px-2 text-sm text-[#97a3ba]">--</div>
      <div className="mt-1 flex items-center justify-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[#d4dceb]" />
        <span className="text-xs text-[#9aa5bc]">{EMPTY_MARKET_STATUS.empty}</span>
      </div>
    </>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [rowFeedbackById, setRowFeedbackById] = useState<Record<string, RowFeedback>>({});

  async function fetchProductsData() {
    const [productItems, inventoryLevels, productAiResponse] = await Promise.all([
      productsApi.getProducts(),
      productsApi.getShopifyInventory(),
      fetch("/api/product-ai/products", { cache: "no-store" }),
    ]);

    if (!productAiResponse.ok) {
      const errorBody = (await productAiResponse.json().catch(() => null)) as { detail?: string } | null;
      throw new Error(errorBody?.detail ?? "Could not load AI-generated products.");
    }

    const productAiItems = (await productAiResponse.json()) as ProductAiListItem[];
    return sortProductRows([...mapProductRows(productItems, inventoryLevels), ...mapProductAiRows(productAiItems)]);
  }

  useEffect(() => {
    let active = true;

    void fetchProductsData()
      .then((rows) => {
        if (!active) {
          return;
        }

        setProducts(rows);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setPageMessage(error instanceof ApiClientError ? error.message : "Could not load product listings.");
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.title.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.shopifyProductId.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);

  const metrics = useMemo(() => {
    const lowStockCount = products.filter((product) => product.source === "shopify" && product.stock <= 10).length;
    const activeListings = products.filter((product) => product.source === "shopify" && product.status.toUpperCase() === "ACTIVE").length;
    const syncErrors = Object.values(rowFeedbackById).filter((feedback) => feedback.tone === "error").length;

    return {
      totalProducts: products.length,
      activeListings,
      lowStockCount,
      syncErrors,
    };
  }, [products, rowFeedbackById]);

  const setRowFeedback = (rowId: string, feedback: RowFeedback) => {
    setRowFeedbackById((prev) => ({
      ...prev,
      [rowId]: feedback,
    }));
  };

  const updateLocalRow = (rowId: string, updater: (row: ProductRow) => ProductRow) => {
    setProducts((prev) => prev.map((row) => (row.id === rowId ? updater(row) : row)));
  };

  const handleImport = async () => {
    setIsImporting(true);
    setPageMessage("");

    try {
      const result = await productsApi.importShopifyProducts();
      const rows = await fetchProductsData();
      setProducts(rows);
      setPageMessage(`Imported ${result.count} Shopify products.`);
    } catch (error) {
      setPageMessage(error instanceof ApiClientError ? error.message : "Could not import Shopify products.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleShopifyPriceChange = (rowId: string, nextPrice: string) => {
    updateLocalRow(rowId, (row) => ({ ...row, shopifyPrice: nextPrice }));
  };

  const handleShopifyPriceSave = async (row: ProductRow) => {
    if (!globalEditMode || row.source !== "shopify" || !row.shopifyVariantId) {
      return;
    }

    const normalizedPrice = row.shopifyPrice.trim();
    const numericPrice = Number(normalizedPrice);

    if (!normalizedPrice || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setRowFeedback(row.id, {
        tone: "error",
        message: "Shopify price must be a valid number.",
      });
      return;
    }

    setRowFeedback(row.id, {
      tone: "saving",
      message: "Updating Shopify price...",
    });

    try {
      const result = await productsApi.updateShopifyVariantPrice(row.shopifyProductId, {
        variantId: row.shopifyVariantId,
        price: numericPrice.toFixed(2),
      });

      updateLocalRow(row.id, (current) => ({
        ...current,
        shopifyPrice: result.price ?? numericPrice.toFixed(2),
      }));
      setRowFeedback(row.id, {
        tone: "success",
        message: "Shopify price updated.",
      });
    } catch (error) {
      setRowFeedback(row.id, {
        tone: "error",
        message: error instanceof ApiClientError ? error.message : "Could not update Shopify price.",
      });
    }
  };

  const handleStockChange = (rowId: string, nextStock: string) => {
    const numericValue = Number(nextStock);
    updateLocalRow(rowId, (row) => ({
      ...row,
      stock: Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0,
    }));
  };

  const handleStockSave = async (row: ProductRow) => {
    if (!globalEditMode || row.source !== "shopify") {
      return;
    }

    if (!row.inventoryItemId || !row.inventoryLocationId) {
      setRowFeedback(row.id, {
        tone: "error",
        message: "No Shopify inventory location was found for this product.",
      });
      return;
    }

    setRowFeedback(row.id, {
      tone: "saving",
      message: "Updating Shopify stock...",
    });

    try {
      await productsApi.updateShopifyInventory(row.inventoryItemId, {
        locationId: row.inventoryLocationId,
        quantity: row.stock,
      });

      setRowFeedback(row.id, {
        tone: "success",
        message: "Shopify stock updated.",
      });
    } catch (error) {
      setRowFeedback(row.id, {
        tone: "error",
        message: error instanceof ApiClientError ? error.message : "Could not update Shopify stock.",
      });
    }
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
            <p className="mt-1 text-3xl font-semibold leading-none">{metrics.totalProducts}</p>
          </article>
          <article className="rounded-2xl bg-[#1a2548] p-4 text-white shadow-[0_18px_40px_-28px_rgba(17,33,64,0.9)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#d2fae7]">
              <CheckCircle2 className="h-5 w-5 text-[#29c5b8]" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#f2f6ff]">Active Shopify Listings</p>
            <p className="mt-1 text-3xl font-semibold leading-none">{metrics.activeListings}</p>
          </article>
          <article className="rounded-2xl bg-[#1a2548] p-4 text-white shadow-[0_18px_40px_-28px_rgba(17,33,64,0.9)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff7cb]">
              <AlertTriangle className="h-5 w-5 text-[#c98510]" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#f2f6ff]">Low Stock</p>
            <p className="mt-1 text-3xl font-semibold leading-none">{metrics.lowStockCount}</p>
          </article>
          <article className="rounded-2xl bg-[#1a2548] p-4 text-white shadow-[0_18px_40px_-28px_rgba(17,33,64,0.9)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffe5e7]">
              <CircleAlert className="h-5 w-5 text-[#ea2e3f]" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#f2f6ff]">Sync Errors</p>
            <p className="mt-1 text-3xl font-semibold leading-none">{metrics.syncErrors}</p>
          </article>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row lg:max-w-[710px]">
            <div className="relative w-full md:max-w-[390px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#96a3bc]" />
              <input
                className="h-11 w-full rounded-xl border border-[#d6dce9] bg-white py-2 pl-10 pr-3 text-sm text-[#243251] outline-none transition placeholder:text-[#8f9bb1] focus:border-[#98abcf]"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, SKU, Shopify ID, or Product AI ID..."
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-5 text-sm font-semibold text-[#465574] transition hover:bg-[#f8fafe] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isImporting}
              onClick={() => void handleImport()}
              type="button"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
              {isImporting ? "Importing..." : "Import Shopify"}
            </button>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#172544] px-5 text-sm font-semibold text-white transition hover:bg-[#101e3b]"
              href="/products/add"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </div>
        </div>

        {pageMessage ? (
          <div className="rounded-xl border border-[#dbe2ee] bg-white px-4 py-3 text-sm text-[#4e5f82] shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
            {pageMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#e1e6f0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left">
              <thead className="text-xs font-semibold uppercase tracking-wide text-[#d8e4fb]">
                <tr>
                  <th className="w-14 bg-[#233a69] px-4 py-4 text-center">SL</th>
                  <th className="w-[118px] bg-[#233a69] px-4 py-4">Thumbnail</th>
                  <th className="w-[320px] bg-[#233a69] px-4 py-4">Product Details</th>
                  <th className="w-[130px] bg-[#233a69] px-4 py-4">Stock</th>
                  <th className="w-[180px] bg-[#1f7a43] px-4 py-4">
                    <p className="text-sm normal-case leading-none text-white">Shopify</p>
                    <p className="mt-1 text-[11px] normal-case text-white">Live Price</p>
                  </th>
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
                  <th className="w-[170px] bg-[#233a69] px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-12 text-center text-sm text-[#6f7f9f]" colSpan={9}>
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading products...
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => {
                    const canEdit = globalEditMode;
                    const stockTone = toStockTone(product.stock);
                    const rowFeedback = rowFeedbackById[product.id] ?? { tone: "idle", message: "" };

                    return (
                      <tr className="border-t border-[#e9eef7] text-sm text-[#44526d]" key={product.id}>
                        <td className="px-4 py-4 text-center">{index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#e3e9f3] bg-[#f7f9fd]">
                            {product.featuredImage ? (
                              <Image
                                alt={product.title}
                                className="h-full w-full object-cover"
                                height={56}
                                src={product.featuredImage}
                                unoptimized
                                width={56}
                              />
                            ) : (
                              <div className="h-8 w-5 rounded-[3px] bg-[#d9e1ef]" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-lg font-semibold leading-tight text-[#202b44]">{product.title}</p>
                          <p className="mt-1 text-xs text-[#7d89a2]">SKU: {product.sku || "--"}</p>
                          <p className="mt-1 text-xs text-[#7d89a2]">
                            {product.vendor || "No vendor"}{product.productType ? ` • ${product.productType}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-[#9aa5bc]">
                            {product.source === "shopify" ? `Shopify: ${product.shopifyProductId}` : `Product AI: ${product.id}`}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {canEdit && product.source === "shopify" ? (
                            <input
                              className="h-8 w-[84px] rounded-lg border border-[#cfd8e7] bg-white px-2 text-center text-sm text-[#3f4d65] outline-none transition focus:border-[#90a5cd]"
                              min={0}
                              onBlur={() => void handleStockSave(product)}
                              onChange={(event) => handleStockChange(product.id, event.target.value)}
                              type="number"
                              value={product.stock}
                            />
                          ) : (
                            <div className="mx-auto flex h-8 w-[84px] items-center justify-center rounded-lg px-2 text-center text-sm text-[#3f4d65]">
                              {product.source === "shopify" ? product.stock : "--"}
                            </div>
                          )}
                          <p className={`mt-1 text-center text-xs ${product.source === "shopify" ? stockTone.className : "text-[#9aa5bc]"}`}>
                            {product.source === "shopify" ? stockTone.label : "Not synced"}
                          </p>
                        </td>
                        <td className="border-l border-[#cce7d7] px-4 py-4 text-center">
                          <div className="relative mx-auto w-[112px]">
                            {canEdit && product.source === "shopify" ? (
                              <>
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#95a1b8]">$</span>
                                <input
                                  className="h-8 w-full rounded-lg border border-[#cfd8e7] bg-white py-1 pl-6 pr-2 text-center text-sm text-[#3f4d65] outline-none transition focus:border-[#90a5cd]"
                                  onBlur={() => void handleShopifyPriceSave(product)}
                                  onChange={(event) => handleShopifyPriceChange(product.id, event.target.value)}
                                  type="text"
                                  value={product.shopifyPrice}
                                />
                              </>
                            ) : (
                              <div className="mx-auto flex h-8 w-full items-center justify-center rounded-lg px-2 text-sm text-[#3f4d65]">
                                {product.source === "shopify" ? toCurrencyValue(product.shopifyPrice) : "--"}
                              </div>
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                product.source === "shopify"
                                  ? product.status.toUpperCase() === "ACTIVE"
                                    ? "bg-[#2bc7c4]"
                                    : "bg-[#e3b101]"
                                  : "bg-[#4a84ef]"
                              }`}
                            />
                            <span className="text-xs text-[#5b6e89]">
                              {product.source === "shopify" ? product.status || "DRAFT" : "AI Draft"}
                            </span>
                          </div>
                        </td>
                        <td className="border-l border-[#ffe0bc] px-4 py-4 text-center">
                          <MarketPlaceholder />
                        </td>
                        <td className="border-l border-[#d2e5ff] px-4 py-4 text-center">
                          <MarketPlaceholder />
                        </td>
                        <td className="border-l border-[#f5d4e6] px-4 py-4 text-center">
                          <MarketPlaceholder />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center gap-2">
                            <Link
                              className="text-[#223763] transition hover:text-[#121f39]"
                              href={product.source === "shopify" ? `/products/${product.id}` : `/products/add?productId=${product.id}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>
                            <p
                              className={`text-center text-xs ${
                                rowFeedback.tone === "error"
                                  ? "text-[#ea2e3f]"
                                  : rowFeedback.tone === "success"
                                    ? "text-[#168b7c]"
                                    : rowFeedback.tone === "saving"
                                      ? "text-[#566b90]"
                                      : "text-[#9aa5bc]"
                              }`}
                            >
                              {rowFeedback.message || (
                                product.source === "shopify"
                                  ? globalEditMode
                                    ? "Blur field to sync Shopify."
                                    : "Shopify-backed row"
                                  : "Uploaded from Product AI Agent"
                              )}
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredProducts.length === 0 ? (
            <div className="border-t border-[#edf1f7] px-4 py-6 text-center text-sm text-[#6f7f9f] md:px-6">
              {products.length === 0 ? "No products found yet. Import Shopify data or upload one from the AI product flow." : `No products found for "${searchQuery}".`}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#e1e6f0] bg-white px-4 py-3 text-xs text-[#7b89a6]">
          <p>Showing {filteredProducts.length} of {products.length} products across Shopify and Product AI Agent</p>
          <div className="text-right text-[#8c99b2]">Marketplace columns remain placeholders until live marketplace listings are connected.</div>
        </div>
      </div>
    </section>
  );
}
