"use client";

import {
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Image as ImageIcon,
  LoaderCircle,
  PackageCheck,
  Plus,
  RefreshCcw,
  Sparkles,
  Tags,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { ApiClientError, authStorage } from "@/lib/auth";
import { shopifyProductsApi } from "@/lib/shopify-products";

type MarketKey = "amazon" | "ebay" | "etsy" | "tiktok" | "shopify";

type ApiImageValidation = {
  passed: boolean;
  width: number | null;
  height: number | null;
  format: string | null;
  has_alpha: boolean | null;
  file_size_bytes: number;
  expected_width: number | null;
  expected_height: number | null;
  expected_background: string;
  errors: string[];
  mime_type: string;
};

type ApiImageVariant = {
  marketplace: string;
  relative_path: string;
  absolute_path: string;
  prompt: string;
  generation_mode: string;
  mime_type: string;
  validation: ApiImageValidation;
};

type ApiGeneratedImages = {
  source: ApiImageVariant;
  transparent_cutout: ApiImageVariant | null;
  amazon: ApiImageVariant;
  ebay: ApiImageVariant;
  etsy: ApiImageVariant;
  tiktok: ApiImageVariant;
  shopify: ApiImageVariant;
};

type ApiCore = {
  normalized_title: string;
  category: string;
  product_type: string;
  product_summary: string;
  features: string[];
  attributes: Record<string, string>;
  source_title: string;
  vision_confidence: number;
};

type ExtendedApiCore = ApiCore & {
  brand?: string;
};

type ApiAmazon = {
  title: string;
  bullet_points: string[];
  description: string;
  backend_search_terms: string[];
  structured_attributes: Record<string, string>;
};

type ApiEbay = {
  title: string;
  item_specifics: Record<string, string>;
  condition: string;
  listing_notes: string;
};

type ApiTiktok = {
  title: string;
  social_description: string;
  hashtags: string[];
};

type ApiShopify = {
  title: string;
  body_html: string;
  tags: string[];
  product_type: string;
  seo_title: string;
  seo_description: string;
};

type ApiEtsy = {
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  occasion: string;
  seo_keywords: string[];
};

type ApiProduct = {
  core: ApiCore;
  amazon: ApiAmazon;
  ebay: ApiEbay;
  etsy: ApiEtsy;
  tiktok: ApiTiktok;
  shopify: ApiShopify;
  images: ApiGeneratedImages;
};

type ApiVariant = {
  id: string;
  marketplace: MarketKey;
  variant_type: "size" | "color";
  name: string;
  value: string;
  image: ApiImageVariant | null;
  created_at: string;
};

type ApiRecord = {
  id: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  run_id: string;
  product: ApiProduct;
  variants: Record<MarketKey, ApiVariant[]>;
};

type ApiRepricingDecision = {
  recommended_price: number;
  action: "lower" | "raise" | "hold";
  strategy_used: string;
  reason: string;
  confidence: number;
  margin_at_new_price: number;
  guardrails_applied: boolean;
};

type ApiRepricingResult = {
  asin: string;
  product_name: string;
  category: string;
  marketplace: string;
  timestamp: string;
  demand_signal: string;
  pricing: {
    old_price: number;
    new_price: number;
    price_delta: number;
    price_changed: boolean;
    list_price: number;
    cost_price: number;
  };
  ai_decision: ApiRepricingDecision;
  data_source: string;
};

type ApiProductRepricing = {
  product_id: string;
  matched_product: {
    asin: string;
    title: string;
    category: string;
    confidence: number;
    source: string;
  };
  repricing: ApiRepricingResult;
};

type MarketActionState = Record<MarketKey, boolean>;
type PublishTarget = "commandctr" | MarketKey;
type PublishActionState = Record<PublishTarget, boolean>;
type PublishStatus = "DRAFT" | "ACTIVE";
type SavedDraftSnapshot = {
  draft: ApiProduct;
  variantsByMarket: Record<MarketKey, ApiVariant[]>;
  productId: string | null;
  shopifyProductId: string | null;
  sourceTitle: string;
  publishVendor: string;
  publishPrice: string;
  publishSku: string;
  publishStatus: PublishStatus;
  savedAt: string;
};

type PublishFieldErrors = {
  title: boolean;
  price: boolean;
};

type DraftSaveState = "idle" | "saving" | "saved";
type ShopifyUploadMode = "active" | "draft";

const marketOrder: MarketKey[] = ["amazon", "ebay", "etsy", "tiktok", "shopify"];

const marketLabels: Record<MarketKey, string> = {
  amazon: "Amazon",
  ebay: "eBay",
  etsy: "Etsy",
  tiktok: "TikTok Shop",
  shopify: "Shopify",
};

const emptyActionState: MarketActionState = {
  amazon: false,
  ebay: false,
  etsy: false,
  tiktok: false,
  shopify: false,
};

const emptyPublishState: PublishActionState = {
  commandctr: false,
  amazon: false,
  ebay: false,
  etsy: false,
  tiktok: false,
  shopify: false,
};

const publishStatusOptions: PublishStatus[] = ["DRAFT", "ACTIVE"];
const draftStorageKey = "commandctr-add-product-draft";
const emptyPublishFieldErrors: PublishFieldErrors = {
  title: false,
  price: false,
};

const sampleProduct: ApiProduct = {
  core: {
    normalized_title: "AuroraFlow Vacuum Bottle",
    category: "Drinkware & Hydration",
    product_type: "water bottle",
    product_summary:
      "AuroraFlow Vacuum Bottle is positioned within drinkware and hydration, built around a water bottle use case with navy blue, stainless steel, and modern styling cues.",
    features: [
      "Crafted with a stainless steel finish for everyday durability.",
      "Presented in a navy blue colorway for a clear merchandising identity.",
      "Designed as a water bottle with a versatile, easy-to-list profile.",
      "Visual styling leans modern, making it suitable for premium marketplace presentation.",
      "Search-relevant title terms include auroraflow vacuum bottle.",
    ],
    attributes: {
      color: "navy blue",
      material: "stainless steel",
      style: "modern",
      capacity: "32 oz",
      lid: "leak-resistant twist cap",
    },
    source_title: "AuroraFlow Vacuum Bottle",
    vision_confidence: 0.91,
  },
  amazon: {
    title: "AuroraFlow Vacuum Bottle Navy Blue Stainless Steel",
    bullet_points: [
      "Stainless steel construction designed for dependable everyday use.",
      "Navy blue finish gives the product a premium, clean shelf presence.",
      "Leak-resistant twist cap helps reduce spills during travel or commuting.",
      "32 oz capacity supports all-day hydration without constant refills.",
      "Modern silhouette works well across lifestyle and utility-driven marketplaces.",
    ],
    description:
      "AuroraFlow Vacuum Bottle brings together a clean navy presentation, durable stainless steel construction, and a travel-friendly twist cap for a premium hydration product that merchandises well online.",
    backend_search_terms: ["vacuum bottle", "stainless steel bottle", "navy bottle", "travel bottle", "32 oz bottle"],
    structured_attributes: {
      Color: "Navy Blue",
      Material: "Stainless Steel",
      Capacity: "32 oz",
      Style: "Modern",
    },
  },
  ebay: {
    title: "AuroraFlow Vacuum Bottle - Navy Blue",
    item_specifics: {
      Brand: "AuroraFlow",
      Type: "Water Bottle",
      Color: "Navy Blue",
      Material: "Stainless Steel",
      Capacity: "32 oz",
    },
    condition: "New",
    listing_notes:
      "Ready for a clean eBay listing with concise item specifics and consistent naming across channels.",
  },
  etsy: {
    title: "AuroraFlow Vacuum Bottle Navy Blue Stainless Steel Gift Ready",
    description:
      "AuroraFlow Vacuum Bottle combines a clean navy finish with durable stainless steel construction for a polished, giftable everyday hydration product.",
    tags: [
      "water bottle",
      "stainless steel",
      "navy blue",
      "gift idea",
      "hydration",
      "modern bottle",
      "travel bottle",
      "everyday use",
    ],
    materials: ["stainless steel"],
    occasion: "everyday use",
    seo_keywords: ["water bottle", "stainless steel bottle", "navy bottle", "giftable drinkware", "modern bottle"],
  },
  tiktok: {
    title: "Navy Blue AuroraFlow Vacuum Bottle",
    social_description:
      "Premium hydration with a clean navy finish, leak-resistant cap, and stainless steel build that feels elevated in short-form commerce.",
    hashtags: ["#AuroraFlow", "#WaterBottle", "#Hydration", "#NavyBlue", "#TikTokMadeMeBuyIt"],
  },
  shopify: {
    title: "AuroraFlow Vacuum Bottle | Navy Blue",
    body_html:
      "<p>AuroraFlow Vacuum Bottle combines durable stainless steel construction with a modern navy finish for a premium hydration product.</p><ul><li>32 oz capacity</li><li>Leak-resistant twist cap</li><li>Designed for everyday carry</li></ul>",
    tags: ["water bottle", "hydration", "stainless steel", "navy blue", "modern drinkware"],
    product_type: "Water Bottle",
    seo_title: "AuroraFlow Vacuum Bottle | Drinkware & Hydration",
    seo_description:
      "Explore AuroraFlow Vacuum Bottle with stainless steel construction, navy finish, and a leak-resistant cap built for daily hydration.",
  },
  images: {
    source: {
      marketplace: "source",
      relative_path: "",
      absolute_path: "",
      prompt: "Original uploaded image saved for audit and downstream editing.",
      generation_mode: "source_passthrough",
      mime_type: "image/jpeg",
      validation: {
        passed: true,
        width: 2048,
        height: 2048,
        format: "JPEG",
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: null,
        expected_height: null,
        expected_background: "source",
        errors: [],
        mime_type: "image/jpeg",
      },
    },
    transparent_cutout: {
      marketplace: "transparent_cutout",
      relative_path: "",
      absolute_path: "",
      prompt: "Background removed for editing.",
      generation_mode: "edited",
      mime_type: "image/png",
      validation: {
        passed: true,
        width: 1024,
        height: 1024,
        format: "PNG",
        has_alpha: true,
        file_size_bytes: 0,
        expected_width: 1024,
        expected_height: 1024,
        expected_background: "transparent",
        errors: [],
        mime_type: "image/png",
      },
    },
    amazon: {
      marketplace: "amazon",
      relative_path: "",
      absolute_path: "",
      prompt: "Amazon image",
      generation_mode: "local_composite_from_cutout",
      mime_type: "image/png",
      validation: {
        passed: true,
        width: 1024,
        height: 1024,
        format: "PNG",
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: 1024,
        expected_height: 1024,
        expected_background: "white",
        errors: [],
        mime_type: "image/png",
      },
    },
    ebay: {
      marketplace: "ebay",
      relative_path: "",
      absolute_path: "",
      prompt: "eBay image",
      generation_mode: "local_composite_from_cutout",
      mime_type: "image/png",
      validation: {
        passed: true,
        width: 1024,
        height: 1024,
        format: "PNG",
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: 1024,
        expected_height: 1024,
        expected_background: "white",
        errors: [],
        mime_type: "image/png",
      },
    },
    etsy: {
      marketplace: "etsy",
      relative_path: "",
      absolute_path: "",
      prompt: "Etsy image",
      generation_mode: "local_composite_from_cutout",
      mime_type: "image/png",
      validation: {
        passed: true,
        width: 1200,
        height: 900,
        format: "PNG",
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: 1200,
        expected_height: 900,
        expected_background: "opaque",
        errors: [],
        mime_type: "image/png",
      },
    },
    tiktok: {
      marketplace: "tiktok",
      relative_path: "",
      absolute_path: "",
      prompt: "TikTok image",
      generation_mode: "edited",
      mime_type: "image/png",
      validation: {
        passed: false,
        width: 1024,
        height: 1536,
        format: "PNG",
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: 1024,
        expected_height: 1536,
        expected_background: "opaque",
        errors: ["Review product color consistency before publish."],
        mime_type: "image/png",
      },
    },
    shopify: {
      marketplace: "shopify",
      relative_path: "",
      absolute_path: "",
      prompt: "Shopify image",
      generation_mode: "edited",
      mime_type: "image/png",
      validation: {
        passed: true,
        width: 1536,
        height: 1536,
        format: "PNG",
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: 1536,
        expected_height: 1536,
        expected_background: "opaque",
        errors: [],
        mime_type: "image/png",
      },
    },
  },
};

const sampleVariants: Record<MarketKey, ApiVariant[]> = {
  amazon: [],
  ebay: [],
  etsy: [],
  tiktok: [],
  shopify: [],
};

function toLines(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toAttributes(value: string) {
  return Object.fromEntries(
    value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf(":");
        if (separatorIndex === -1) {
          return [entry, ""];
        }

        return [entry.slice(0, separatorIndex).trim(), entry.slice(separatorIndex + 1).trim()];
      })
      .filter(([key, fieldValue]) => key || fieldValue),
  );
}

function imageUrlFor(pathValue: string) {
  if (!pathValue) {
    return null;
  }

  if (pathValue.startsWith("http://") || pathValue.startsWith("https://")) {
    return pathValue;
  }

  return `/api/product-ai/image?path=${encodeURIComponent(pathValue)}`;
}

function ProductPreview({
  image,
  alt,
  backgroundLabel,
}: {
  image: ApiImageVariant | null;
  alt: string;
  backgroundLabel: string;
}) {
  const src = image ? imageUrlFor(image.absolute_path) : null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasLoadError = Boolean(src && failedSrc === src);

  if (src && !hasLoadError) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#dbe2ee] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={alt}
          className="aspect-[4/3] w-full object-contain bg-white"
          onError={() => setFailedSrc(src)}
          src={src}
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-[#d4ddec] bg-[#f8fbff] p-4 text-center text-xs text-[#667a99]">
      {hasLoadError
        ? "Preview file is not reachable from this local app. This usually happens when the draft was generated on the remote Product AI service and the image only exists on that server."
        : `${backgroundLabel} preview will appear here after generation.`}
    </div>
  );
}

function MarketTabLink({
  market,
  activeMarket,
  productId,
}: {
  market: MarketKey;
  activeMarket: MarketKey;
  productId: string | null;
}) {
  const active = market === activeMarket;
  const suffix = productId ? `&productId=${productId}` : "";
  return (
    <Link
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-[#1b2748] text-white" : "bg-[#edf2fb] text-[#49607f] hover:bg-[#dfe9fb]"
      }`}
      href={`/products/add?market=${market}${suffix}`}
      scroll={false}
    >
      {marketLabels[market]}
    </Link>
  );
}

function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  invalid = false,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  invalid?: boolean;
  helperText?: string;
}) {
  return (
    <label
      className={`block rounded-2xl border bg-[#f8fbff] p-4 ${
        invalid ? "border-[#ef6b6b] bg-[#fff7f7]" : "border-[#dbe2ee]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">{label}</p>
      {helperText ? <p className={`mt-1 text-xs ${invalid ? "text-[#cf4b4b]" : "text-[#8ea0bf]"}`}>{helperText}</p> : null}
      {multiline ? (
        <textarea
          className={`mt-2 min-h-28 w-full rounded-xl bg-white px-3 py-3 text-sm text-[#31415e] outline-none transition ${
            invalid ? "border border-[#ef6b6b] focus:border-[#ef6b6b]" : "border border-[#d4ddec] focus:border-[#97abd0]"
          }`}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      ) : (
        <input
          className={`mt-2 h-11 w-full rounded-xl bg-white px-3 text-sm text-[#31415e] outline-none transition ${
            invalid ? "border border-[#ef6b6b] focus:border-[#ef6b6b]" : "border border-[#d4ddec] focus:border-[#97abd0]"
          }`}
          onChange={(event) => onChange(event.target.value)}
          type="text"
          value={value}
        />
      )}
    </label>
  );
}

function EditableListField({
  label,
  values,
  onChange,
  helperText,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  helperText: string;
}) {
  return (
    <label className="block rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">{label}</p>
      <p className="mt-1 text-xs text-[#8ea0bf]">{helperText}</p>
      <textarea
        className="mt-3 min-h-36 w-full rounded-xl border border-[#d4ddec] bg-white px-3 py-3 text-sm leading-6 text-[#31415e] outline-none transition focus:border-[#97abd0]"
        onChange={(event) => onChange(toLines(event.target.value))}
        value={values.join("\n")}
      />
    </label>
  );
}

function EditableAttributesField({
  label,
  attributes,
  onChange,
}: {
  label: string;
  attributes: Record<string, string>;
  onChange: (attributes: Record<string, string>) => void;
}) {
  return (
    <label className="block rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">{label}</p>
      <p className="mt-1 text-xs text-[#8ea0bf]">Use one line per attribute in the format `name: value`.</p>
      <textarea
        className="mt-3 min-h-36 w-full rounded-xl border border-[#d4ddec] bg-white px-3 py-3 text-sm leading-6 text-[#31415e] outline-none transition focus:border-[#97abd0]"
        onChange={(event) => onChange(toAttributes(event.target.value))}
        value={Object.entries(attributes)
          .map(([key, fieldValue]) => `${key}: ${fieldValue}`)
          .join("\n")}
      />
    </label>
  );
}

function getStoredDraftKey() {
  const session = authStorage.load();
  return session?.user?.id ? `${draftStorageKey}:${session.user.id}` : draftStorageKey;
}

export default function AddProductEditor({
  activeMarket,
  initialProductId,
}: {
  activeMarket: MarketKey;
  initialProductId: string | null;
}) {
  const router = useRouter();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const lastSavedDraftRef = useRef<string | null>(null);
  const [draft, setDraft] = useState<ApiProduct>(sampleProduct);
  const [variantsByMarket, setVariantsByMarket] = useState<Record<MarketKey, ApiVariant[]>>(sampleVariants);
  const [productId, setProductId] = useState<string | null>(initialProductId);
  const [statusMessage, setStatusMessage] = useState("Choose an image and generate a product draft.");
  const [sourceTitle, setSourceTitle] = useState(sampleProduct.core.source_title);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>("idle");
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [marketRegenerating, setMarketRegenerating] = useState<MarketActionState>(emptyActionState);
  const [variantSubmitting, setVariantSubmitting] = useState<MarketActionState>(emptyActionState);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRepricing, setIsRepricing] = useState(false);
  const [publishSubmitting, setPublishSubmitting] = useState<PublishActionState>(emptyPublishState);
  const [publishVendor, setPublishVendor] = useState("");
  const [publishPrice, setPublishPrice] = useState("");
  const [publishSku, setPublishSku] = useState("");
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("ACTIVE");
  const [shopifyProductId, setShopifyProductId] = useState<string | null>(null);
  const [shopifySubmitMode, setShopifySubmitMode] = useState<ShopifyUploadMode | null>(null);
  const [shopifyPublishMessage, setShopifyPublishMessage] = useState("");
  const [repricingResult, setRepricingResult] = useState<ApiProductRepricing | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);
  const [publishFieldErrors, setPublishFieldErrors] = useState<PublishFieldErrors>(emptyPublishFieldErrors);
  const [restoredLocalDraftProductId, setRestoredLocalDraftProductId] = useState<string | null | undefined>(undefined);
  const [hasInitializedDraftStorage, setHasInitializedDraftStorage] = useState(false);
  const [variantInputs, setVariantInputs] = useState<Record<MarketKey, { size: string; color: string }>>({
    amazon: { size: "", color: "" },
    ebay: { size: "", color: "" },
    etsy: { size: "", color: "" },
    tiktok: { size: "", color: "" },
    shopify: { size: "", color: "" },
  });

  const hasPersistedProduct = Boolean(productId);

  function buildDraftSnapshot(): SavedDraftSnapshot {
    return {
      draft,
      variantsByMarket,
      productId,
      shopifyProductId,
      sourceTitle,
      publishVendor,
      publishPrice,
      publishSku,
      publishStatus,
      savedAt: new Date().toISOString(),
    };
  }

  function buildComparableDraftSignature(snapshot: SavedDraftSnapshot) {
    return JSON.stringify({
      draft: snapshot.draft,
      variantsByMarket: snapshot.variantsByMarket,
      productId: snapshot.productId,
      shopifyProductId: snapshot.shopifyProductId,
      sourceTitle: snapshot.sourceTitle,
      publishVendor: snapshot.publishVendor,
      publishPrice: snapshot.publishPrice,
      publishSku: snapshot.publishSku,
      publishStatus: snapshot.publishStatus,
    });
  }

  function persistDraftSnapshot(snapshot: SavedDraftSnapshot) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(getStoredDraftKey(), JSON.stringify(snapshot));
    lastSavedDraftRef.current = buildComparableDraftSignature(snapshot);
    setHasSavedDraft(true);
  }

  function applySavedDraft(snapshot: SavedDraftSnapshot, message: string) {
    setDraft(snapshot.draft);
    setVariantsByMarket(snapshot.variantsByMarket);
    setProductId(snapshot.productId);
    setShopifyProductId(snapshot.shopifyProductId);
    setSourceTitle(snapshot.sourceTitle);
    setPublishVendor(snapshot.publishVendor);
    setPublishPrice(snapshot.publishPrice);
    setPublishSku(snapshot.publishSku);
    setPublishStatus(snapshot.publishStatus);
    setShopifyPublishMessage("");
    setHasSavedDraft(true);
    setDraftSaveState("saved");
    setPublishFieldErrors(emptyPublishFieldErrors);
    setStatusMessage(message);
  }

  function resetDraftEditor(message: string) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(getStoredDraftKey());
    }

    setDraft(sampleProduct);
    setVariantsByMarket(sampleVariants);
    setProductId(null);
    setShopifyProductId(null);
    setSourceTitle(sampleProduct.core.source_title);
    setSelectedImage(null);
    setPublishVendor("");
    setPublishPrice("");
    setPublishSku("");
    setPublishStatus("ACTIVE");
    setShopifyPublishMessage("");
    setRepricingResult(null);
    setPublishFieldErrors(emptyPublishFieldErrors);
    setVariantInputs({
      amazon: { size: "", color: "" },
      ebay: { size: "", color: "" },
      etsy: { size: "", color: "" },
      tiktok: { size: "", color: "" },
      shopify: { size: "", color: "" },
    });
    setHasSavedDraft(false);
    setDraftSaveState("idle");
    lastSavedDraftRef.current = null;
    setRestoredLocalDraftProductId(undefined);
    setStatusMessage(message);
    router.replace(`/products/add?market=${activeMarket}`, { scroll: false });
  }

  function clearSavedDraft() {
    resetDraftEditor("Draft cleared for this account.");
  }

  function loadSavedDraft() {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(getStoredDraftKey());
    if (!raw) {
      setHasSavedDraft(false);
      setStatusMessage("No saved draft was found for this account.");
      return;
    }

    try {
      const snapshot = JSON.parse(raw) as SavedDraftSnapshot;
      applySavedDraft(snapshot, "Saved draft loaded for this account.");
      setRestoredLocalDraftProductId(snapshot.productId);
    } catch {
      window.localStorage.removeItem(getStoredDraftKey());
      setHasSavedDraft(false);
      setStatusMessage("Saved draft data was invalid and has been cleared.");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(getStoredDraftKey());
    if (!raw) {
      window.setTimeout(() => {
        setHasInitializedDraftStorage(true);
      }, 0);
      return;
    }

    try {
      const snapshot = JSON.parse(raw) as SavedDraftSnapshot;
      window.setTimeout(() => {
        setHasSavedDraft(true);
      }, 0);

      const matchesCurrentDraft = !initialProductId || snapshot.productId === initialProductId;
      if (matchesCurrentDraft) {
        window.setTimeout(() => {
          applySavedDraft(snapshot, "Saved draft restored for this account.");
          setRestoredLocalDraftProductId(snapshot.productId);
          setHasInitializedDraftStorage(true);
        }, 0);
      } else {
        window.setTimeout(() => {
          setRestoredLocalDraftProductId(undefined);
          setHasInitializedDraftStorage(true);
        }, 0);
      }
    } catch {
      window.localStorage.removeItem(getStoredDraftKey());
      window.setTimeout(() => {
        setHasSavedDraft(false);
        setRestoredLocalDraftProductId(undefined);
        setHasInitializedDraftStorage(true);
      }, 0);
    }
  }, [initialProductId]);

  useEffect(() => {
    if (!initialProductId) {
      return;
    }

    if (restoredLocalDraftProductId === initialProductId) {
      return;
    }

    let active = true;

    async function loadProduct() {
      setIsLoadingProduct(true);
      try {
        const response = await fetch(`/api/product-ai/products/${initialProductId}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not load the saved product draft.");
        }

        const record = (await response.json()) as ApiRecord;
        if (!active) {
          return;
        }

        setProductId(record.id);
        setShopifyProductId(null);
        setRepricingResult(null);
        setDraft(record.product);
        setVariantsByMarket(record.variants);
        setSourceTitle(record.product.core.source_title);
        setDraftSaveState("saved");
        setStatusMessage(`Loaded draft ${record.id.slice(0, 8)} for editing.`);
      } catch (error) {
        if (!active) {
          return;
        }

        setStatusMessage(error instanceof Error ? error.message : "Failed to load the product draft.");
      } finally {
        if (active) {
          setIsLoadingProduct(false);
        }
      }
    }

    void loadProduct();

    return () => {
      active = false;
    };
  }, [initialProductId, restoredLocalDraftProductId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!hasInitializedDraftStorage) {
      return;
    }

    const snapshot: SavedDraftSnapshot = {
      draft,
      variantsByMarket,
      productId,
      shopifyProductId,
      sourceTitle,
      publishVendor,
      publishPrice,
      publishSku,
      publishStatus,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(getStoredDraftKey(), JSON.stringify(snapshot));
    window.setTimeout(() => {
      setHasSavedDraft(true);
    }, 0);
  }, [draft, hasInitializedDraftStorage, productId, publishPrice, publishSku, publishStatus, publishVendor, shopifyProductId, sourceTitle, variantsByMarket]);

  const currentDraftComparableSignature = useMemo(
    () =>
      buildComparableDraftSignature({
        draft,
        variantsByMarket,
        productId,
        shopifyProductId,
        sourceTitle,
        publishVendor,
        publishPrice,
        publishSku,
        publishStatus,
        savedAt: "",
      }),
    [draft, variantsByMarket, productId, shopifyProductId, sourceTitle, publishVendor, publishPrice, publishSku, publishStatus],
  );

  useEffect(() => {
    if (!lastSavedDraftRef.current) {
      setDraftSaveState("idle");
      return;
    }

    setDraftSaveState(lastSavedDraftRef.current === currentDraftComparableSignature ? "saved" : "idle");
  }, [currentDraftComparableSignature]);

  const imageCards = useMemo(
    () => [
      { key: "source", label: "Source Upload", image: draft.images.source, note: "Original upload stored for audit and regeneration." },
      { key: "transparent_cutout", label: "Transparent Cutout", image: draft.images.transparent_cutout, note: "Used for white-background and styled marketplace compositions." },
      { key: "amazon", label: "Amazon Main", image: draft.images.amazon, note: "Marketplace-ready main image." },
      { key: "ebay", label: "eBay Main", image: draft.images.ebay, note: "Marketplace-ready main image." },
      { key: "etsy", label: "Etsy Hero", image: draft.images.etsy, note: "Styled Etsy marketplace image." },
      { key: "tiktok", label: "TikTok Hero", image: draft.images.tiktok, note: "Styled vertical marketplace image." },
      { key: "shopify", label: "Shopify Hero", image: draft.images.shopify, note: "Storefront hero image." },
    ],
    [draft.images],
  );

  function applyRecord(record: ApiRecord, message: string) {
    setProductId(record.id);
    setDraft(record.product);
    setVariantsByMarket(record.variants);
    setSourceTitle(record.product.core.source_title);
    setPublishSku((current) => current || record.id.slice(0, 12).toUpperCase());
    setRepricingResult(null);
    setDraftSaveState("saved");
    setStatusMessage(message);
  }

  function getPublishTitle() {
    return (
      draft.shopify.title.trim() ||
      draft.core.normalized_title.trim() ||
      draft.core.source_title.trim()
    );
  }

  function getPublishDescription() {
    return draft.shopify.body_html.trim() || draft.core.product_summary.trim() || "";
  }

  function getPublishVendor() {
    const brand = (draft.core as ExtendedApiCore).brand?.trim() ?? "";
    return publishVendor.trim() || brand || "";
  }

  function getPublishProductType() {
    return (
      draft.shopify.product_type.trim() ||
      draft.core.product_type.trim() ||
      draft.core.category.trim() ||
      ""
    );
  }

  function getPublishCategory() {
    return draft.core.category.trim() || draft.core.product_type.trim() || "";
  }

  function getPublishTags() {
    if (Array.isArray(draft.shopify.tags)) {
      return draft.shopify.tags.map((tag) => tag.trim()).filter(Boolean);
    }

    return [];
  }

  function getPublishImagePath() {
    return draft.images.shopify.absolute_path || draft.images.shopify.relative_path || "";
  }

  async function uploadToShopify(mode: ShopifyUploadMode) {
    const title = getPublishTitle();
    const trimmedPrice = publishPrice.trim();
    const imagePath = getPublishImagePath().trim();
    setShopifyPublishMessage("");
    const nextFieldErrors: PublishFieldErrors = {
      title: !title,
      price: !trimmedPrice,
    };
    setPublishFieldErrors(nextFieldErrors);
    const missingFields: string[] = [];
    if (nextFieldErrors.title) {
      missingFields.push("Product title");
    }
    if (nextFieldErrors.price) {
      missingFields.push("Default price");
    }
    if (missingFields.length > 0) {
      setShopifyPublishMessage(`Required before Shopify upload: ${missingFields.join(", ")}.`);
      setStatusMessage(`Please fill the required publish fields: ${missingFields.join(", ")}.`);
      return;
    }

    if (!imagePath) {
      const message = "Generated Shopify image is missing. Generate or regenerate Shopify content before uploading.";
      setShopifyPublishMessage(message);
      setStatusMessage(message);
      return;
    }

    const numericPrice = Number(trimmedPrice);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setPublishFieldErrors((prev) => ({ ...prev, price: true }));
      setShopifyPublishMessage("Default price must be a valid number greater than or equal to 0.");
      setStatusMessage("Price must be a valid number greater than or equal to 0.");
      return;
    }

    if (!publishStatusOptions.includes(publishStatus)) {
      setShopifyPublishMessage("Shopify status must be either DRAFT or ACTIVE.");
      setStatusMessage("Status must be either DRAFT or ACTIVE.");
      return;
    }

    const isUpdate = Boolean(shopifyProductId);
    const resolvedStatus: PublishStatus = mode === "draft" ? "DRAFT" : "ACTIVE";

    setShopifySubmitMode(mode);
    setPublishSubmitting((prev) => ({ ...prev, shopify: true }));
    setShopifyPublishMessage(
      mode === "draft"
        ? isUpdate
          ? "Updating draft product on Shopify..."
          : "Uploading draft product to Shopify..."
        : isUpdate
          ? "Updating Shopify product..."
          : "Uploading product to Shopify...",
    );
    try {
      const payload = {
        title,
        description: getPublishDescription(),
        vendor: getPublishVendor() || undefined,
        productType: getPublishProductType() || undefined,
        category: getPublishCategory() || undefined,
        status: resolvedStatus,
        tags: getPublishTags(),
        imagePath,
        publishToOnlineStore: mode === "active",
        variants: [
          {
            title: "Default Title",
            price: numericPrice.toFixed(2),
            sku: publishSku.trim() || undefined,
          },
        ],
      };

      let result;

      try {
        result = shopifyProductId
          ? await shopifyProductsApi.updateShopifyProduct(shopifyProductId, payload)
          : await shopifyProductsApi.createShopifyProduct(payload);
      } catch (error) {
        const isMissingExistingProduct =
          shopifyProductId &&
          error instanceof ApiClientError &&
          error.message.toLowerCase().includes("product does not exist");

        if (!isMissingExistingProduct) {
          throw error;
        }

        setShopifyProductId(null);
        persistDraftSnapshot({
          ...buildDraftSnapshot(),
          shopifyProductId: null,
        });

        const message =
          "No Shopify draft was found for this product. The old Shopify link was cleared. Click Upload as Draft or Upload to Shopify again.";
        setShopifyPublishMessage(message);
        setStatusMessage(message);
        return;
      }

      setShopifyProductId(result.product.id);
      const warningsText = result.warnings.length ? ` Warnings: ${result.warnings.join(" ")}` : "";
      const successMessage =
        mode === "draft"
          ? `${isUpdate ? "Draft updated" : "Draft uploaded"} to Shopify.${warningsText}`
          : result.publishedToOnlineStore
            ? `${isUpdate ? "Product updated" : "Product uploaded"} to Shopify and published to the Online Store.${warningsText}`
            : `${isUpdate ? "Product updated" : "Product uploaded"} to Shopify.${warningsText}`;

      setShopifyPublishMessage(successMessage);
      setStatusMessage(successMessage);
      persistDraftSnapshot({
        ...buildDraftSnapshot(),
        shopifyProductId: result.product.id,
      });
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Could not upload the product to Shopify.";
      setShopifyPublishMessage(message);
      setStatusMessage(message);
    } finally {
      setShopifySubmitMode(null);
      setPublishSubmitting((prev) => ({ ...prev, shopify: false }));
    }
  }

  async function generateProduct() {
    if (!selectedImage) {
      setStatusMessage("Upload a product image before generating.");
      return;
    }

    if (!sourceTitle.trim()) {
      setStatusMessage("Add a source title before generating.");
      return;
    }

    const formData = new FormData();
    formData.append("title", sourceTitle.trim());
    formData.append("image", selectedImage);

    setIsGenerating(true);
    try {
      const response = await fetch("/api/product-ai/products/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Product generation failed.");
      }

      const record = (await response.json()) as ApiRecord;
      setShopifyProductId(null);
      setRepricingResult(null);
      applyRecord(record, "AI draft generated and connected to the add-product page.");
      router.replace(`/products/add?market=${activeMarket}&productId=${record.id}`, { scroll: false });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Product generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveDraft() {
    persistDraftSnapshot(buildDraftSnapshot());
    setDraftSaveState("saving");

    if (!productId) {
      setDraftSaveState("saved");
      setStatusMessage("Draft saved locally for this account. Generate with AI later if you want to sync it to product-ai-agent.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/product-ai/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          core: draft.core,
          amazon: draft.amazon,
          ebay: draft.ebay,
          etsy: draft.etsy,
          tiktok: draft.tiktok,
          shopify: draft.shopify,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Draft save failed.");
      }

      const record = (await response.json()) as ApiRecord;
      applyRecord(record, "Draft saved to product-ai-agent and kept locally for this account.");
      persistDraftSnapshot({
        ...buildDraftSnapshot(),
        productId: record.id,
      });
      setDraftSaveState("saved");
    } catch (error) {
      setDraftSaveState("idle");
      setStatusMessage(error instanceof Error ? error.message : "Draft save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteDraft() {
    const savedProductId = productId;

    setIsDeletingDraft(true);
    try {
      if (savedProductId) {
        const response = await fetch(`/api/product-ai/products/${savedProductId}`, {
          method: "DELETE",
        });

        if (!response.ok && response.status !== 404 && response.status !== 405) {
          const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
          throw new Error(errorBody?.detail ?? "Draft delete failed.");
        }
      }

      resetDraftEditor(
        savedProductId
          ? "Draft deleted locally. Backend draft was removed when supported by the upstream service."
          : "Local draft deleted.",
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Draft delete failed.");
    } finally {
      setIsDeletingDraft(false);
    }
  }

  async function optimizeMarketplace(market: MarketKey) {
    if (!productId) {
      setStatusMessage("Generate a product before optimizing marketplace content.");
      return;
    }

    setMarketRegenerating((prev) => ({ ...prev, [market]: true }));
    try {
      const response = await fetch(`/api/product-ai/products/${productId}/marketplaces/${market}/optimize`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? `Could not optimize ${marketLabels[market]}.`);
      }

      const record = (await response.json()) as ApiRecord;
      applyRecord(record, `${marketLabels[market]} product data optimized.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `Could not optimize ${marketLabels[market]}.`);
    } finally {
      setMarketRegenerating((prev) => ({ ...prev, [market]: false }));
    }
  }

  async function optimizeAllMarketplaces() {
    if (!productId) {
      setStatusMessage("Generate a product before running optimization.");
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await fetch(`/api/product-ai/products/${productId}/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketplaces: marketOrder,
          optimize_core: true,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not optimize product data.");
      }

      const record = (await response.json()) as ApiRecord;
      applyRecord(record, "Core product data and all marketplace content optimized from the backend.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not optimize product data.");
    } finally {
      setIsOptimizing(false);
    }
  }

  async function analyzeDynamicPricing() {
    if (!productId) {
      setStatusMessage("Generate a product before running dynamic pricing analysis.");
      return;
    }

    setIsRepricing(true);
    try {
      const response = await fetch(`/api/product-ai/products/${productId}/repricing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategy: "auto",
          dry_run: true,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not analyze dynamic pricing.");
      }

      const result = (await response.json()) as ApiProductRepricing;
      const recommendedPrice = result.repricing.ai_decision.recommended_price.toFixed(2);
      setRepricingResult(result);
      setPublishPrice(recommendedPrice);
      setPublishFieldErrors((prev) => ({ ...prev, price: false }));
      setStatusMessage(
        `Dynamic pricing analyzed from matched ASIN ${result.matched_product.asin}. Default price updated to ${recommendedPrice}.`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not analyze dynamic pricing.");
    } finally {
      setIsRepricing(false);
    }
  }

  function updateVariantInput(market: MarketKey, field: "size" | "color", value: string) {
    setVariantInputs((prev) => ({
      ...prev,
      [market]: {
        ...prev[market],
        [field]: value,
      },
    }));
  }

  async function addVariant(market: MarketKey, type: "size" | "color") {
    if (!productId) {
      setStatusMessage("Generate a product before adding marketplace variants.");
      return;
    }

    const rawValue = variantInputs[market][type].trim();
    if (!rawValue) {
      setStatusMessage(`Add a ${type} value before creating a new ${marketLabels[market]} variant.`);
      return;
    }

    setVariantSubmitting((prev) => ({ ...prev, [market]: true }));
    try {
      const response = await fetch(`/api/product-ai/products/${productId}/marketplaces/${market}/variants/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: rawValue, value: rawValue }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? `Could not add the ${type} variant.`);
      }

      const record = (await response.json()) as ApiRecord;
      applyRecord(
        record,
        type === "color"
          ? `${marketLabels[market]} color variant added with a generated image.`
          : `${marketLabels[market]} size variant added.`,
      );
      setVariantInputs((prev) => ({
        ...prev,
        [market]: {
          ...prev[market],
          [type]: "",
        },
      }));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `Could not add the ${type} variant.`);
    } finally {
      setVariantSubmitting((prev) => ({ ...prev, [market]: false }));
    }
  }

  function onFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedImage(file);
    if (file) {
      setStatusMessage(`Selected source image: ${file.name}`);
    }
  }

  const currentVariants = variantsByMarket[activeMarket] ?? [];

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <input
        accept="image/*"
        className="hidden"
        onChange={onFileSelected}
        ref={uploadInputRef}
        type="file"
      />

      <div className="space-y-6">
        <header className="rounded-2xl border border-[#2b3a5f] bg-[#1a2545] px-5 py-5 text-white shadow-[0_16px_35px_-24px_rgba(7,17,41,0.95)]">
          <p className="text-xs font-semibold text-[#aab8d6]">Products &nbsp;&gt;&nbsp; Add Product</p>
          <div className="mt-3 flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-2xl font-semibold">Add Product</h1>
                <p className="mt-1 text-sm text-[#8ea0bf]">
                  This page is now connected to `product-ai-agent` for generation, editing, variants, and marketplace regeneration.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#51658f] bg-white/5 px-3 py-2 text-xs font-semibold text-[#dce7fb]">
                  {statusMessage}
                </span>
                {productId ? (
                  <span className="rounded-full border border-[#51658f] bg-white/5 px-3 py-2 text-xs font-semibold text-[#dce7fb]">
                    Product ID: {productId.slice(0, 8)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <input
                className={`h-11 rounded-xl bg-white/5 px-3 text-sm text-white outline-none transition placeholder:text-[#aab8d6] ${
                  publishFieldErrors.title ? "border border-[#ff7d7d] focus:border-[#ff9b9b]" : "border border-[#51658f] focus:border-[#8ea0bf]"
                }`}
                onChange={(event) => {
                  const value = event.target.value;
                  setSourceTitle(value);
                  setDraft((prev) => ({ ...prev, core: { ...prev.core, source_title: value } }));
                  if (publishFieldErrors.title && value.trim()) {
                    setPublishFieldErrors((prev) => ({ ...prev, title: false }));
                  }
                }}
                placeholder="Source title used for generation"
                type="text"
                value={sourceTitle}
              />
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#51658f] bg-white/5 px-4 text-sm font-semibold text-white"
                onClick={() => uploadInputRef.current?.click()}
                type="button"
              >
                <Upload className="h-4 w-4" />
                {selectedImage ? selectedImage.name : "Upload Product"}
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#35d3ce] px-5 text-sm font-semibold text-[#153c53] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isGenerating}
                onClick={() => void generateProduct()}
                type="button"
              >
                {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? "Generating..." : "Generate with AI"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#51658f] bg-white/5 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!hasPersistedProduct || isOptimizing}
                onClick={() => void optimizeAllMarketplaces()}
                type="button"
              >
                {isOptimizing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isOptimizing ? "Optimizing..." : "Optimize All Marketplaces"}
              </button>
              <button
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#51658f] bg-white/5 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!hasSavedDraft}
                onClick={() => loadSavedDraft()}
                type="button"
              >
                Load Draft
              </button>
              <button
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#51658f] bg-transparent px-4 text-sm font-semibold text-[#dce7fb] transition hover:bg-white/5"
                onClick={() => clearSavedDraft()}
                type="button"
              >
                Clear Draft
              </button>
              <button
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#7d3b45] bg-[#2b1016] px-4 text-sm font-semibold text-[#ffd8de] transition hover:bg-[#39151d] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeletingDraft}
                onClick={() => void deleteDraft()}
                type="button"
              >
                {isDeletingDraft ? "Deleting..." : "Delete Draft"}
              </button>
              <p className="text-xs text-[#aab8d6]">
                Draft changes are also saved locally for this account so they survive reloads and sign-ins.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_380px]">
          <div className="space-y-5">
            <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#4d77bc]">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1f2c44]">Core Product Data</h2>
                  <p className="text-sm text-[#7f92b1]">This block saves back to the product-ai-agent draft record.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <EditableField
                  label="Normalized Title"
                  onChange={(value) => setDraft((prev) => ({ ...prev, core: { ...prev.core, normalized_title: value } }))}
                  value={draft.core.normalized_title}
                />
                <EditableField
                  label="Category"
                  onChange={(value) => setDraft((prev) => ({ ...prev, core: { ...prev.core, category: value } }))}
                  value={draft.core.category}
                />
                <EditableField
                  label="Product Type"
                  onChange={(value) => setDraft((prev) => ({ ...prev, core: { ...prev.core, product_type: value } }))}
                  value={draft.core.product_type}
                />
                <EditableField
                  label="Source Title"
                  onChange={(value) => {
                    setSourceTitle(value);
                    setDraft((prev) => ({ ...prev, core: { ...prev.core, source_title: value } }));
                  }}
                  value={draft.core.source_title}
                />
              </div>

              <div className="mt-4">
                <EditableField
                  label="Product Summary"
                  multiline
                  onChange={(value) => setDraft((prev) => ({ ...prev, core: { ...prev.core, product_summary: value } }))}
                  value={draft.core.product_summary}
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <EditableListField
                  helperText="One feature per line"
                  label="Generated Features"
                  onChange={(values) => setDraft((prev) => ({ ...prev, core: { ...prev.core, features: values } }))}
                  values={draft.core.features}
                />
                <EditableAttributesField
                  attributes={draft.core.attributes}
                  label="Structured Attributes"
                  onChange={(attributes) => setDraft((prev) => ({ ...prev, core: { ...prev.core, attributes } }))}
                />
              </div>
            </article>

            <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1f2c44]">Marketplace Content</h2>
                  <p className="text-sm text-[#7f92b1]">You can edit per-marketplace content and optimize the active marketplace data from the backend.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {marketOrder.map((marketKey) => (
                    <MarketTabLink activeMarket={activeMarket} key={marketKey} market={marketKey} productId={productId} />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-4 text-sm font-semibold text-[#4a5d7d] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!hasPersistedProduct || marketRegenerating[activeMarket]}
                  onClick={() => void optimizeMarketplace(activeMarket)}
                  type="button"
                >
                  {marketRegenerating[activeMarket] ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  {marketRegenerating[activeMarket] ? "Optimizing..." : `Optimize ${marketLabels[activeMarket]}`}
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                {activeMarket === "amazon" ? (
                  <>
                    <EditableField
                      label="Marketplace Title"
                      onChange={(value) => setDraft((prev) => ({ ...prev, amazon: { ...prev.amazon, title: value } }))}
                      value={draft.amazon.title}
                    />
                    <EditableListField
                      helperText="One bullet point per line"
                      label="Bullet Points"
                      onChange={(values) => setDraft((prev) => ({ ...prev, amazon: { ...prev.amazon, bullet_points: values } }))}
                      values={draft.amazon.bullet_points}
                    />
                    <EditableField
                      label="Description"
                      multiline
                      onChange={(value) => setDraft((prev) => ({ ...prev, amazon: { ...prev.amazon, description: value } }))}
                      value={draft.amazon.description}
                    />
                    <EditableListField
                      helperText="One search term per line"
                      label="Backend Search Terms"
                      onChange={(values) => setDraft((prev) => ({ ...prev, amazon: { ...prev.amazon, backend_search_terms: values } }))}
                      values={draft.amazon.backend_search_terms}
                    />
                    <EditableAttributesField
                      attributes={draft.amazon.structured_attributes}
                      label="Structured Attributes"
                      onChange={(attributes) => setDraft((prev) => ({ ...prev, amazon: { ...prev.amazon, structured_attributes: attributes } }))}
                    />
                  </>
                ) : null}

                {activeMarket === "ebay" ? (
                  <>
                    <EditableField
                      label="Marketplace Title"
                      onChange={(value) => setDraft((prev) => ({ ...prev, ebay: { ...prev.ebay, title: value } }))}
                      value={draft.ebay.title}
                    />
                    <EditableField
                      label="Condition"
                      onChange={(value) => setDraft((prev) => ({ ...prev, ebay: { ...prev.ebay, condition: value } }))}
                      value={draft.ebay.condition}
                    />
                    <EditableField
                      label="Listing Notes"
                      multiline
                      onChange={(value) => setDraft((prev) => ({ ...prev, ebay: { ...prev.ebay, listing_notes: value } }))}
                      value={draft.ebay.listing_notes}
                    />
                    <EditableAttributesField
                      attributes={draft.ebay.item_specifics}
                      label="Item Specifics"
                      onChange={(attributes) => setDraft((prev) => ({ ...prev, ebay: { ...prev.ebay, item_specifics: attributes } }))}
                    />
                  </>
                ) : null}

                {activeMarket === "tiktok" ? (
                  <>
                    <EditableField
                      label="Marketplace Title"
                      onChange={(value) => setDraft((prev) => ({ ...prev, tiktok: { ...prev.tiktok, title: value } }))}
                      value={draft.tiktok.title}
                    />
                    <EditableField
                      label="Social Description"
                      multiline
                      onChange={(value) => setDraft((prev) => ({ ...prev, tiktok: { ...prev.tiktok, social_description: value } }))}
                      value={draft.tiktok.social_description}
                    />
                    <EditableListField
                      helperText="One hashtag per line"
                      label="Hashtags"
                      onChange={(values) => setDraft((prev) => ({ ...prev, tiktok: { ...prev.tiktok, hashtags: values } }))}
                      values={draft.tiktok.hashtags}
                    />
                  </>
                ) : null}

                {activeMarket === "etsy" ? (
                  <>
                    <EditableField
                      label="Marketplace Title"
                      onChange={(value) => setDraft((prev) => ({ ...prev, etsy: { ...prev.etsy, title: value } }))}
                      value={draft.etsy.title}
                    />
                    <EditableField
                      label="Description"
                      multiline
                      onChange={(value) => setDraft((prev) => ({ ...prev, etsy: { ...prev.etsy, description: value } }))}
                      value={draft.etsy.description}
                    />
                    <EditableListField
                      helperText="One tag per line"
                      label="Tags"
                      onChange={(values) => setDraft((prev) => ({ ...prev, etsy: { ...prev.etsy, tags: values } }))}
                      values={draft.etsy.tags}
                    />
                    <EditableListField
                      helperText="One material per line"
                      label="Materials"
                      onChange={(values) => setDraft((prev) => ({ ...prev, etsy: { ...prev.etsy, materials: values } }))}
                      values={draft.etsy.materials}
                    />
                    <EditableField
                      label="Occasion"
                      onChange={(value) => setDraft((prev) => ({ ...prev, etsy: { ...prev.etsy, occasion: value } }))}
                      value={draft.etsy.occasion}
                    />
                    <EditableListField
                      helperText="One SEO keyword per line"
                      label="SEO Keywords"
                      onChange={(values) => setDraft((prev) => ({ ...prev, etsy: { ...prev.etsy, seo_keywords: values } }))}
                      values={draft.etsy.seo_keywords}
                    />
                  </>
                ) : null}

                {activeMarket === "shopify" ? (
                  <>
                    <EditableField
                      label="Storefront Title"
                      onChange={(value) => setDraft((prev) => ({ ...prev, shopify: { ...prev.shopify, title: value } }))}
                      helperText={publishFieldErrors.title ? "Required for Shopify publish." : undefined}
                      invalid={publishFieldErrors.title}
                      value={draft.shopify.title}
                    />
                    <EditableField
                      label="Product Type"
                      onChange={(value) => setDraft((prev) => ({ ...prev, shopify: { ...prev.shopify, product_type: value } }))}
                      value={draft.shopify.product_type}
                    />
                    <EditableField
                      label="SEO Title"
                      onChange={(value) => setDraft((prev) => ({ ...prev, shopify: { ...prev.shopify, seo_title: value } }))}
                      value={draft.shopify.seo_title}
                    />
                    <EditableField
                      label="SEO Description"
                      multiline
                      onChange={(value) => setDraft((prev) => ({ ...prev, shopify: { ...prev.shopify, seo_description: value } }))}
                      value={draft.shopify.seo_description}
                    />
                    <EditableListField
                      helperText="One tag per line"
                      label="Tags"
                      onChange={(values) => setDraft((prev) => ({ ...prev, shopify: { ...prev.shopify, tags: values } }))}
                      values={draft.shopify.tags}
                    />
                    <EditableField
                      label="Body HTML"
                      multiline
                      onChange={(value) => setDraft((prev) => ({ ...prev, shopify: { ...prev.shopify, body_html: value } }))}
                      value={draft.shopify.body_html}
                    />
                  </>
                ) : null}
              </div>
            </article>

            <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1f2c44]">Publish Targets</h2>
                  <p className="text-sm text-[#7f92b1]">Upload the current product data to supported CommandCtr marketplace backends.</p>
                </div>
                <div className="rounded-full bg-[#eef5ff] px-3 py-2 text-xs font-semibold text-[#4d6284]">
                  Active market: {marketLabels[activeMarket]}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <EditableField
                  label="Vendor / Brand"
                  onChange={setPublishVendor}
                  value={publishVendor}
                />
                <EditableField
                  label="Default Price"
                  helperText={publishFieldErrors.price ? "Required for Shopify publish." : undefined}
                  invalid={publishFieldErrors.price}
                  onChange={(value) => {
                    setPublishPrice(value);
                    if (publishFieldErrors.price && value.trim()) {
                      setPublishFieldErrors((prev) => ({ ...prev, price: false }));
                    }
                  }}
                  value={publishPrice}
                />
                <EditableField
                  label="Default SKU"
                  onChange={setPublishSku}
                  value={publishSku}
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Primary Upload Status</p>
                  <p className="mt-1 text-xs text-[#8ea0bf]">`Upload to Shopify` always creates or updates an ACTIVE Shopify product. `Upload as Draft` always forces DRAFT.</p>
                  <select
                    className="mt-2 h-11 w-full rounded-xl border border-[#d4ddec] bg-[#f3f6fb] px-3 text-sm text-[#31415e] outline-none transition"
                    disabled
                    value={publishStatus}
                  >
                    {publishStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] px-4 py-4 text-sm leading-6 text-[#667a99]">
                  MVP publish sends basic Shopify product fields only. Images, inventory, SEO, and variants will be added later.
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Dynamic Pricing</p>
                    <p className="mt-1 text-sm text-[#6f82a3]">
                      Match this generated product to the repricing dataset and calculate a recommended sell price.
                    </p>
                  </div>
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-4 text-sm font-semibold text-[#4a5d7d] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!hasPersistedProduct || isRepricing}
                    onClick={() => void analyzeDynamicPricing()}
                    type="button"
                  >
                    {isRepricing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    {isRepricing ? "Analyzing..." : "Analyze Dynamic Pricing"}
                  </button>
                </div>

                {repricingResult ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Matched ASIN</p>
                      <p className="mt-2 text-sm font-semibold text-[#31415e]">{repricingResult.matched_product.asin}</p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">{Math.round(repricingResult.matched_product.confidence * 100)}% confidence</p>
                    </div>
                    <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Recommended Price</p>
                      <p className="mt-2 text-sm font-semibold text-[#31415e]">${repricingResult.repricing.ai_decision.recommended_price.toFixed(2)}</p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">
                        {repricingResult.repricing.ai_decision.action} from ${repricingResult.repricing.pricing.old_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Strategy</p>
                      <p className="mt-2 text-sm font-semibold capitalize text-[#31415e]">
                        {repricingResult.repricing.ai_decision.strategy_used.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">{repricingResult.repricing.demand_signal} demand</p>
                    </div>
                    <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Margin</p>
                      <p className="mt-2 text-sm font-semibold text-[#31415e]">{repricingResult.repricing.ai_decision.margin_at_new_price}%</p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">Source: {repricingResult.repricing.data_source}</p>
                    </div>
                    <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Guardrails</p>
                      <p className="mt-2 text-sm font-semibold text-[#31415e]">
                        {repricingResult.repricing.ai_decision.guardrails_applied ? "Adjusted" : "Clean"}
                      </p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">
                        Delta ${repricingResult.repricing.pricing.price_delta.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ) : null}

                {repricingResult ? (
                  <div className="mt-3 rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-sm leading-6 text-[#667a99]">
                    {repricingResult.repricing.ai_decision.reason}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-dashed border-[#cfd9ea] bg-[#f8fbff] px-4 text-sm font-semibold text-[#8ea0bf] disabled:cursor-not-allowed"
                  disabled
                  type="button"
                >
                  CommandCtr DB
                </button>
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-dashed border-[#cfd9ea] bg-[#f8fbff] px-4 text-sm font-semibold text-[#8ea0bf] disabled:cursor-not-allowed"
                  disabled
                  type="button"
                >
                  Amazon
                </button>
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-dashed border-[#cfd9ea] bg-[#f8fbff] px-4 text-sm font-semibold text-[#8ea0bf] disabled:cursor-not-allowed"
                  disabled
                  type="button"
                >
                  eBay
                </button>
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-dashed border-[#cfd9ea] bg-[#f8fbff] px-4 text-sm font-semibold text-[#8ea0bf] disabled:cursor-not-allowed"
                  disabled
                  type="button"
                >
                  TikTok Shop
                </button>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#172544] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={publishSubmitting.shopify}
                  onClick={() => void uploadToShopify("active")}
                  type="button"
                >
                  {publishSubmitting.shopify ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {publishSubmitting.shopify && shopifySubmitMode === "active"
                    ? shopifyProductId
                      ? "Updating Shopify..."
                      : "Uploading to Shopify..."
                    : shopifyProductId
                      ? "Update on Shopify"
                      : "Upload to Shopify"}
                </button>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-4 text-sm font-semibold text-[#4a5d7d] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={publishSubmitting.shopify}
                  onClick={() => void uploadToShopify("draft")}
                  type="button"
                >
                  {publishSubmitting.shopify && shopifySubmitMode === "draft" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {publishSubmitting.shopify && shopifySubmitMode === "draft"
                    ? shopifyProductId
                      ? "Updating Draft..."
                      : "Uploading Draft..."
                    : shopifyProductId
                      ? "Update Draft on Shopify"
                      : "Upload as Draft"}
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] px-4 py-3 text-xs leading-6 text-[#667a99]">
                CommandCtr local database creation is not exposed as a standalone backend endpoint yet.
                Shopify upload is live because `commandctr-backend` already supports `POST /shopify/products`, and that flow creates the Shopify product and also upserts the local CommandCtr product record.
                Amazon, eBay, and TikTok upload buttons are shown separately but remain disabled until those marketplace create APIs exist in the backend.
              </div>
              {shopifyProductId ? (
                <div className="mt-4 rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-xs leading-6 text-[#667a99]">
                  Current Shopify product ID:
                  <span className="ml-2 font-semibold text-[#31415e]">{shopifyProductId}</span>
                </div>
              ) : null}
              <div className="mt-4 rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-xs leading-6 text-[#667a99]">
                Shopify upload needs:
                <span className="font-semibold text-[#31415e]"> product title </span>
                and
                <span className="font-semibold text-[#31415e]"> default price</span>.
                Vendor, SKU, tags, product type, description, status, and the generated Shopify image are included when available.
              </div>
              {publishFieldErrors.title || publishFieldErrors.price ? (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#f3c1c1] bg-[#fff5f5] px-4 py-3 text-sm text-[#b24646]">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Fill the highlighted required fields before creating the Shopify product.</p>
                </div>
              ) : null}
              {shopifyPublishMessage ? (
                <div
                  className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                    publishSubmitting.shopify
                      ? "border border-[#cde4ff] bg-[#f3f8ff] text-[#355b91]"
                      : shopifyPublishMessage.toLowerCase().includes("success")
                        ? "border border-[#ccebdc] bg-[#eefbf4] text-[#267a4f]"
                        : "border border-[#dbe2ee] bg-[#f8fbff] text-[#546884]"
                  }`}
                >
                  {shopifyPublishMessage}
                </div>
              ) : null}
            </article>

            <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1f2c44]">Marketplace Variants</h2>
                  <p className="text-sm text-[#7f92b1]">These controls are now live against the backend variant APIs.</p>
                </div>
                <div className="rounded-full bg-[#eef5ff] px-3 py-2 text-xs font-semibold text-[#4d6284]">
                  Active market: {marketLabels[activeMarket]}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Add Size Variant</p>
                  <p className="mt-1 text-xs text-[#8ea0bf]">Text-only option such as `32 oz`, `XL`, or `Large`.</p>
                  <div className="mt-3 flex gap-3">
                    <input
                      className="h-11 flex-1 rounded-xl border border-[#d4ddec] bg-white px-3 text-sm text-[#31415e] outline-none transition focus:border-[#97abd0]"
                      onChange={(event) => updateVariantInput(activeMarket, "size", event.target.value)}
                      placeholder="e.g. 40 oz"
                      type="text"
                      value={variantInputs[activeMarket].size}
                    />
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#172544] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!hasPersistedProduct || variantSubmitting[activeMarket]}
                      onClick={() => void addVariant(activeMarket, "size")}
                      type="button"
                    >
                      {variantSubmitting[activeMarket] ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Add Color Variant</p>
                  <p className="mt-1 text-xs text-[#8ea0bf]">Creates a color variant record and a generated color image asset.</p>
                  <div className="mt-3 flex gap-3">
                    <input
                      className="h-11 flex-1 rounded-xl border border-[#d4ddec] bg-white px-3 text-sm text-[#31415e] outline-none transition focus:border-[#97abd0]"
                      onChange={(event) => updateVariantInput(activeMarket, "color", event.target.value)}
                      placeholder="e.g. Forest Green"
                      type="text"
                      value={variantInputs[activeMarket].color}
                    />
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#35d3ce] px-4 text-sm font-semibold text-[#153c53] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!hasPersistedProduct || variantSubmitting[activeMarket]}
                      onClick={() => void addVariant(activeMarket, "color")}
                      type="button"
                    >
                      {variantSubmitting[activeMarket] ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {currentVariants.length > 0 ? (
                  currentVariants.map((variant) => (
                    <div className="rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4" key={variant.id}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#20314d]">{variant.name}</p>
                          <p className="mt-1 text-xs text-[#8597b5]">
                            {variant.variant_type === "color" ? "Color Variant" : "Size Variant"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            variant.variant_type === "color" ? "bg-[#def7ea] text-[#2ba66d]" : "bg-[#eef2f7] text-[#5e718e]"
                          }`}
                        >
                          {variant.variant_type === "color" ? "Image Ready" : "Text Only"}
                        </span>
                      </div>

                      {variant.variant_type === "color" ? (
                        <div className="mt-4 space-y-3">
                          <ProductPreview
                            alt={`${variant.name} variant`}
                            backgroundLabel="Color variant"
                            image={variant.image}
                          />
                          <p className="text-xs leading-5 text-[#6d7f9f]">
                            Stored as a generated color-specific asset for {marketLabels[activeMarket]}.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-[#d4ddec] bg-white px-4 py-5 text-sm text-[#546884]">
                          This size variant updates listing options only. No extra image is required.
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#d4ddec] bg-[#f8fbff] px-4 py-10 text-center text-sm text-[#667a99] md:col-span-2">
                    No {marketLabels[activeMarket]} variants yet. Generate the product first, then add size or color variants.
                  </div>
                )}
              </div>
            </article>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto xl:pr-2">
            <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eefaf7] text-[#2dc7c3]">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1f2c44]">Generated Images</h2>
                  <p className="text-sm text-[#7f92b1]">These cards now render real generated files when the backend has produced them.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {imageCards.map(({ key, label, image, note }) => (
                  <div className="rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4" key={key}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#20314d]">{label}</p>
                        <p className="mt-1 text-xs text-[#8597b5]">{image?.generation_mode ?? "not_generated"}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          image?.validation.passed ? "bg-[#def7ea] text-[#2ba66d]" : "bg-[#fff4d6] text-[#c48a07]"
                        }`}
                      >
                        {image?.validation.passed ? "Ready" : "Review"}
                      </span>
                    </div>
                    <div className="mt-4">
                      <ProductPreview
                        alt={label}
                        backgroundLabel={image?.validation.expected_background ?? "Image"}
                        image={image}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[#5f7293]">
                      <div className="rounded-xl bg-white px-3 py-2">
                        <p className="font-semibold text-[#8ea0bf]">Background</p>
                        <p className="mt-1 text-sm text-[#31415e]">{image?.validation.expected_background ?? "unknown"}</p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2">
                        <p className="font-semibold text-[#8ea0bf]">Size</p>
                        <p className="mt-1 text-sm text-[#31415e]">
                          {image?.validation.width && image?.validation.height
                            ? `${image.validation.width} x ${image.validation.height}`
                            : "Not generated"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#6d7f9f]">
                      {image?.validation.errors[0] ?? note}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3fb] text-[#47628f]">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1f2c44]">Integration Status</h2>
                  <p className="text-sm text-[#7f92b1]">This page is using the backend APIs instead of static mock data.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-[#44526d]">
                {[
                  "Generate uses POST /api/product-ai/products/generate through the Next proxy.",
                  "Save Draft keeps the full editor state locally for the signed-in account and also PATCHes the persisted backend draft when a backend product ID exists.",
                  "Marketplace-specific regenerate uses the backend regeneration endpoint.",
                  "Size and color variants now call the backend variant APIs.",
                  "Generated image cards render backend output files through a local image proxy route.",
                ].map((point) => (
                  <div className="flex items-start gap-2" key={point}>
                    <ChevronRight className="mt-0.5 h-4 w-4 text-[#2dc7c3]" />
                    <p>{point}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff8e6] text-[#d39a0f]">
                  <Tags className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1f2c44]">Actions</h2>
                  <p className="text-sm text-[#7f92b1]">Save the edited draft back to the backend or return to the product list.</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-[#f8fbff] p-4 text-sm text-[#465574]">
                {isLoadingProduct
                  ? "Loading product draft from the backend..."
                  : hasPersistedProduct
                    ? "This page is connected to a persisted backend draft."
                    : "Generate a product draft first to unlock saving, regeneration, and variants."}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  className="inline-flex min-h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[#172544] px-4 py-3 text-center text-sm font-semibold leading-5 text-white"
                  href="/products"
                >
                  <BadgeCheck className="h-4 w-4" />
                  Back to Products
                </Link>
                <button
                  className={`inline-flex min-h-11 min-w-[132px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-semibold leading-5 disabled:cursor-not-allowed disabled:opacity-60 ${
                    draftSaveState === "saved"
                      ? "border border-[#ccebdc] bg-[#eefbf4] text-[#267a4f]"
                      : "border border-[#d5dcea] bg-white text-[#4a5d7d]"
                  }`}
                  disabled={isSaving}
                  onClick={() => void saveDraft()}
                  type="button"
                >
                  {draftSaveState === "saving" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {draftSaveState === "saving" ? "Saving..." : draftSaveState === "saved" ? "Saved" : "Save Draft"}
                </button>
                <button
                  className="inline-flex min-h-11 min-w-[132px] items-center justify-center gap-2 rounded-xl border border-[#e6cfd4] bg-[#fff7f8] px-4 py-3 text-center text-sm font-semibold leading-5 text-[#8a4b57] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isDeletingDraft}
                  onClick={() => void deleteDraft()}
                  type="button"
                >
                  {isDeletingDraft ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleAlert className="h-4 w-4" />}
                  {isDeletingDraft ? "Deleting..." : "Delete Draft"}
                </button>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}
