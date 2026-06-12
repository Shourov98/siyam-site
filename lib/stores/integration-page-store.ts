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

export type EbayState = {
  connected: boolean;
  displayName: string;
  providerAccountRef: string;
  environment: "sandbox" | "production";
  status: "connected" | "disconnected" | "error" | "not_connected";
  connectedAt: string | null;
  accessTokenExpiresAt: string | null;
};

export const initialShopifyState: ShopifyState = {
  connected: false,
  shopDomain: "",
  status: "not_connected",
  source: "none",
};

export const initialEbayState: EbayState = {
  connected: false,
  displayName: "eBay Seller",
  providerAccountRef: "",
  environment: "sandbox",
  status: "not_connected",
  connectedAt: null,
  accessTokenExpiresAt: null,
};

type IntegrationPageState = {
  banner: BannerState;
  shopifyState: ShopifyState;
  ebayState: EbayState;
  isLoadingStatus: boolean;
  isConnectingShopify: boolean;
  isConnectingEbay: boolean;
  isDisconnectingShopify: boolean;
  isDisconnectingEbay: boolean;
  isSyncingProducts: boolean;
  isSyncingOrders: boolean;
  hasLoadedOnce: boolean;
  lastLoadedAt: number | null;
  shouldRefresh: () => boolean;
  setBanner: (banner: BannerState) => void;
  setConnectingShopify: (value: boolean) => void;
  setConnectingEbay: (value: boolean) => void;
  loadShopifyStatus: () => Promise<void>;
  loadEbayStatus: () => Promise<void>;
  disconnectShopify: () => Promise<void>;
  disconnectEbay: () => Promise<void>;
  syncProducts: () => Promise<void>;
  syncOrders: () => Promise<void>;
};

const INTEGRATION_PAGE_REFRESH_INTERVAL_MS = 60_000;

export const useIntegrationPageStore = create<IntegrationPageState>()(
  persist(
    (set, get) => ({
      banner: null,
      shopifyState: initialShopifyState,
      ebayState: initialEbayState,
      isLoadingStatus: false,
      isConnectingShopify: false,
      isConnectingEbay: false,
      isDisconnectingShopify: false,
      isDisconnectingEbay: false,
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
      setConnectingEbay: (value) => set({ isConnectingEbay: value }),
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
      async loadEbayStatus() {
        try {
          const status = await integrationApi.getEbayStatus();
          set({
            ebayState: {
              connected: status.connected,
              displayName: status.displayName || "eBay Seller",
              providerAccountRef: status.providerAccountRef || "",
              environment: status.environment,
              status: status.status,
              connectedAt: status.connectedAt,
              accessTokenExpiresAt: status.accessTokenExpiresAt,
            },
            hasLoadedOnce: true,
            lastLoadedAt: Date.now(),
          });
        } catch (error) {
          set({
            banner: {
              type: "error",
              message: error instanceof ApiClientError ? error.message : "Failed to load eBay status.",
            },
          });
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
      async disconnectEbay() {
        set({ banner: null, isDisconnectingEbay: true });
        try {
          await integrationApi.disconnectEbay();
          set({
            banner: {
              type: "success",
              message: "eBay disconnected successfully.",
            },
          });
          await get().loadEbayStatus();
        } catch (error) {
          set({
            banner: {
              type: "error",
              message: error instanceof ApiClientError ? error.message : "Failed to disconnect eBay.",
            },
          });
        } finally {
          set({ isDisconnectingEbay: false });
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
        ebayState: state.ebayState,
        hasLoadedOnce: state.hasLoadedOnce,
        lastLoadedAt: state.lastLoadedAt,
      }),
    },
  ),
);
