"use client";

import {
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  CircleAlert,
  Image as ImageIcon,
  LoaderCircle,
  PackageCheck,
  Plus,
  RefreshCcw,
  Sparkles,
  Tags,
  Upload,
  Download,
  Trash2,
  Filter,
  Scissors,
  ShoppingBag,
  Store,
  Music,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";

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

type ApiSuggestedPriceRange = {
  minimum: number;
  maximum: number;
  recommended: number;
  currency: string;
  source: string;
};

type ApiPublishTargetAnalysis = {
  marketplace: MarketKey;
  vendor: string;
  default_sku: string;
  default_price: string;
  publish_description: string;
  suggested_price_range: ApiSuggestedPriceRange | null;
  market_signal: string;
  analysis_summary: string;
};

type ApiPublishTargetAnalysisJob = {
  job_id: string;
  product_id: string;
  marketplace: MarketKey;
  status: "pending" | "running" | "completed" | "failed";
  result: ApiPublishTargetAnalysis | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

type MarketActionState = Record<MarketKey, boolean>;
type PublishTarget = "commandctr" | MarketKey;
type PublishActionState = Record<PublishTarget, boolean>;
type PublishStatus = "DRAFT" | "ACTIVE";
type ImageCardKey = "source" | "transparent_cutout" | MarketKey;
type SavedDraftSnapshot = {
  draft: ApiProduct;
  variantsByMarket: Record<MarketKey, ApiVariant[]>;
  productId: string | null;
  shopifyProductId: string | null;
  sourceTitle: string;
  publishVendor: string;
  publishDescription: string;
  publishPrice: string;
  publishSku: string;
  publishStatus: PublishStatus;
  publishStock: string;
  publishOnOnlineStore: boolean;
  publishTrackInventory: boolean;
  savedAt: string;
};

type LocalDraftSeed = {
  title: string;
  imagePath: string;
  imageMimeType: string;
};

type ImageCardConfig = {
  key: ImageCardKey;
  label: string;
  image: ApiImageVariant | null;
  note: string;
};

type PublishFieldErrors = {
  title: boolean;
  price: boolean;
};

type DraftSaveState = "idle" | "saving" | "saved";
type ShopifyUploadMode = "active" | "draft";

const filterOptions = [
  { key: "all", label: "All Channels", icon: Boxes },
  { key: "source", label: "Source Upload", icon: Upload },
  { key: "transparent_cutout", label: "Transparent Cutout", icon: Scissors },
  { key: "amazon", label: "Amazon Main", icon: ShoppingBag },
  { key: "ebay", label: "eBay Main", icon: Tags },
  { key: "etsy", label: "Etsy Hero", icon: Gift },
  { key: "tiktok", label: "TikTok Shop", icon: Music },
  { key: "shopify", label: "Shopify Composition", icon: Store },
];

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

const emptyProduct: ApiProduct = {
  core: {
    normalized_title: "",
    category: "",
    product_type: "",
    product_summary: "",
    features: [],
    attributes: {},
    source_title: "",
    vision_confidence: 0,
  },
  amazon: {
    title: "",
    bullet_points: [],
    description: "",
    backend_search_terms: [],
    structured_attributes: {},
  },
  ebay: {
    title: "",
    item_specifics: {},
    condition: "",
    listing_notes: "",
  },
  etsy: {
    title: "",
    description: "",
    tags: [],
    materials: [],
    occasion: "",
    seo_keywords: [],
  },
  tiktok: {
    title: "",
    social_description: "",
    hashtags: [],
  },
  shopify: {
    title: "",
    body_html: "",
    tags: [],
    product_type: "",
    seo_title: "",
    seo_description: "",
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
        passed: false,
        width: null,
        height: null,
        format: null,
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: null,
        expected_height: null,
        expected_background: "source",
        errors: ["No source image uploaded yet."],
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
        passed: false,
        width: null,
        height: null,
        format: null,
        has_alpha: null,
        file_size_bytes: 0,
        expected_width: 1024,
        expected_height: 1024,
        expected_background: "transparent",
        errors: ["No transparent cutout generated yet."],
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
        passed: false,
        width: null,
        height: null,
        format: null,
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: 1024,
        expected_height: 1024,
        expected_background: "white",
        errors: ["No Amazon image generated yet."],
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
        passed: false,
        width: null,
        height: null,
        format: null,
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: 1024,
        expected_height: 1024,
        expected_background: "white",
        errors: ["No eBay image generated yet."],
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
        passed: false,
        width: null,
        height: null,
        format: null,
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: 1200,
        expected_height: 900,
        expected_background: "opaque",
        errors: ["No Etsy image generated yet."],
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
        width: null,
        height: null,
        format: null,
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: 1024,
        expected_height: 1536,
        expected_background: "opaque",
        errors: ["No TikTok Shop image generated yet."],
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
        passed: false,
        width: null,
        height: null,
        format: null,
        has_alpha: false,
        file_size_bytes: 0,
        expected_width: 1536,
        expected_height: 1536,
        expected_background: "opaque",
        errors: ["No Shopify image generated yet."],
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

function isGenerationTimeoutMessage(message: string) {
  return message.includes("timed out") || message.includes("504");
}

function ProductPreview({
  image,
  alt,
  backgroundLabel,
  previewSrc,
}: {
  image: ApiImageVariant | null;
  alt: string;
  backgroundLabel: string;
  previewSrc?: string | null;
}) {
  const src = previewSrc ?? (image ? imageUrlFor(image.absolute_path) : null);
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
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  invalid?: boolean;
  helperText?: string;
  className?: string;
}) {
  const hasHtml = multiline && (value.includes("<") && value.includes(">"));
  const [manualShowPreview, setManualShowPreview] = useState<boolean | null>(null);
  const showPreview = manualShowPreview !== null ? manualShowPreview : hasHtml;

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-[#f8fbff] p-4 transition-all duration-200 ${
        invalid ? "border-[#ef6b6b] bg-[#fff7f7]" : "border-[#dbe2ee]"
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">{label}</span>
        {multiline && hasHtml && (
          <div className="flex bg-white rounded-lg p-0.5 border border-[#d4ddec] text-[10px] font-bold shadow-xs">
            <button
              type="button"
              onClick={() => setManualShowPreview(false)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                !showPreview 
                  ? "bg-[#1b2748] text-white shadow-xs" 
                  : "text-[#5e718e] hover:bg-[#edf2fb] hover:text-[#1b2748]"
              }`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setManualShowPreview(true)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                showPreview 
                  ? "bg-[#1b2748] text-white shadow-xs" 
                  : "text-[#5e718e] hover:bg-[#edf2fb] hover:text-[#1b2748]"
              }`}
            >
              Visual
            </button>
          </div>
        )}
      </div>
      {helperText ? <p className={`mt-1 text-xs ${invalid ? "text-[#cf4b4b]" : "text-[#8ea0bf]"}`}>{helperText}</p> : null}
      {multiline ? (
        showPreview ? (
          <div
            className="mt-2 min-h-28 max-h-72 w-full flex-1 rounded-xl bg-white px-4 py-3 text-sm text-[#31415e] border border-[#d4ddec] overflow-y-auto rich-preview-box transition-all"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <textarea
            className={`mt-2 min-h-28 max-h-72 w-full flex-1 rounded-xl bg-white px-3 py-3 text-sm text-[#31415e] outline-none transition resize-none overflow-y-auto ${
              invalid ? "border border-[#ef6b6b] focus:border-[#ef6b6b]" : "border border-[#d4ddec] focus:border-[#97abd0]"
            }`}
            onChange={(event) => onChange(event.target.value)}
            value={value}
          />
        )
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
    </div>
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
  localDraftSeed,
}: {
  activeMarket: MarketKey;
  initialProductId: string | null;
  localDraftSeed: LocalDraftSeed | null;
}) {
  const router = useRouter();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const productImageUploadInputRef = useRef<HTMLInputElement>(null);
  const lastSavedDraftRef = useRef<string | null>(null);
  const [draft, setDraft] = useState<ApiProduct>(emptyProduct);
  const [variantsByMarket, setVariantsByMarket] = useState<Record<MarketKey, ApiVariant[]>>(sampleVariants);
  const [productId, setProductId] = useState<string | null>(initialProductId);
  const [statusMessage, setStatusMessage] = useState("Choose an image and generate a product draft.");
  const [sourceTitle, setSourceTitle] = useState(emptyProduct.core.source_title);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>("idle");
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [marketRegenerating, setMarketRegenerating] = useState<MarketActionState>(emptyActionState);
  const [marketImageGenerating, setMarketImageGenerating] = useState<MarketActionState>(emptyActionState);
  const [variantSubmitting, setVariantSubmitting] = useState<MarketActionState>(emptyActionState);
  const [isUploadingSourceImage, setIsUploadingSourceImage] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAnalyzingPublishTarget, setIsAnalyzingPublishTarget] = useState(false);
  const [publishSubmitting, setPublishSubmitting] = useState<PublishActionState>(emptyPublishState);
  const [publishVendor, setPublishVendor] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishPrice, setPublishPrice] = useState("");
  const [publishSku, setPublishSku] = useState("");
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("ACTIVE");
  const [publishStock, setPublishStock] = useState("0");
  const [publishOnOnlineStore, setPublishOnOnlineStore] = useState(true);
  const [publishTrackInventory, setPublishTrackInventory] = useState(true);
  const [publishAnalysis, setPublishAnalysis] = useState<ApiPublishTargetAnalysis | null>(null);
  const [shopifyProductId, setShopifyProductId] = useState<string | null>(null);
  const [shopifySubmitMode, setShopifySubmitMode] = useState<ShopifyUploadMode | null>(null);
  const [shopifyPublishMessage, setShopifyPublishMessage] = useState("");
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

  const [activeUploadCardKey, setActiveUploadCardKey] = useState<ImageCardKey | null>(null);
  const [imageUploadingMap, setImageUploadingMap] = useState<Record<string, boolean>>({});
  const [draggingOverCardKey, setDraggingOverCardKey] = useState<ImageCardKey | null>(null);
  const manualUploadInputRef = useRef<HTMLInputElement>(null);
  const publishAnalysisJobRef = useRef<string | null>(null);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const onlineStoreDropdownRef = useRef<HTMLDivElement>(null);
  const [isOnlineStoreDropdownOpen, setIsOnlineStoreDropdownOpen] = useState(false);

  const trackInventoryDropdownRef = useRef<HTMLDivElement>(null);
  const [isTrackInventoryDropdownOpen, setIsTrackInventoryDropdownOpen] = useState(false);

  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedFilterKey, setSelectedFilterKey] = useState<string>("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (onlineStoreDropdownRef.current && !onlineStoreDropdownRef.current.contains(event.target as Node)) {
        setIsOnlineStoreDropdownOpen(false);
      }
      if (trackInventoryDropdownRef.current && !trackInventoryDropdownRef.current.contains(event.target as Node)) {
        setIsTrackInventoryDropdownOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const hasPersistedProduct = Boolean(productId);

  function buildDraftSnapshot(): SavedDraftSnapshot {
    return {
      draft,
      variantsByMarket,
      productId,
      shopifyProductId,
      sourceTitle,
      publishVendor,
      publishDescription,
      publishPrice,
      publishSku,
      publishStatus,
      publishStock,
      publishOnOnlineStore,
      publishTrackInventory,
      savedAt: new Date().toISOString(),
    };
  }

  function clearPublishTargetAnalysis() {
    publishAnalysisJobRef.current = null;
    setPublishAnalysis(null);
    setIsAnalyzingPublishTarget(false);
  }

  function updatePublishPrice(value: string) {
    setPublishPrice(value);
    setDraft((prev) => {
      const nextAttributes = { ...prev.core.attributes };
      if (value.trim()) {
        nextAttributes.price = value.trim();
      } else {
        delete nextAttributes.price;
      }

      return {
        ...prev,
        core: {
          ...prev.core,
          attributes: nextAttributes,
        },
      };
    });
    if (publishFieldErrors.price && value.trim()) {
      setPublishFieldErrors((prev) => ({ ...prev, price: false }));
    }
  }

  function buildComparableDraftSignature(snapshot: SavedDraftSnapshot) {
    return JSON.stringify({
      draft: snapshot.draft,
      variantsByMarket: snapshot.variantsByMarket,
      productId: snapshot.productId,
      shopifyProductId: snapshot.shopifyProductId,
      sourceTitle: snapshot.sourceTitle,
      publishVendor: snapshot.publishVendor,
      publishDescription: snapshot.publishDescription ?? "",
      publishPrice: snapshot.publishPrice,
      publishSku: snapshot.publishSku,
      publishStatus: snapshot.publishStatus,
      publishStock: snapshot.publishStock,
      publishOnOnlineStore: snapshot.publishOnOnlineStore,
      publishTrackInventory: snapshot.publishTrackInventory,
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
    setPublishDescription(snapshot.publishDescription ?? "");
    setPublishPrice(snapshot.publishPrice);
    setPublishSku(snapshot.publishSku);
    setPublishStatus(snapshot.publishStatus);
    setPublishStock(snapshot.publishStock ?? "0");
    setPublishOnOnlineStore(snapshot.publishOnOnlineStore ?? true);
    setPublishTrackInventory(snapshot.publishTrackInventory ?? true);
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

    setDraft(emptyProduct);
    setVariantsByMarket(sampleVariants);
    setProductId(null);
    setShopifyProductId(null);
    setSourceTitle(emptyProduct.core.source_title);
    setSelectedImage(null);
    setPublishVendor("");
    setPublishDescription("");
    setPublishPrice("");
    setPublishSku("");
    setPublishStatus("ACTIVE");
    setPublishStock("0");
    setPublishOnOnlineStore(true);
    setPublishTrackInventory(true);
    setShopifyPublishMessage("");
    clearPublishTargetAnalysis();
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

  const applyLocalDraftSeed = useCallback((seed: LocalDraftSeed) => {
    const trimmedTitle = seed.title.trim();
    const nextDraft: ApiProduct = {
      ...emptyProduct,
      core: {
        ...emptyProduct.core,
        normalized_title: trimmedTitle,
        source_title: trimmedTitle,
      },
      shopify: {
        ...emptyProduct.shopify,
        title: trimmedTitle,
      },
      amazon: {
        ...emptyProduct.amazon,
        title: trimmedTitle,
      },
      ebay: {
        ...emptyProduct.ebay,
        title: trimmedTitle,
      },
      etsy: {
        ...emptyProduct.etsy,
        title: trimmedTitle,
      },
      tiktok: {
        ...emptyProduct.tiktok,
        title: trimmedTitle,
      },
      images: {
        ...emptyProduct.images,
        source: {
          ...emptyProduct.images.source,
          relative_path: seed.imagePath,
          absolute_path: seed.imagePath,
          generation_mode: "manual_upload",
          mime_type: seed.imageMimeType,
          validation: {
            ...emptyProduct.images.source.validation,
            passed: true,
            errors: [],
            mime_type: seed.imageMimeType,
          },
        },
      },
    };

    const snapshot: SavedDraftSnapshot = {
      draft: nextDraft,
      variantsByMarket: sampleVariants,
      productId: null,
      shopifyProductId: null,
      sourceTitle: trimmedTitle,
      publishVendor: "",
      publishDescription: "",
      publishPrice: "",
      publishSku: "",
      publishStatus: "ACTIVE",
      publishStock: "0",
      publishOnOnlineStore: true,
      publishTrackInventory: true,
      savedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(getStoredDraftKey(), JSON.stringify(snapshot));
    }

    lastSavedDraftRef.current = buildComparableDraftSignature(snapshot);
    setDraft(snapshot.draft);
    setVariantsByMarket(snapshot.variantsByMarket);
    setProductId(snapshot.productId);
    setShopifyProductId(snapshot.shopifyProductId);
    setSourceTitle(snapshot.sourceTitle);
    setPublishVendor(snapshot.publishVendor);
    setPublishDescription(snapshot.publishDescription ?? "");
    setPublishPrice(snapshot.publishPrice);
    setPublishSku(snapshot.publishSku);
    setPublishStatus(snapshot.publishStatus);
    setPublishStock(snapshot.publishStock ?? "0");
    setPublishOnOnlineStore(snapshot.publishOnOnlineStore ?? true);
    setPublishTrackInventory(snapshot.publishTrackInventory ?? true);
    setShopifyPublishMessage("");
    setHasSavedDraft(true);
    setDraftSaveState("saved");
    setPublishFieldErrors(emptyPublishFieldErrors);
    setStatusMessage("The AI backend timed out, so we opened a local draft with your title and source image preserved.");
  }, []);

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
    if (!hasInitializedDraftStorage || initialProductId || hasSavedDraft || !localDraftSeed) {
      return;
    }

    window.setTimeout(() => {
      applyLocalDraftSeed(localDraftSeed);
    }, 0);
  }, [applyLocalDraftSeed, hasInitializedDraftStorage, hasSavedDraft, initialProductId, localDraftSeed]);

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
        clearPublishTargetAnalysis();
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
      publishDescription,
      publishPrice,
      publishSku,
      publishStatus,
      publishStock,
      publishOnOnlineStore,
      publishTrackInventory,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(getStoredDraftKey(), JSON.stringify(snapshot));
    window.setTimeout(() => {
      setHasSavedDraft(true);
    }, 0);
  }, [draft, hasInitializedDraftStorage, productId, publishDescription, publishPrice, publishSku, publishStatus, publishVendor, shopifyProductId, sourceTitle, variantsByMarket, publishStock, publishOnOnlineStore, publishTrackInventory]);

  const selectedImagePreviewUrl = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : null),
    [selectedImage],
  );

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  const currentDraftComparableSignature = useMemo(
    () =>
      buildComparableDraftSignature({
        draft,
        variantsByMarket,
        productId,
        shopifyProductId,
        sourceTitle,
        publishVendor,
        publishDescription,
        publishPrice,
        publishSku,
        publishStatus,
        publishStock,
        publishOnOnlineStore,
        publishTrackInventory,
        savedAt: "",
      }),
    [draft, variantsByMarket, productId, shopifyProductId, sourceTitle, publishVendor, publishDescription, publishPrice, publishSku, publishStatus, publishStock, publishOnOnlineStore, publishTrackInventory],
  );

  useEffect(() => {
    if (!lastSavedDraftRef.current) {
      setDraftSaveState("idle");
      return;
    }

    setDraftSaveState(lastSavedDraftRef.current === currentDraftComparableSignature ? "saved" : "idle");
  }, [currentDraftComparableSignature]);

  const imageCards = useMemo<ImageCardConfig[]>(
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

  const hasSourceImage = Boolean(
    draft.images.source?.absolute_path || draft.images.source?.relative_path,
  );

  function buildCoreDraftForSave() {
    const nextAttributes = { ...draft.core.attributes };
    const trimmedPrice = publishPrice.trim();
    const trimmedSku = publishSku.trim();
    const trimmedVendor = publishVendor.trim();

    if (trimmedPrice) {
      nextAttributes.price = trimmedPrice;
    } else {
      delete nextAttributes.price;
    }

    if (trimmedSku) {
      nextAttributes.sku = trimmedSku;
    } else {
      delete nextAttributes.sku;
    }

    if (trimmedVendor) {
      nextAttributes.brand = trimmedVendor;
    } else if (!String(nextAttributes.brand ?? "").trim()) {
      delete nextAttributes.brand;
    }

    return {
      ...draft.core,
      attributes: nextAttributes,
    };
  }

  function applyRecord(record: ApiRecord, message: string) {
    setProductId(record.id);
    setDraft((prev) => {
      const mergedImages = { ...record.product.images };
      const keys: ImageCardKey[] = ["source", "transparent_cutout", "amazon", "ebay", "etsy", "tiktok", "shopify"];
      keys.forEach((k) => {
        if (!mergedImages[k]?.absolute_path && prev.images[k]?.absolute_path) {
          mergedImages[k] = prev.images[k];
        }
      });
      return {
        ...record.product,
        images: mergedImages,
      };
    });
    setVariantsByMarket(record.variants);
    setSourceTitle(record.product.core.source_title);
    setPublishVendor((current) => current || record.product.core.attributes.brand || "");
    setPublishPrice((current) => current || record.product.core.attributes.price || "");
    setPublishDescription((current) => current || record.product.shopify.body_html || record.product.core.product_summary || "");
    setPublishSku((current) => current || record.id.slice(0, 12).toUpperCase());
    clearPublishTargetAnalysis();
    setDraftSaveState("saved");
    setStatusMessage(message);
  }

  function clearSelectedImageSelection() {
    setSelectedImage(null);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
    if (productImageUploadInputRef.current) {
      productImageUploadInputRef.current.value = "";
    }
  }

  function getPublishTitle() {
    return (
      draft.shopify.title.trim() ||
      draft.core.normalized_title.trim() ||
      draft.core.source_title.trim()
    );
  }

  function getPublishDescription() {
    return publishDescription.trim() || draft.shopify.body_html.trim() || draft.core.product_summary.trim() || "";
  }

  function getEstimatedPriceRange() {
    const range = publishAnalysis?.suggested_price_range ?? null;
    if (!range) {
      return null;
    }

    return range;
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
        publishToOnlineStore: mode === "active" && publishOnOnlineStore,
        variants: [
          {
            title: "Default Title",
            price: numericPrice.toFixed(2),
            sku: publishSku.trim() || undefined,
            inventoryQuantity: Number(publishStock) || 0,
            trackInventory: publishTrackInventory,
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

  async function generateProduct(successMessage = "AI draft generated and connected to the add-product page.") {
    if (!selectedImage) {
      setStatusMessage("Upload a product image before generating.");
      return false;
    }

    if (!sourceTitle.trim()) {
      setStatusMessage("Add a source title before generating.");
      return false;
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
      clearPublishTargetAnalysis();
      applyRecord(record, successMessage);
      router.replace(`/products/add?market=${activeMarket}&productId=${record.id}`, { scroll: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Product generation failed.";

      if (!productId && selectedImage && isGenerationTimeoutMessage(message)) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("file", selectedImage);
          uploadFormData.append("market", "source");
          uploadFormData.append("productId", "draft");

          const uploadResponse = await fetch("/api/product-ai/image/upload", {
            method: "POST",
            body: uploadFormData,
          });

          if (!uploadResponse.ok) {
            const uploadErrorBody = (await uploadResponse.json().catch(() => null)) as { detail?: string } | null;
            throw new Error(uploadErrorBody?.detail ?? "The AI request timed out and the local draft image upload failed.");
          }

          const uploadResult = (await uploadResponse.json()) as {
            relative_path: string;
            absolute_path: string;
          };

          applyLocalDraftSeed({
            title: sourceTitle.trim(),
            imagePath: uploadResult.relative_path || uploadResult.absolute_path,
            imageMimeType: selectedImage.type || "image/png",
          });
          clearSelectedImageSelection();
          router.replace(`/products/add?market=${activeMarket}`, { scroll: false });
          return false;
        } catch (fallbackError) {
          setStatusMessage(fallbackError instanceof Error ? fallbackError.message : message);
          return false;
        }
      }

      setStatusMessage(message);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }

  async function generateMarketplaceDraft(
    market: MarketKey,
    successMessage = `${marketLabels[market]} image generated and the new product draft is ready.`,
  ) {
    if (!selectedImage) {
      setStatusMessage("Upload a product image before generating.");
      return false;
    }

    if (!sourceTitle.trim()) {
      setStatusMessage("Add a source title before generating.");
      return false;
    }

    const formData = new FormData();
    formData.append("title", sourceTitle.trim());
    formData.append("image", selectedImage);

    setMarketImageGenerating((prev) => ({ ...prev, [market]: true }));
    try {
      const response = await fetch(`/api/product-ai/products/generate/${market}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? `Could not generate the ${marketLabels[market]} image.`);
      }

      const record = (await response.json()) as ApiRecord;
      setShopifyProductId(null);
      clearPublishTargetAnalysis();
      applyRecord(record, successMessage);
      clearSelectedImageSelection();
      router.replace(`/products/add?market=${activeMarket}&productId=${record.id}`, { scroll: false });
      return true;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `Could not generate the ${marketLabels[market]} image.`);
      return false;
    } finally {
      setMarketImageGenerating((prev) => ({ ...prev, [market]: false }));
    }
  }

  async function saveDraft(updatedImages?: ApiGeneratedImages) {
    const nextImages = updatedImages ?? draft.images;
    const nextDraft = {
      ...draft,
      images: nextImages,
    };

    function getSnapshotWithImages(): SavedDraftSnapshot {
      return {
        draft: nextDraft,
        variantsByMarket,
        productId,
        shopifyProductId,
        sourceTitle,
        publishVendor,
        publishDescription,
        publishPrice,
        publishSku,
        publishStatus,
        publishStock,
        publishOnOnlineStore,
        publishTrackInventory,
        savedAt: new Date().toISOString(),
      };
    }

    persistDraftSnapshot(getSnapshotWithImages());
    setDraftSaveState("saving");

    if (!productId) {
      setDraft(nextDraft);
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
          core: buildCoreDraftForSave(),
          amazon: nextDraft.amazon,
          ebay: nextDraft.ebay,
          etsy: nextDraft.etsy,
          tiktok: nextDraft.tiktok,
          shopify: nextDraft.shopify,
          images: nextDraft.images,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Draft save failed.");
      }

      const record = (await response.json()) as ApiRecord;
      applyRecord(record, "Draft saved to product-ai-agent and kept locally for this account.");
      persistDraftSnapshot({
        ...getSnapshotWithImages(),
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

    setIsAnalyzingPublishTarget(true);
    setPublishAnalysis(null);
    publishAnalysisJobRef.current = null;
    const requestedProductId = productId;
    const marketplace = activeMarket;
    try {
      const response = await fetch(
        `/api/product-ai/products/${requestedProductId}/marketplaces/${marketplace}/publish-target/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            marketplace,
            product_identity: {
              normalized_title: draft.core.normalized_title || undefined,
              source_title: draft.core.source_title || undefined,
              category: draft.core.category || undefined,
              product_type: draft.core.product_type || undefined,
              product_summary: draft.core.product_summary || undefined,
              features: draft.core.features.length ? draft.core.features : undefined,
              attributes: Object.keys(draft.core.attributes).length ? draft.core.attributes : undefined,
            },
            publish_fields: {
              vendor: getPublishVendor() || undefined,
              default_price: publishPrice.trim() || undefined,
              default_sku: publishSku.trim() || undefined,
              publish_description: getPublishDescription() || undefined,
              publish_title: getPublishTitle() || undefined,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not analyze publish target.");
      }

      const job = (await response.json()) as ApiPublishTargetAnalysisJob;
      publishAnalysisJobRef.current = job.job_id;
      if (job.status === "failed") {
        publishAnalysisJobRef.current = null;
        throw new Error(job.error ?? "Could not analyze publish target.");
      }

      if (job.status === "completed" && job.result) {
        setPublishAnalysis(job.result);
        applyPublishTargetAnalysis(job.result);
        setStatusMessage(job.result.analysis_summary || `Publish target analyzed for ${marketLabels[marketplace]}.`);
        publishAnalysisJobRef.current = null;
        return;
      }

      await pollPublishTargetAnalysisJob(job.job_id, marketplace, requestedProductId);
    } catch (error) {
      publishAnalysisJobRef.current = null;
      setStatusMessage(error instanceof Error ? error.message : "Could not analyze publish target.");
    } finally {
      setIsAnalyzingPublishTarget(false);
    }
  }

  function applyPublishTargetAnalysis(result: ApiPublishTargetAnalysis) {
    setPublishVendor(result.vendor);
    setPublishPrice(result.default_price);
    setPublishSku(result.default_sku);
    setPublishDescription(result.publish_description);
    setDraft((prev) => ({
      ...prev,
      core: {
        ...prev.core,
        attributes: {
          ...prev.core.attributes,
          brand: result.vendor,
          price: result.default_price,
        },
      },
      shopify: {
        ...prev.shopify,
        body_html: result.publish_description,
      },
    }));
    setPublishFieldErrors((prev) => ({ ...prev, price: false }));
  }

  async function pollPublishTargetAnalysisJob(jobId: string, marketplace: MarketKey, requestedProductId: string) {
    while (publishAnalysisJobRef.current === jobId) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));

      const response = await fetch(
        `/api/product-ai/products/${requestedProductId}/marketplaces/${marketplace}/publish-target/jobs/${jobId}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not load publish target analysis job status.");
      }

      const job = (await response.json()) as ApiPublishTargetAnalysisJob;
      if (publishAnalysisJobRef.current !== jobId || productId !== requestedProductId) {
        return;
      }

      if (job.status === "failed") {
        publishAnalysisJobRef.current = null;
        throw new Error(job.error ?? "Could not analyze publish target.");
      }

      if (job.status === "completed") {
        if (!job.result) {
          publishAnalysisJobRef.current = null;
          throw new Error("Publish target analysis completed without a result.");
        }

        setPublishAnalysis(job.result);
        applyPublishTargetAnalysis(job.result);
        setStatusMessage(job.result.analysis_summary || `Publish target analyzed for ${marketLabels[marketplace]}.`);
        publishAnalysisJobRef.current = null;
        return;
      }
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

  async function uploadSelectedSourceImage(file: File, successMessage: string) {
    if (!productId) {
      setStatusMessage("Generate or load a product draft before uploading a source image.");
      return false;
    }

    const formData = new FormData();
    formData.append("image", file);

    setIsUploadingSourceImage(true);
    try {
      const response = await fetch(`/api/product-ai/products/${productId}/source-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Could not upload the source image.");
      }

      const record = (await response.json()) as ApiRecord;
      applyRecord(record, successMessage);
      clearSelectedImageSelection();
      return true;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not upload the source image.");
      return false;
    } finally {
      setIsUploadingSourceImage(false);
    }
  }

  async function uploadProductSourceImage() {
    if (!selectedImage) {
      setStatusMessage("Choose a source image first.");
      return;
    }

    if (!productId) {
      setStatusMessage("Single-market generation is not available before the first AI draft exists. Click Generate AI once, then generate each marketplace separately.");
      return;
    }

    await uploadSelectedSourceImage(
      selectedImage,
      "Source image uploaded. Transparent cutout was refreshed and marketplace images are ready for on-demand generation.",
    );
  }

  function formatBytes(bytes?: number) {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  async function downloadMarketplaceImage(key: ImageCardKey, filename: string) {
    const card = imageCards.find((c) => c.key === key);
    const pathValue = card?.image?.absolute_path || card?.image?.relative_path;
    if (!pathValue) {
      setStatusMessage(`No image path found to download for ${key}.`);
      return;
    }
    try {
      const src = imageUrlFor(pathValue);
      if (!src) return;
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setStatusMessage(`Downloaded image: ${filename}`);
    } catch (error) {
      console.error("Failed to download image", error);
      setStatusMessage(`Download failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function downloadAllImages() {
    const cardsWithImages = imageCards.filter((c) => c.image?.absolute_path || c.image?.relative_path);
    if (cardsWithImages.length === 0) {
      setStatusMessage("No generated images available to download.");
      return;
    }
    setStatusMessage(`Bundling all (${cardsWithImages.length}) images into a ZIP...`);
    try {
      const zip = new JSZip();
      const titleBase = getPublishTitle().trim() || "product";
      const titleClean = titleBase.replace(/[^a-z0-9]/gi, "_").toLowerCase();

      for (let i = 0; i < cardsWithImages.length; i++) {
        const card = cardsWithImages[i];
        const pathValue = card.image?.absolute_path || card.image?.relative_path;
        if (!pathValue) continue;

        const src = imageUrlFor(pathValue);
        if (!src) continue;

        const response = await fetch(src);
        const blob = await response.blob();
        const filename = `${titleClean}_${card.key}.png`;
        zip.file(filename, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titleClean}_images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setStatusMessage(`ZIP file downloaded successfully: ${titleClean}_images.zip`);
    } catch (error) {
      console.error("Failed to bundle ZIP file", error);
      setStatusMessage(`ZIP generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function generateAllMarketplaceImages() {
    if (!productId) {
      setStatusMessage("Please generate the product draft with AI first.");
      return;
    }
    const marketsToGen: MarketKey[] = ["amazon", "ebay", "etsy", "tiktok", "shopify"];
    setStatusMessage("Generating images for all marketplaces in parallel...");
    await Promise.all(marketsToGen.map((m) => regenerateMarketplaceImage(m)));
    setStatusMessage("All marketplace image generations complete.");
  }

  async function clearMarketplaceImage(key: ImageCardKey) {
    const nextImages = { ...draft.images };
    if (nextImages[key]) {
      nextImages[key] = {
        ...nextImages[key],
        relative_path: "",
        absolute_path: "",
        validation: {
          ...nextImages[key].validation,
          passed: false,
          width: null,
          height: null,
          file_size_bytes: 0,
          errors: ["Image cleared manually."],
        },
      };
    }
    await saveDraft(nextImages);
    setStatusMessage(`Cleared image for ${marketLabels[key as MarketKey] ?? key}.`);
  }

  async function uploadCardImageDirect(key: ImageCardKey, file: File) {
    setImageUploadingMap((prev) => ({ ...prev, [key]: true }));
    setStatusMessage(`Uploading image for ${marketLabels[key as MarketKey] ?? key}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("market", key);
      formData.append("productId", productId || "draft");

      const response = await fetch("/api/product-ai/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Upload failed.");
      }

      const result = (await response.json()) as { relative_path: string; absolute_path: string };
      
      const nextImages = { ...draft.images };
      const currentImage = nextImages[key];
      
      let width: number | null = currentImage?.validation?.width ?? null;
      let height: number | null = currentImage?.validation?.height ?? null;

      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        img.onload = () => {
          width = img.width;
          height = img.height;
          URL.revokeObjectURL(img.src);
          resolve(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          resolve(false);
        };
      });

      nextImages[key] = {
        marketplace: key,
        relative_path: result.relative_path,
        absolute_path: result.absolute_path,
        prompt: currentImage?.prompt ?? `${key} image`,
        generation_mode: "manual_upload",
        mime_type: file.type || "image/png",
        validation: {
          passed: true,
          width: width,
          height: height,
          format: file.type.split("/")[1]?.toUpperCase() || "PNG",
          has_alpha: file.type === "image/png" || file.type === "image/webp",
          file_size_bytes: file.size,
          expected_width: currentImage?.validation?.expected_width ?? null,
          expected_height: currentImage?.validation?.expected_height ?? null,
          expected_background: currentImage?.validation?.expected_background ?? "opaque",
          errors: [],
          mime_type: file.type || "image/png",
        },
      };

      await saveDraft(nextImages);
      setStatusMessage(`Successfully uploaded and saved image for ${marketLabels[key as MarketKey] ?? key}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Image upload failed.";
      setStatusMessage(`Upload failed: ${msg}`);
    } finally {
      setImageUploadingMap((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function validateAndUploadCardImage(key: ImageCardKey, file: File) {
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      setStatusMessage(`Invalid file type. Allowed: PNG, JPG, WEBP.`);
      return;
    }

    const maxBytes = 10 * 1024 * 1024; // 10 MB limit
    if (file.size > maxBytes) {
      setStatusMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Max is 10 MB.`);
      return;
    }

    if (key === "source") {
      setSelectedImage(file);
      setStatusMessage(`Selected source image: ${file.name}`);
      return;
    }

    await uploadCardImageDirect(key, file);
  }

  async function onManualUploadSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !activeUploadCardKey) return;
    await validateAndUploadCardImage(activeUploadCardKey, file);
    event.target.value = "";
  }

  function handleCardDrop(e: React.DragEvent<HTMLDivElement>, key: ImageCardKey) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void validateAndUploadCardImage(key, file);
    }
  }

  async function regenerateMarketplaceImage(market: MarketKey) {
    if (!productId) {
      await generateMarketplaceDraft(market);
      return;
    }

    if (!hasSourceImage) {
      if (!selectedImage) {
        setStatusMessage("Upload a source image first, then generate the marketplace image you want.");
        return;
      }

      const uploadSucceeded = await uploadSelectedSourceImage(
        selectedImage,
        `Source image uploaded. Generating the ${marketLabels[market]} image now...`,
      );

      if (!uploadSucceeded) {
        return;
      }
    }

    setMarketImageGenerating((prev) => ({ ...prev, [market]: true }));
    try {
      const response = await fetch(`/api/product-ai/products/${productId}/marketplaces/${market}/regenerate`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? `Could not generate the ${marketLabels[market]} image.`);
      }

      const record = (await response.json()) as ApiRecord;
      applyRecord(
        record,
        `${marketLabels[market]} image generated for the selected marketplace.`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `Could not generate the ${marketLabels[market]} image.`);
    } finally {
      setMarketImageGenerating((prev) => ({ ...prev, [market]: false }));
    }
  }

  const currentVariants = variantsByMarket[activeMarket] ?? [];

  return (
    <section className="px-4 pt-1 pb-5 md:px-8 md:pt-4 md:pb-8">
      <input
        accept="image/*"
        className="hidden"
        onChange={onFileSelected}
        ref={productImageUploadInputRef}
        type="file"
      />
      <input
        accept="image/*"
        className="hidden"
        onChange={onFileSelected}
        ref={uploadInputRef}
        type="file"
      />

      <div className="space-y-6">
        <header className="sticky top-16 md:top-4 z-30 rounded-2xl border border-[#2b3a5f] bg-[#1a2545]/95 backdrop-blur-md px-5 py-3 text-white shadow-[0_16px_35px_-24px_rgba(7,17,41,0.95)]">
          <div className="flex flex-col gap-3">
            {/* Top Row: Breadcrumbs, Title, ID and Status Message */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-[#aab8d6] uppercase tracking-wide">Products &nbsp;&gt;&nbsp; Add Product</p>
                  <h1 className="text-lg font-bold leading-tight">Add Product</h1>
                </div>
                {productId ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#dce7fb] border border-[#51658f]/30">
                    ID: {productId.slice(0, 8)}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#1b325f]/50 px-3 py-1 text-xs font-medium text-[#7adfff] border border-[#3059a4]/50">
                  {statusMessage}
                </span>
              </div>
            </div>

            {/* Bottom Row: Source Input, Upload, and Primary/Secondary Actions */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-t border-[#2b3a5f]/40 pt-3">
              {/* Product title input */}
              <div className="flex-1 max-w-xl">
                <input
                  className={`w-full h-10 rounded-xl bg-white/5 px-3.5 text-sm text-white outline-none transition placeholder:text-[#aab8d6] ${
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
              </div>

              {/* Grouped buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Draft management controls inside a unified segment container */}
                <div className="flex items-center bg-white/5 rounded-xl border border-[#51658f]/40 p-0.5">
                  <button
                    className="h-8 rounded-lg px-3 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                    disabled={!hasSavedDraft}
                    onClick={() => loadSavedDraft()}
                    type="button"
                  >
                    Load
                  </button>
                  <button
                    className="h-8 rounded-lg px-3 text-xs font-semibold text-[#dce7fb] transition hover:bg-white/10 cursor-pointer"
                    onClick={() => clearSavedDraft()}
                    type="button"
                  >
                    Clear
                  </button>
                  <button
                    className="h-8 rounded-lg px-3 text-xs font-semibold text-[#ffd8de] transition hover:bg-[#39151d] disabled:opacity-30 cursor-pointer"
                    disabled={isDeletingDraft}
                    onClick={() => void deleteDraft()}
                    type="button"
                  >
                    {isDeletingDraft ? "..." : "Delete"}
                  </button>
                </div>

                {/* Upload action */}
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#51658f] bg-white/5 px-3 text-xs font-semibold text-white cursor-pointer"
                  onClick={() => uploadInputRef.current?.click()}
                  type="button"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {selectedImage ? selectedImage.name.slice(0, 12) + "..." : "Upload Product"}
                </button>

                {hasPersistedProduct && (
                  <button
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#51658f] bg-white/5 px-3 text-xs font-semibold text-white disabled:opacity-60 cursor-pointer"
                    disabled={isUploadingSourceImage || !selectedImage}
                    onClick={() => void uploadProductSourceImage()}
                    type="button"
                  >
                    {isUploadingSourceImage ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Upload Src
                  </button>
                )}

                {/* Optimize Action */}
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#51658f] bg-white/5 px-3 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
                  disabled={!hasPersistedProduct || isOptimizing}
                  onClick={() => void optimizeAllMarketplaces()}
                  type="button"
                >
                  {isOptimizing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Optimize All
                </button>

                {/* Main AI Generation CTA */}
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#35d3ce] px-4 text-xs font-bold text-[#153c53] transition hover:bg-[#2bc7c2] disabled:opacity-60 cursor-pointer"
                  disabled={isGenerating}
                  onClick={() => void generateProduct()}
                  type="button"
                >
                  {isGenerating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isGenerating ? "Generating..." : "Generate AI"}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_380px] xl:h-[calc(100vh-168px)] xl:overflow-hidden">
          <div className="space-y-5 xl:h-full xl:overflow-y-auto xl:pr-2">
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

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <EditableField
                  label="Vendor / Brand"
                  onChange={(value) => {
                    setPublishVendor(value);
                    setDraft((prev) => {
                      const nextAttributes = { ...prev.core.attributes };
                      if (value.trim()) {
                        nextAttributes.brand = value.trim();
                      } else {
                        delete nextAttributes.brand;
                      }

                      return {
                        ...prev,
                        core: {
                          ...prev.core,
                          attributes: nextAttributes,
                        },
                      };
                    });
                  }}
                  value={publishVendor}
                />
                <EditableField
                  label="Default SKU"
                  onChange={(value) => {
                    setPublishSku(value);
                    setDraft((prev) => {
                      const nextAttributes = { ...prev.core.attributes };
                      if (value.trim()) {
                        nextAttributes.sku = value.trim();
                      } else {
                        delete nextAttributes.sku;
                      }

                      return {
                        ...prev,
                        core: {
                          ...prev.core,
                          attributes: nextAttributes,
                        },
                      };
                    });
                  }}
                  value={publishSku}
                />
                <div className={`block rounded-2xl border bg-[#f8fbff] p-4 ${publishFieldErrors.price ? "border-[#ef6b6b] bg-[#fff7f7]" : "border-[#dbe2ee]"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Default Price</p>
                  {publishFieldErrors.price ? <p className="mt-1 text-xs text-[#cf4b4b]">Required for Shopify publish.</p> : null}
                  <div className={`mt-2 flex h-11 w-full items-center rounded-xl border bg-white overflow-hidden transition-all focus-within:border-[#97abd0] ${publishFieldErrors.price ? "border-[#ef6b6b]" : "border-[#d4ddec]"}`}>
                    {/* Decrement Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(publishPrice) || 0;
                        const nextVal = Math.max(0, current - 1);
                        updatePublishPrice(nextVal.toFixed(2));
                      }}
                      className="flex h-full w-10 items-center justify-center text-[#64748b] hover:bg-slate-50 active:bg-slate-100 transition-colors border-r border-[#d4ddec] select-none font-bold text-lg cursor-pointer"
                    >
                      &minus;
                    </button>

                    {/* Currency Symbol Prefix */}
                    <span className="pl-3 text-sm font-semibold text-[#8ea0bf] select-none">
                      £
                    </span>
                    
                    {/* Numeric Input */}
                    <input
                      className="h-full flex-1 bg-transparent pl-1 pr-4 text-center text-sm font-semibold text-[#31415e] outline-none"
                      onChange={(event) => {
                        const val = event.target.value.replace(/[^0-9.]/g, "");
                        const parts = val.split(".");
                        if (parts.length > 2) {
                          return;
                        }
                        updatePublishPrice(val);
                      }}
                      onBlur={() => {
                        const parsed = parseFloat(publishPrice);
                        if (!isNaN(parsed) && parsed >= 0) {
                          updatePublishPrice(parsed.toFixed(2));
                        }
                      }}
                      type="text"
                      value={publishPrice}
                    />

                    {/* Increment Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(publishPrice) || 0;
                        const nextVal = Math.max(0, current + 1);
                        updatePublishPrice(nextVal.toFixed(2));
                      }}
                      className="flex h-full w-10 items-center justify-center text-[#64748b] hover:bg-slate-50 active:bg-slate-100 transition-colors border-l border-[#d4ddec] select-none font-bold text-lg cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="block rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Stock Count</p>
                  <div className="mt-2 flex h-11 w-full items-center rounded-xl border border-[#d4ddec] bg-white overflow-hidden transition-all focus-within:border-[#97abd0]">
                    {/* Decrement Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(publishStock, 10) || 0;
                        setPublishStock(Math.max(0, current - 1).toString());
                      }}
                      className="flex h-full w-10 items-center justify-center text-[#64748b] hover:bg-slate-50 active:bg-slate-100 transition-colors border-r border-[#d4ddec] select-none font-bold text-lg cursor-pointer"
                    >
                      &minus;
                    </button>
                    
                    {/* Numeric Input */}
                    <input
                      className="h-full flex-1 bg-transparent px-3 text-center text-sm font-semibold text-[#31415e] outline-none"
                      onChange={(event) => {
                        const val = event.target.value.replace(/[^0-9]/g, "");
                        setPublishStock(val || "0");
                      }}
                      type="text"
                      value={publishStock}
                    />

                    {/* Increment Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(publishStock, 10) || 0;
                        setPublishStock((current + 1).toString());
                      }}
                      className="flex h-full w-10 items-center justify-center text-[#64748b] hover:bg-slate-50 active:bg-slate-100 transition-colors border-l border-[#d4ddec] select-none font-bold text-lg cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  {/* Primary Upload Status */}
                  <div className="relative rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4" ref={statusDropdownRef}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Primary Upload Status</p>
                    <p className="mt-1 text-xs text-[#8ea0bf]">`Upload to Shopify` always creates or updates an ACTIVE Shopify product. `Upload as Draft` always forces DRAFT.</p>
                    
                    {/* Dropdown Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="mt-2 h-11 w-full rounded-xl border border-[#d4ddec] bg-white px-4 text-sm text-[#31415e] font-semibold outline-none transition-all flex items-center justify-between hover:border-[#b8c9e4] focus:border-[#97abd0] cursor-pointer"
                    >
                      <span>{publishStatus}</span>
                      <ChevronDown className={`h-4 w-4 text-[#8ea0bf] transition-transform duration-200 ${isStatusDropdownOpen ? "transform rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isStatusDropdownOpen && (
                      <div className="absolute left-4 right-4 z-30 mt-1.5 rounded-xl border border-[#e2e8f0] bg-white p-1.5 shadow-lg shadow-[#0f172a]/8 transition-all duration-150 animate-in fade-in slide-in-from-top-1">
                        {publishStatusOptions.map((status) => {
                          const isSelected = publishStatus === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setPublishStatus(status);
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                                isSelected 
                                  ? "bg-[#edf5ff] text-[#1b2748]" 
                                  : "text-[#4a5d7d] hover:bg-[#f8fbff] hover:text-[#172544]"
                              }`}
                            >
                              <span>{status}</span>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-[#2b7cf5]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Publish to Online Store */}
                  <div className="relative rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4" ref={onlineStoreDropdownRef}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Publish to Online Store</p>
                    <p className="mt-1 text-xs text-[#8ea0bf]">Controls storefront channel availability immediately upon upload.</p>
                    
                    {/* Dropdown Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsOnlineStoreDropdownOpen(!isOnlineStoreDropdownOpen)}
                      className="mt-2 h-11 w-full rounded-xl border border-[#d4ddec] bg-white px-4 text-sm text-[#31415e] font-semibold outline-none transition-all flex items-center justify-between hover:border-[#b8c9e4] focus:border-[#97abd0] cursor-pointer"
                    >
                      <span>{publishOnOnlineStore ? "Yes" : "No"}</span>
                      <ChevronDown className={`h-4 w-4 text-[#8ea0bf] transition-transform duration-200 ${isOnlineStoreDropdownOpen ? "transform rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isOnlineStoreDropdownOpen && (
                      <div className="absolute left-4 right-4 z-30 mt-1.5 rounded-xl border border-[#e2e8f0] bg-white p-1.5 shadow-lg shadow-[#0f172a]/8 transition-all duration-150 animate-in fade-in slide-in-from-top-1">
                        {["Yes", "No"].map((option) => {
                          const optionVal = option === "Yes";
                          const isSelected = publishOnOnlineStore === optionVal;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setPublishOnOnlineStore(optionVal);
                                setIsOnlineStoreDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                                isSelected 
                                  ? "bg-[#edf5ff] text-[#1b2748]" 
                                  : "text-[#4a5d7d] hover:bg-[#f8fbff] hover:text-[#172544]"
                              }`}
                            >
                              <span>{option}</span>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-[#2b7cf5]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Track Inventory */}
                  <div className="relative rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4" ref={trackInventoryDropdownRef}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Track Inventory</p>
                    <p className="mt-1 text-xs text-[#8ea0bf]">Controls whether Shopify tracks inventory levels for this product&apos;s variant.</p>
                    
                    {/* Dropdown Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsTrackInventoryDropdownOpen(!isTrackInventoryDropdownOpen)}
                      className="mt-2 h-11 w-full rounded-xl border border-[#d4ddec] bg-white px-4 text-sm text-[#31415e] font-semibold outline-none transition-all flex items-center justify-between hover:border-[#b8c9e4] focus:border-[#97abd0] cursor-pointer"
                    >
                      <span>{publishTrackInventory ? "Yes" : "No"}</span>
                      <ChevronDown className={`h-4 w-4 text-[#8ea0bf] transition-transform duration-200 ${isTrackInventoryDropdownOpen ? "transform rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isTrackInventoryDropdownOpen && (
                      <div className="absolute left-4 right-4 z-30 mt-1.5 rounded-xl border border-[#e2e8f0] bg-white p-1.5 shadow-lg shadow-[#0f172a]/8 transition-all duration-150 animate-in fade-in slide-in-from-top-1">
                        {["Yes", "No"].map((option) => {
                          const optionVal = option === "Yes";
                          const isSelected = publishTrackInventory === optionVal;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setPublishTrackInventory(optionVal);
                                setIsTrackInventoryDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                                isSelected 
                                  ? "bg-[#edf5ff] text-[#1b2748]" 
                                  : "text-[#4a5d7d] hover:bg-[#f8fbff] hover:text-[#172544]"
                              }`}
                            >
                              <span>{option}</span>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-[#2b7cf5]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <EditableField
                  label="Publish Description"
                  helperText="Used as the default storefront description during publish."
                  multiline
                  onChange={setPublishDescription}
                  value={publishDescription}
                  className="h-full"
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] px-4 py-4 text-sm leading-6 text-[#667a99]">
                  MVP publish sends basic Shopify product fields only. Images, inventory, SEO, and variants will be added later.
                </div>
                <div className="rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Suggested Price Range</p>
                  <p className="mt-1 text-xs text-[#8ea0bf]">
                    {getEstimatedPriceRange()
                      ? `Estimated from ${publishAnalysis?.suggested_price_range?.source ?? "market research"} for ${marketLabels[activeMarket]}.`
                      : "Run dynamic pricing to calculate a recommended convenience range."}
                  </p>
                  {getEstimatedPriceRange() ? (
                    <>
                      <p className="mt-3 text-lg font-semibold text-[#31415e]">
                        £{getEstimatedPriceRange()?.minimum.toFixed(2)} - £{getEstimatedPriceRange()?.maximum.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">
                        Recommended: £{getEstimatedPriceRange()?.recommended.toFixed(2)} | Source: {getEstimatedPriceRange()?.source}
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-[#667a99]">No calculated range yet.</p>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Dynamic Pricing</p>
                    <p className="mt-1 text-sm text-[#6f82a3]">
                      Analyze the current draft and selected marketplace to calculate a recommended sell price.
                    </p>
                  </div>
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-4 text-sm font-semibold text-[#4a5d7d] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!hasPersistedProduct || isAnalyzingPublishTarget}
                    onClick={() => void analyzeDynamicPricing()}
                    type="button"
                  >
                    {isAnalyzingPublishTarget ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    {isAnalyzingPublishTarget ? "Analyzing..." : "Analyze Dynamic Pricing"}
                  </button>
                </div>

                {publishAnalysis ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Marketplace</p>
                      <p className="mt-2 text-sm font-semibold text-[#31415e]">{marketLabels[publishAnalysis.marketplace]}</p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">Source: {publishAnalysis.suggested_price_range?.source ?? "market_research"}</p>
                    </div>
                    <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Default Price</p>
                      <p className="mt-2 text-sm font-semibold text-[#31415e]">£{publishAnalysis.default_price}</p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">Default SKU: {publishAnalysis.default_sku}</p>
                    </div>
                    <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Vendor / Brand</p>
                      <p className="mt-2 text-sm font-semibold text-[#31415e]">{publishAnalysis.vendor}</p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">{publishAnalysis.market_signal || "Market signal available after analysis."}</p>
                    </div>
                    <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Suggested Range</p>
                      <p className="mt-2 text-sm font-semibold text-[#31415e]">
                        £{publishAnalysis.suggested_price_range?.minimum.toFixed(2)} - £{publishAnalysis.suggested_price_range?.maximum.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-[#8ea0bf]">
                        Recommended: £{publishAnalysis.suggested_price_range?.recommended.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Publish Description</p>
                      <p className="mt-2 line-clamp-4 text-sm leading-6 text-[#31415e]">{publishAnalysis.publish_description}</p>
                    </div>
                  </div>
                ) : null}

                {publishAnalysis ? (
                  <div className="mt-3 rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-sm leading-6 text-[#667a99]">
                    {publishAnalysis.analysis_summary}
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

          <aside className="space-y-5 xl:h-full xl:overflow-y-auto xl:pr-2">
            <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#eef2f6] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eefaf7] text-[#2dc7c3]">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1f2c44]">Generated Images</h2>
                    <p className="text-xs text-[#7f92b1]">Upload custom files or generate marketplace-ready views.</p>
                  </div>
                </div>
              </div>

              {/* Channel Filter Dropdown */}
              <div className="relative mt-4 z-40" ref={filterDropdownRef}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2] mb-1.5">View Channel / Card</p>
                <button
                  type="button"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="h-11 w-full rounded-xl border border-[#d4ddec] bg-[#f8fbff] px-4 text-sm text-[#31415e] font-semibold outline-none transition-all flex items-center justify-between hover:border-[#b8c9e4] focus:border-[#97abd0] cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    {(() => {
                      const activeOpt = filterOptions.find(opt => opt.key === selectedFilterKey);
                      if (activeOpt) {
                        const IconComponent = activeOpt.icon;
                        return <IconComponent className="h-4 w-4 text-[#2b7cf5]" />;
                      }
                      return <Filter className="h-4 w-4 text-[#8ea0bf]" />;
                    })()}
                    {filterOptions.find(opt => opt.key === selectedFilterKey)?.label}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#8ea0bf] transition-transform duration-200 ${isFilterDropdownOpen ? "transform rotate-180" : ""}`} />
                </button>

                {isFilterDropdownOpen && (
                  <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-[#e2e8f0] bg-white p-1.5 shadow-lg shadow-[#0f172a]/8 transition-all duration-150 animate-in fade-in slide-in-from-top-1">
                    {filterOptions.map((opt) => {
                      const isSelected = selectedFilterKey === opt.key;
                      const IconComponent = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setSelectedFilterKey(opt.key);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                            isSelected 
                              ? "bg-[#edf5ff] text-[#1b2748]" 
                              : "text-[#4a5d7d] hover:bg-[#f8fbff] hover:text-[#172544]"
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <IconComponent className={`h-4 w-4 transition-colors duration-150 ${isSelected ? "text-[#2b7cf5]" : "text-[#8ea0bf]"}`} />
                            {opt.label}
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-[#2b7cf5]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Global Actions Area */}
              <div className="flex gap-3 mt-4 border-b border-[#eef2f6] pb-4">
                <button
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#172544] to-[#263c70] px-4 text-xs font-bold text-white shadow-sm hover:shadow-md active:scale-98 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!productId || Object.values(marketImageGenerating).some(Boolean) || isGenerating}
                  onClick={() => void generateAllMarketplaceImages()}
                  type="button"
                >
                  {Object.values(marketImageGenerating).some(Boolean) ? (
                    <LoaderCircle className="h-4 w-4 animate-spin text-[#35d3ce]" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-[#35d3ce]" />
                  )}
                  {Object.values(marketImageGenerating).some(Boolean) ? "Generating..." : "Generate All"}
                </button>
                <button
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dbe2ee] bg-white px-4 text-xs font-bold text-[#31415e] shadow-sm hover:bg-[#f8fbff] active:scale-98 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!imageCards.some(card => card.image?.absolute_path || card.image?.relative_path)}
                  onClick={() => void downloadAllImages()}
                  type="button"
                >
                  <Download className="h-4 w-4 text-[#4a5d7d]" />
                  Download All
                </button>
              </div>

              {/* Hidden file input for manual card uploads */}
              <input
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={onManualUploadSelected}
                ref={manualUploadInputRef}
                type="file"
              />

              {/* Reusable Platform Cards */}
              <div className="mt-5 space-y-5">
                {imageCards
                  .filter(({ key }) => selectedFilterKey === "all" || key === selectedFilterKey)
                  .map(({ key, label, image, note }) => {
                  const hasPath = Boolean(image?.absolute_path || image?.relative_path);
                  const isUploading = Boolean(imageUploadingMap[key]);
                  const isGeneratingThis = key !== "source" && key !== "transparent_cutout" && Boolean(marketImageGenerating[key as MarketKey]);
                  const isBusy = isUploading || isGeneratingThis || (key === "transparent_cutout" && isUploadingSourceImage);

                  const rawErrors = image?.validation?.errors ?? [];
                  const validationErrors = rawErrors.filter((err) => {
                    if (err === "No source image uploaded yet." && (hasPath || (key === "source" && selectedImagePreviewUrl))) {
                      return false;
                    }
                    return true;
                  });
                  
                  // Status resolving
                  let statusText = "Not Generated";
                  let badgeStyles = "bg-slate-50 text-slate-600 border-slate-200";
                  
                  if (isUploading) {
                    statusText = "Uploading...";
                    badgeStyles = "bg-blue-50 text-blue-600 border-blue-200 animate-pulse";
                  } else if (isGeneratingThis) {
                    statusText = "Generating...";
                    badgeStyles = "bg-purple-50 text-purple-600 border-purple-200 animate-pulse";
                  } else if (hasPath) {
                    if (validationErrors.length > 0) {
                      statusText = "Failed";
                      badgeStyles = "bg-rose-50 text-rose-700 border-rose-200";
                    } else if (image?.validation?.passed) {
                      statusText = "Ready";
                      badgeStyles = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    } else {
                      statusText = "Review";
                      badgeStyles = "bg-amber-50 text-amber-700 border-amber-200";
                    }
                  } else if (key === "source" && selectedImagePreviewUrl) {
                    statusText = "Selected";
                    badgeStyles = "bg-indigo-50 text-indigo-700 border-indigo-200";
                  }

                  const isDraggingOver = draggingOverCardKey === key;
                  const filename = `${(getPublishTitle() || "product").replace(/\s+/g, "_").toLowerCase()}_${key}.png`;

                  return (
                    <div 
                      className={`group relative rounded-2xl border bg-white p-4 transition-all duration-300 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] ${
                        isDraggingOver 
                          ? "border-indigo-500 ring-2 ring-indigo-50" 
                          : "border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
                      }`}
                      key={key}
                      onDragLeave={() => setDraggingOverCardKey(null)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDraggingOverCardKey(key);
                      }}
                      onDrop={(e) => {
                        setDraggingOverCardKey(null);
                        handleCardDrop(e, key);
                      }}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[#1e293b] flex items-center gap-1.5">
                            {label}
                          </h3>
                          <span className="text-[10px] font-mono tracking-wider text-[#94a3b8] uppercase">
                            {key === "source" && selectedImagePreviewUrl && !hasPath
                              ? "local_selection"
                              : image?.generation_mode ?? "inactive_slot"}
                          </span>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all duration-300 ${badgeStyles}`}>
                          {statusText}
                        </span>
                      </div>

                      {/* Preview Box Area */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50 border border-dashed border-[#e2e8f0] transition-all duration-300 flex items-center justify-center">
                        {isBusy ? (
                          <div className="absolute inset-0 bg-white/85 z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-xs">
                            <LoaderCircle className="h-8 w-8 animate-spin text-[#172544]" />
                            <p className="text-xs font-semibold text-[#334155] animate-pulse">
                              {isUploading ? "Uploading file..." : "Generating image..."}
                            </p>
                          </div>
                        ) : null}

                        {hasPath ? (
                          <div className="relative w-full h-full">
                            <ProductPreview
                              alt={label}
                              backgroundLabel={image?.validation?.expected_background ?? "Image"}
                              image={image}
                              previewSrc={null}
                            />
                          </div>
                        ) : key === "source" && selectedImagePreviewUrl ? (
                          <div className="relative w-full h-full">
                            <ProductPreview
                              alt={label}
                              backgroundLabel="source"
                              image={null}
                              previewSrc={selectedImagePreviewUrl}
                            />
                          </div>
                        ) : (
                          // Drag and Drop Empty State
                          <div 
                            className={`flex flex-col items-center justify-center p-6 text-center w-full h-full select-none cursor-pointer transition-all duration-200 ${
                              isDraggingOver ? "bg-indigo-50/50" : "hover:bg-slate-100/30"
                            }`}
                            onClick={() => {
                              setActiveUploadCardKey(key);
                              manualUploadInputRef.current?.click();
                            }}
                          >
                            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#475569] group-hover:scale-110 transition-transform duration-300">
                              <Upload className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-semibold text-[#334155]">
                              {isDraggingOver ? "Drop image here" : "Upload or drop image"}
                            </p>
                            <p className="mt-1 text-[10px] text-[#94a3b8]">
                              PNG, JPG, WEBP • Max 10MB
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Technical/Validation Meta Deck */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-medium text-[#64748b]">
                        <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 flex flex-col justify-between">
                          <span className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-bold">Template BG</span>
                          <span className="text-[#334155] truncate font-semibold mt-0.5">
                            {key === "source" && selectedImagePreviewUrl && !hasPath
                              ? "selected local"
                              : image?.validation?.expected_background ?? "unknown"}
                          </span>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 flex flex-col justify-between">
                          <span className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-bold">Size & Format</span>
                          <span className="text-[#334155] truncate font-semibold mt-0.5">
                            {image?.validation?.width && image?.validation?.height
                              ? `${image.validation.width} x ${image.validation.height}`
                              : "Not generated"}
                          </span>
                        </div>
                      </div>

                      {/* Card Control Bar */}
                      <div className="mt-3 flex flex-col gap-2">
                        {/* Row 1: Primary Actions */}
                        <div className="flex gap-2 w-full">
                          {/* Generate/Regenerate for markets */}
                          {key !== "source" ? (
                            <button
                              className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#d5dcea] bg-white text-xs font-bold text-[#4a5d7d] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-200 px-3 whitespace-nowrap"
                              disabled={isBusy || isUploadingSourceImage || isGenerating}
                              onClick={() => {
                                if (key === "transparent_cutout") {
                                  void uploadProductSourceImage();
                                } else {
                                  void regenerateMarketplaceImage(key as MarketKey);
                                }
                              }}
                              type="button"
                            >
                              <RefreshCcw className={`h-3.5 w-3.5 ${(isGeneratingThis || (key === "transparent_cutout" && isUploadingSourceImage)) ? "animate-spin" : ""}`} />
                              {hasPath ? "Regenerate" : "Generate"}
                            </button>
                          ) : selectedImage ? (
                            <button
                              className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#172544] text-xs font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-200 px-3 whitespace-nowrap"
                              disabled={isUploadingSourceImage || isGenerating}
                              onClick={() => void uploadProductSourceImage()}
                              type="button"
                            >
                              {isUploadingSourceImage ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 text-[#35d3ce]" />}
                              Create Cutout
                            </button>
                          ) : null}

                          {/* Direct manual upload */}
                          <button
                            className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#d5dcea] bg-white px-3 text-xs font-bold text-[#4a5d7d] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-200 whitespace-nowrap"
                            disabled={isBusy}
                            onClick={() => {
                              setActiveUploadCardKey(key);
                              manualUploadInputRef.current?.click();
                            }}
                            title={hasPath ? "Replace Custom Image" : "Upload Custom Image"}
                            type="button"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {hasPath ? "Replace" : "Upload"}
                          </button>
                        </div>

                        {/* Row 2: Secondary/Utility Actions */}
                        {hasPath ? (
                          <div className="flex gap-2 w-full">
                            <button
                              className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#d5dcea] bg-white px-3 text-xs font-bold text-[#4a5d7d] hover:bg-[#f8fbff] hover:text-[#172544] transition-all duration-200"
                              onClick={() => void downloadMarketplaceImage(key, filename)}
                              title="Download Variant"
                              type="button"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Download</span>
                            </button>
                            <button
                              className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all duration-200"
                              onClick={() => void clearMarketplaceImage(key)}
                              title="Clear Image"
                              type="button"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {/* Display warning or file size validation details */}
                      {image?.validation?.file_size_bytes ? (
                        <p className="mt-2 text-[10px] text-[#94a3b8] flex items-center justify-between">
                          <span>File size: {formatBytes(image.validation.file_size_bytes)}</span>
                          {image.validation.mime_type ? (
                            <span className="font-semibold">{image.validation.mime_type}</span>
                          ) : null}
                        </p>
                      ) : null}

                      {validationErrors.length > 0 ? (
                        <div className="mt-2 rounded-lg bg-rose-50 border border-rose-100 p-2 text-[10px] text-rose-700 flex items-start gap-1">
                          <CircleAlert className="h-3 w-3 shrink-0 mt-0.5" />
                          <span className="leading-normal">{validationErrors[0]}</span>
                        </div>
                      ) : note ? (
                        <p className="mt-2 text-[10px] text-[#94a3b8] leading-normal">{note}</p>
                      ) : null}
                    </div>
                  );
                })}
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
