"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ApiClientError, AUTH_REQUIRED_MESSAGE, isAuthRequiredError } from "@/lib/auth";
import { productsApi, type InventoryRecord, type ProductListItem, type ShopifyInventoryLevel } from "@/lib/products";

export type InventoryRow = {
  id: string;
  productDocumentId?: string;
  shopifyProductId: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string;
  title: string;
  sku: string;
  featuredImage?: string;
  masterCount: number;
  available: number;
  safetyBuffer: number;
  lowStockThreshold: number;
};

export type InventoryRowFeedback = {
  tone: "idle" | "saving" | "success" | "error";
  message: string;
};

type LoadInventoryOptions = {
  forceRefresh?: boolean;
};

type InventoryPageState = {
  items: InventoryRow[];
  searchQuery: string;
  globalEditMode: boolean;
  isLoading: boolean;
  isImporting: boolean;
  hasHydrated: boolean;
  hasLoadedOnce: boolean;
  lastLoadedAt: number | null;
  pageMessage: string;
  rowFeedbackById: Record<string, InventoryRowFeedback>;
  setSearchQuery: (value: string) => void;
  toggleGlobalEditMode: () => void;
  markHydrated: () => void;
  shouldRefresh: () => boolean;
  loadInventory: (options?: LoadInventoryOptions) => Promise<void>;
  importInventory: () => Promise<void>;
  updateRowFeedback: (rowId: string, feedback: InventoryRowFeedback) => void;
  updateMasterCountDraft: (rowId: string, value: string) => void;
  updateSafetyBufferDraft: (rowId: string, value: string) => void;
  saveMasterCount: (row: InventoryRow) => Promise<void>;
  saveSafetyBuffer: (row: InventoryRow) => Promise<void>;
};

const INVENTORY_PAGE_REFRESH_INTERVAL_MS = 60_000;

function clampNonNegative(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function getDocumentId(record: InventoryRecord) {
  return record._id ?? record.id ?? `${record.inventoryItemId}:${record.locationId ?? ""}`;
}

function getInventoryKey(inventoryItemId: string, locationId?: string | null) {
  return `${inventoryItemId}:${locationId ?? ""}`;
}

function getTimestampValue(value?: string) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getShopifyNumericId(value?: string) {
  if (!value) {
    return 0;
  }

  const match = value.match(/(\d+)(?!.*\d)/);
  return match ? Number(match[1]) : 0;
}

function mapInventoryRows(inventory: InventoryRecord[], products: ProductListItem[], liveLevels: ShopifyInventoryLevel[]) {
  const productByShopifyId = new Map(products.map((product) => [product.shopifyProductId, product]));
  const liveByInventoryKey = new Map(liveLevels.map((level) => [getInventoryKey(level.inventoryItemId, level.locationId), level]));
  const activeInventory = inventory.filter((record) => record.isActive !== false);
  const inventoryByKey = new Map(activeInventory.map((record) => [getInventoryKey(record.inventoryItemId, record.locationId), record]));

  if (liveLevels.length > 0) {
    const rows = liveLevels.map((level) => {
      const key = getInventoryKey(level.inventoryItemId, level.locationId);
      const record = inventoryByKey.get(key);
      const product = productByShopifyId.get(level.productId) ?? (record?.shopifyProductId ? productByShopifyId.get(record.shopifyProductId) : undefined);
      const masterCount = clampNonNegative(level.quantity);
      const safetyBuffer = clampNonNegative(record?.safetyBuffer ?? 0);
      const lowStockThreshold = clampNonNegative(record?.lowStockThreshold ?? 5);
      const derivedId = `${level.inventoryItemId}:${level.locationId || "unknown"}`;
      const rowId = record ? getDocumentId(record) : derivedId;
      const available = clampNonNegative(masterCount - safetyBuffer);

      return {
        id: rowId,
        productDocumentId: product?._id ?? product?.id ?? record?.productId,
        shopifyProductId: record?.shopifyProductId ?? level.productId,
        inventoryItemId: level.inventoryItemId,
        locationId: level.locationId ?? "",
        locationName: record?.locationName ?? level.locationName ?? "Shopify",
        title: product?.title ?? record?.title ?? level.productTitle ?? "Untitled product",
        sku: record?.sku ?? level.sku ?? product?.variants[0]?.sku ?? "N/A",
        featuredImage: product?.featuredImage,
        masterCount,
        available,
        safetyBuffer,
        lowStockThreshold,
        sortUpdatedAt: Math.max(getTimestampValue(product?.updatedAt), getTimestampValue(record?.updatedAt)),
        sortShopifyId: getShopifyNumericId(record?.shopifyProductId ?? level.productId),
      };
    });

    rows.sort((a, b) => {
      if (b.sortUpdatedAt !== a.sortUpdatedAt) {
        return b.sortUpdatedAt - a.sortUpdatedAt;
      }

      return b.sortShopifyId - a.sortShopifyId;
    });

    return rows.map(({ sortUpdatedAt: _sortUpdatedAt, sortShopifyId: _sortShopifyId, ...row }) => row);
  }

  const rows = activeInventory.map((record) => {
    const product = record.shopifyProductId ? productByShopifyId.get(record.shopifyProductId) : undefined;
    const liveLevel = liveByInventoryKey.get(getInventoryKey(record.inventoryItemId, record.locationId));
    const masterCount = clampNonNegative(liveLevel?.quantity ?? record.shopifyQuantity ?? 0);
    const safetyBuffer = clampNonNegative(record.safetyBuffer ?? 0);
    const available = clampNonNegative(masterCount - safetyBuffer);
    const lowStockThreshold = clampNonNegative(record.lowStockThreshold ?? 5);

    return {
      id: getDocumentId(record),
      productDocumentId: product?._id ?? product?.id ?? record.productId,
      shopifyProductId: record.shopifyProductId ?? product?.shopifyProductId ?? "",
      inventoryItemId: record.inventoryItemId,
      locationId: record.locationId ?? "",
      locationName: record.locationName ?? liveLevel?.locationName ?? "",
      title: product?.title ?? record.title ?? liveLevel?.productTitle ?? "Untitled product",
      sku: record.sku ?? liveLevel?.sku ?? product?.variants[0]?.sku ?? "",
      featuredImage: product?.featuredImage,
      masterCount,
      available,
      safetyBuffer,
      lowStockThreshold,
      sortUpdatedAt: Math.max(getTimestampValue(product?.updatedAt), getTimestampValue(record.updatedAt)),
      sortShopifyId: getShopifyNumericId(record.shopifyProductId ?? product?.shopifyProductId),
    };
  });

  rows.sort((a, b) => {
    if (b.sortUpdatedAt !== a.sortUpdatedAt) {
      return b.sortUpdatedAt - a.sortUpdatedAt;
    }

    return b.sortShopifyId - a.sortShopifyId;
  });

  return rows.map(({ sortUpdatedAt: _sortUpdatedAt, sortShopifyId: _sortShopifyId, ...row }) => row);
}

async function fetchInventoryData() {
  const [inventory, products, liveInventory] = await Promise.all([
    productsApi.getInventory(),
    productsApi.getProducts(),
    productsApi.getShopifyInventory(),
  ]);

  return mapInventoryRows(inventory, products, liveInventory);
}

const resetInventoryState = () => ({
  items: [],
  hasLoadedOnce: false,
  lastLoadedAt: null,
  rowFeedbackById: {},
});

export const useInventoryPageStore = create<InventoryPageState>()(
  persist(
    (set, get) => ({
      items: [],
      searchQuery: "",
      globalEditMode: false,
      isLoading: false,
      isImporting: false,
      hasHydrated: false,
      hasLoadedOnce: false,
      lastLoadedAt: null,
      pageMessage: "",
      rowFeedbackById: {},
      setSearchQuery: (value) => set({ searchQuery: value }),
      toggleGlobalEditMode: () => set((state) => ({ globalEditMode: !state.globalEditMode })),
      markHydrated: () => set({ hasHydrated: true }),
      shouldRefresh: () => {
        const { lastLoadedAt } = get();
        return !lastLoadedAt || Date.now() - lastLoadedAt > INVENTORY_PAGE_REFRESH_INTERVAL_MS;
      },
      async loadInventory(options) {
        const forceRefresh = options?.forceRefresh ?? false;
        const state = get();

        if (state.isLoading && state.hasLoadedOnce && !forceRefresh) {
          return;
        }

        set({ isLoading: true });

        try {
          const rows = await fetchInventoryData();
          set({
            items: rows,
            hasLoadedOnce: true,
            lastLoadedAt: Date.now(),
            pageMessage: "",
          });
        } catch (error) {
          if (isAuthRequiredError(error)) {
            set({
              ...resetInventoryState(),
              pageMessage: AUTH_REQUIRED_MESSAGE,
            });
            return;
          }

          set({
            pageMessage: error instanceof ApiClientError ? error.message : "Could not load inventory.",
          });
        } finally {
          set({ isLoading: false });
        }
      },
      async importInventory() {
        set({ isImporting: true, pageMessage: "" });

        try {
          const result = await productsApi.importShopifyProducts();
          await get().loadInventory({ forceRefresh: true });
          const staleCount = result.staleMarkedInactiveCount ?? 0;
          set({
            pageMessage:
              staleCount > 0 ? `Inventory refreshed. ${staleCount} stale rows hidden.` : `Imported ${result.count} Shopify products and refreshed inventory.`,
          });
        } catch (error) {
          if (isAuthRequiredError(error)) {
            set({
              ...resetInventoryState(),
              pageMessage: AUTH_REQUIRED_MESSAGE,
            });
            return;
          }

          set({
            pageMessage: error instanceof ApiClientError ? error.message : "Could not import Shopify inventory.",
          });
        } finally {
          set({ isImporting: false });
        }
      },
      updateRowFeedback: (rowId, feedback) =>
        set((state) => ({
          rowFeedbackById: {
            ...state.rowFeedbackById,
            [rowId]: feedback,
          },
        })),
      updateMasterCountDraft: (rowId, value) => {
        const numericValue = Number(value);
        set((state) => ({
          items: state.items.map((item) =>
            item.id === rowId
              ? {
                  ...item,
                  masterCount: Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0,
                  available: Math.max(0, (Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0) - item.safetyBuffer),
                }
              : item,
          ),
        }));
      },
      updateSafetyBufferDraft: (rowId, value) => {
        const numericValue = Number(value);
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== rowId) {
              return item;
            }

            const nextSafetyBuffer = Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
            return {
              ...item,
              safetyBuffer: nextSafetyBuffer,
              available: Math.max(0, item.masterCount - nextSafetyBuffer),
            };
          }),
        }));
      },
      async saveMasterCount(row) {
        const { globalEditMode } = get();
        if (!globalEditMode) {
          return;
        }

        if (!row.locationId) {
          get().updateRowFeedback(row.id, {
            tone: "error",
            message: "No Shopify location is available for this inventory row.",
          });
          return;
        }

        get().updateRowFeedback(row.id, {
          tone: "saving",
          message: "Updating Shopify inventory...",
        });

        try {
          await productsApi.updateShopifyInventory(row.inventoryItemId, {
            locationId: row.locationId,
            quantity: row.masterCount,
          });
          await get().loadInventory({ forceRefresh: true });
          get().updateRowFeedback(row.id, {
            tone: "success",
            message: "Shopify inventory updated.",
          });
        } catch (error) {
          get().updateRowFeedback(row.id, {
            tone: "error",
            message: error instanceof ApiClientError ? error.message : "Could not update Shopify inventory.",
          });
        }
      },
      async saveSafetyBuffer(row) {
        const { globalEditMode } = get();
        if (!globalEditMode) {
          return;
        }

        get().updateRowFeedback(row.id, {
          tone: "saving",
          message: "Saving safety buffer...",
        });

        try {
          await productsApi.updateInventorySafetyBuffer(row.id, row.safetyBuffer);
          await get().loadInventory({ forceRefresh: true });
          get().updateRowFeedback(row.id, {
            tone: "success",
            message: "Safety buffer updated.",
          });
        } catch (error) {
          get().updateRowFeedback(row.id, {
            tone: "error",
            message: error instanceof ApiClientError ? error.message : "Could not update safety buffer.",
          });
        }
      },
    }),
    {
      name: "commandctr-inventory-page",
      partialize: (state) => ({
        items: state.items,
        searchQuery: state.searchQuery,
        globalEditMode: state.globalEditMode,
        hasLoadedOnce: state.hasLoadedOnce,
        lastLoadedAt: state.lastLoadedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        state.markHydrated();
      },
    },
  ),
);
