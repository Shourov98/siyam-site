import { requestWithAuth } from "@/lib/auth";

export type EbayPublishJob = {
  _id: string;
  userId: string;
  operation: "sync_product" | "sync_inventory" | "sync_price" | "pull_listings" | "publish_listing" | "end_listing";
  productId?: string;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  availableAt: string;
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
  payload?: Record<string, unknown>;
  result?: {
    success?: boolean;
    error?: string;
    retryable?: boolean;
    data?: Record<string, unknown>;
  };
  createdAt: string;
  updatedAt: string;
};

export type EbayListingStatus = {
  productId: string;
  listingId?: string;
  offerId?: string;
  status: string;
  offer?: Record<string, unknown>;
};

export const ebayApi = {
  publishProduct(productId: string) {
    return requestWithAuth<EbayPublishJob>(`/ebay/products/${encodeURIComponent(productId)}/publish`, {
      method: "POST",
    });
  },

  getJob(jobId: string) {
    return requestWithAuth<EbayPublishJob>(`/ebay/jobs/${encodeURIComponent(jobId)}`);
  },

  getProductStatus(productId: string) {
    return requestWithAuth<EbayListingStatus>(`/ebay/products/${encodeURIComponent(productId)}/status`);
  },
};
