import { requestWithAuth } from "@/lib/auth";

export type ProductListVariant = {
  shopifyVariantId: string;
  title: string;
  sku?: string;
  price?: string;
  compareAtPrice?: string | null;
  inventoryQuantity?: number;
  inventoryItemId?: string;
};

export type ProductListItem = {
  _id?: string;
  id?: string;
  shopifyProductId: string;
  title: string;
  description?: string;
  handle?: string;
  vendor?: string;
  productType?: string;
  status?: string;
  tags?: string[];
  totalInventory?: number;
  featuredImage?: string;
  variants: ProductListVariant[];
  updatedAt?: string;
};

export type ShopifyInventoryLevel = {
  productId: string;
  productTitle: string;
  variantId: string;
  variantTitle: string;
  inventoryItemId: string;
  sku: string;
  quantity: number;
  locationId: string;
  locationName: string;
};

export type ShopifyVariantPriceResult = {
  id: string;
  price?: string;
  compareAtPrice?: string;
};

export const productsApi = {
  getProducts() {
    return requestWithAuth<ProductListItem[]>("/products");
  },

  importShopifyProducts() {
    return requestWithAuth<{ count: number }>("/shopify/import-products", {
      method: "POST",
    });
  },

  getShopifyInventory() {
    return requestWithAuth<ShopifyInventoryLevel[]>("/shopify/inventory");
  },

  updateShopifyVariantPrice(shopifyProductId: string, payload: { variantId: string; price: string; compareAtPrice?: string }) {
    return requestWithAuth<ShopifyVariantPriceResult>(`/shopify/products/${encodeURIComponent(shopifyProductId)}/price`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  updateShopifyInventory(inventoryItemId: string, payload: { locationId: string; quantity: number }) {
    return requestWithAuth<{ createdAt: string } | null>(`/shopify/inventory/${encodeURIComponent(inventoryItemId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
