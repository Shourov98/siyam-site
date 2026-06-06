import { requestWithAuth } from "@/lib/auth";

type MarketplaceConnection = {
  id: string;
  userId: string;
  marketplace: "shopify";
  shopDomain: string;
  scopes: string[];
  status: "connected" | "disconnected" | "error";
  connectedAt?: string;
  disconnectedAt?: string;
  lastCheckedAt?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type ShopifyStatus = {
  connected: boolean;
  source: "marketplace_connection" | "env_fallback" | "none";
  shop: {
    name: string;
    email: string;
    myshopifyDomain: string;
  } | null;
  connection: MarketplaceConnection | null;
};

export const integrationApi = {
  getShopifyStatus() {
    return requestWithAuth<ShopifyStatus>("/shopify/status");
  },

  getShopifyConnectUrl() {
    return requestWithAuth<{ connectUrl: string }>("/shopify/connect-url");
  },

  disconnectShopify() {
    return requestWithAuth<MarketplaceConnection>("/shopify/disconnect", {
      method: "POST",
    });
  },

  getMarketplaceConnections() {
    return requestWithAuth<MarketplaceConnection[]>("/marketplace-connections");
  },

  importShopifyProducts() {
    return requestWithAuth<{ count: number }>("/shopify/import-products", {
      method: "POST",
    });
  },

  importShopifyOrders() {
    return requestWithAuth<{ count: number }>("/shopify/import-orders", {
      method: "POST",
    });
  },
};
