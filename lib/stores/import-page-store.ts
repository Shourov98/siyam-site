"use client";

import { create } from "zustand";

export type ImportStatus = "imported" | "needs_review" | "duplicate" | "parse_issue" | "uploaded";

export type ImportRow = {
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
  primary_record_id: string | null;
  duplicate_count: number;
  can_upload_as_product: boolean;
  catalog_conflict_product_ids: string[];
};

type ImportListResponse = {
  items: ImportRow[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
};

type PaginationState = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

type ImportPageState = {
  rows: ImportRow[];
  pagination: PaginationState;
  searchQuery: string;
  isLoading: boolean;
  isUploading: boolean;
  busyRecordId: string | null;
  pageMessage: string;
  hasLoadedOnce: boolean;
  setSearchQuery: (value: string) => void;
  loadPage: (page?: number) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  deleteImportRecord: (recordId: string) => Promise<void>;
  uploadAsProduct: (recordId: string) => Promise<void>;
  changePage: (nextPage: number) => Promise<void>;
};

async function fetchImportPage(page: number, pageSize: number) {
  const response = await fetch(`/api/product-ai/imports/products?page=${page}&page_size=${pageSize}`, { cache: "no-store" });
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(errorBody?.detail ?? "Could not load imported products.");
  }

  return (await response.json()) as ImportListResponse;
}

export const useImportPageStore = create<ImportPageState>((set, get) => ({
  rows: [],
  pagination: { page: 1, page_size: 20, total_items: 0, total_pages: 0 },
  searchQuery: "",
  isLoading: true,
  isUploading: false,
  busyRecordId: null,
  pageMessage: "Uploaded import records stay here until you delete them or upload them as products.",
  hasLoadedOnce: false,
  setSearchQuery: (value) => set({ searchQuery: value }),
  async loadPage(page) {
    const targetPage = page ?? get().pagination.page;
    set({ isLoading: true });

    try {
      const payload = await fetchImportPage(targetPage, get().pagination.page_size);
      set({
        rows: payload.items,
        pagination: payload.pagination,
        hasLoadedOnce: true,
      });
    } catch (error) {
      set({
        pageMessage: error instanceof Error ? error.message : "Could not load imported products.",
      });
    } finally {
      set({ isLoading: false });
    }
  },
  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    set({ isUploading: true });

    try {
      const response = await fetch("/api/product-ai/imports/products/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not upload import file.");
      }

      await get().loadPage(1);
      set({ pageMessage: "Import file processed and saved to the database." });
    } catch (error) {
      set({
        pageMessage: error instanceof Error ? error.message : "Could not upload import file.",
      });
    } finally {
      set({ isUploading: false });
    }
  },
  async deleteImportRecord(recordId) {
    set({ busyRecordId: recordId });
    try {
      const response = await fetch(`/api/product-ai/imports/products/${recordId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not delete import record.");
      }

      await get().loadPage(get().pagination.page);
      set({ pageMessage: "Import record deleted." });
    } catch (error) {
      set({
        pageMessage: error instanceof Error ? error.message : "Could not delete import record.",
      });
    } finally {
      set({ busyRecordId: null });
    }
  },
  async uploadAsProduct(recordId) {
    set({ busyRecordId: recordId });
    try {
      const response = await fetch(`/api/product-ai/imports/products/${recordId}/upload-as-product`, { method: "POST" });
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not upload import record as product.");
      }

      await get().loadPage(get().pagination.page);
      set({ pageMessage: "Import record uploaded as a real product and linked." });
    } catch (error) {
      set({
        pageMessage: error instanceof Error ? error.message : "Could not upload import record as product.",
      });
    } finally {
      set({ busyRecordId: null });
    }
  },
  async changePage(nextPage) {
    const { pagination } = get();
    if (nextPage < 1 || (pagination.total_pages > 0 && nextPage > pagination.total_pages)) {
      return;
    }

    await get().loadPage(nextPage);
  },
}));
