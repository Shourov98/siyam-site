"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ApiClientError } from "@/lib/auth";
import { integrationApi } from "@/lib/integrations";

export type BannerState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

export type ShopifyState = {
  connected: boolean;
  shopDomain: string;
  status: "connected" | "disconnected" | "error" | "not_connected";
  source: "marketplace_connection" | "env_fallback" | "none";
};

export const initialShopifyState: ShopifyState = {
  connected: false,
  shopDomain: "",
  status: "not_connected",
  source: "none",
};

type IntegrationPageState = {
  banner: BannerState;
  shopifyState: ShopifyState;
  isLoadingStatus: boolean;
  isConnectingShopify: boolean;
  isDisconnectingShopify: boolean;
  isSyncingProducts: boolean;
  isSyncingOrders: boolean;
  hasLoadedOnce: boolean;
  lastLoadedAt: number | null;
  shouldRefresh: () => boolean;
  setBanner: (banner: BannerState) => void;
  setConnectingShopify: (value: boolean) => void;
  loadShopifyStatus: () => Promise<void>;
  disconnectShopify: () => Promise<void>;
  syncProducts: () => Promise<void>;
  syncOrders: () => Promise<void>;
};

const INTEGRATION_PAGE_REFRESH_INTERVAL_MS = 60_000;

export const useIntegrationPageStore = create<IntegrationPageState>()(
  persist(
    (set, get) => ({
      banner: null,
      shopifyState: initialShopifyState,
      isLoadingStatus: false,
      isConnectingShopify: false,
      isDisconnectingShopify: false,
      isSyncingProducts: false,
      isSyncingOrders: false,
      hasLoadedOnce: false,
      lastLoadedAt: null,
      shouldRefresh: () => {
        const { lastLoadedAt } = get();
        return !lastLoadedAt || Date.now() - lastLoadedAt > INTEGRATION_PAGE_REFRESH_INTERVAL_MS;
      },
      setBanner: (banner) => set({ banner }),
      setConnectingShopify: (value) => set({ isConnectingShopify: value }),
      async loadShopifyStatus() {
        const state = get();
        if (state.isLoadingStatus && state.hasLoadedOnce) {
          return;
        }

        set({ isLoadingStatus: true });

        try {
          const status = await integrationApi.getShopifyStatus();
          set({
            shopifyState: {
              connected: status.connected,
              shopDomain: status.shop?.myshopifyDomain ?? status.connection?.shopDomain ?? "",
              status: status.connection?.status ?? (status.connected ? "connected" : "not_connected"),
              source: status.source,
            },
            hasLoadedOnce: true,
            lastLoadedAt: Date.now(),
          });
        } catch (error) {
          set({
            banner: {
              type: "error",
              message: error instanceof ApiClientError ? error.message : "Failed to load Shopify status.",
            },
          });
        } finally {
          set({ isLoadingStatus: false });
        }
      },
      async disconnectShopify() {
        set({ banner: null, isDisconnectingShopify: true });
        try {
          await integrationApi.disconnectShopify();
          set({
            banner: {
              type: "success",
              message: "Shopify disconnected successfully.",
            },
          });
          await get().loadShopifyStatus();
        } catch (error) {
          set({
            banner: {
              type: "error",
              message: error instanceof ApiClientError ? error.message : "Failed to disconnect Shopify.",
            },
          });
        } finally {
          set({ isDisconnectingShopify: false });
        }
      },
      async syncProducts() {
        set({ banner: null, isSyncingProducts: true });
        try {
          await integrationApi.importShopifyProducts();
          set({
            banner: {
              type: "success",
              message: "Shopify products imported successfully",
            },
          });
          await get().loadShopifyStatus();
        } catch (error) {
          set({
            banner: {
              type: "error",
              message: error instanceof ApiClientError ? error.message : "Failed to import Shopify products.",
            },
          });
        } finally {
          set({ isSyncingProducts: false });
        }
      },
      async syncOrders() {
        set({ banner: null, isSyncingOrders: true });
        try {
          await integrationApi.importShopifyOrders();
          set({
            banner: {
              type: "success",
              message: "Shopify orders imported successfully",
            },
          });
          await get().loadShopifyStatus();
        } catch (error) {
          set({
            banner: {
              type: "error",
              message: error instanceof ApiClientError ? error.message : "Failed to import Shopify orders.",
            },
          });
        } finally {
          set({ isSyncingOrders: false });
        }
      },
    }),
    {
      name: "commandctr-integration-page",
      partialize: (state) => ({
        banner: state.banner,
        shopifyState: state.shopifyState,
        hasLoadedOnce: state.hasLoadedOnce,
        lastLoadedAt: state.lastLoadedAt,
      }),
    },
  ),
);
