import { requestWithAuth } from "@/lib/auth";

export type ShopifyProductCreatePayload = {
  title: string;
  description?: string;
  vendor?: string;
  productType?: string;
  status: "DRAFT" | "ACTIVE";
  tags: string[];
  variants: Array<{
    title: string;
    price: string;
    sku?: string;
  }>;
};

export type ShopifyCreatedVariant = {
  id: string;
  title: string;
  sku?: string;
  price?: string;
  compareAtPrice?: string;
  inventoryQuantity?: number;
  inventoryItem?: {
    id?: string;
  };
};

export type ShopifyCreatedProduct = {
  id: string;
  title: string;
  descriptionHtml?: string;
  handle?: string;
  vendor?: string;
  productType?: string;
  status?: string;
  tags?: string[];
  totalInventory?: number;
  featuredImage?: {
    url?: string;
  };
  variants?: {
    nodes?: ShopifyCreatedVariant[];
  };
};

export const shopifyProductsApi = {
  createShopifyProduct(payload: ShopifyProductCreatePayload) {
    return requestWithAuth<ShopifyCreatedProduct>("/shopify/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
