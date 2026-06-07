"use client";

import {
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
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

type MarketKey = "amazon" | "ebay" | "tiktok" | "shopify";

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

type ApiProduct = {
  core: ApiCore;
  amazon: ApiAmazon;
  ebay: ApiEbay;
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

type MarketActionState = Record<MarketKey, boolean>;

const marketOrder: MarketKey[] = ["amazon", "ebay", "tiktok", "shopify"];

const marketLabels: Record<MarketKey, string> = {
  amazon: "Amazon",
  ebay: "eBay",
  tiktok: "TikTok Shop",
  shopify: "Shopify",
};

const emptyActionState: MarketActionState = {
  amazon: false,
  ebay: false,
  tiktok: false,
  shopify: false,
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">{label}</p>
      {multiline ? (
        <textarea
          className="mt-2 min-h-28 w-full rounded-xl border border-[#d4ddec] bg-white px-3 py-3 text-sm text-[#31415e] outline-none transition focus:border-[#97abd0]"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      ) : (
        <input
          className="mt-2 h-11 w-full rounded-xl border border-[#d4ddec] bg-white px-3 text-sm text-[#31415e] outline-none transition focus:border-[#97abd0]"
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

export default function AddProductEditor({
  activeMarket,
  initialProductId,
}: {
  activeMarket: MarketKey;
  initialProductId: string | null;
}) {
  const router = useRouter();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<ApiProduct>(sampleProduct);
  const [variantsByMarket, setVariantsByMarket] = useState<Record<MarketKey, ApiVariant[]>>(sampleVariants);
  const [productId, setProductId] = useState<string | null>(initialProductId);
  const [statusMessage, setStatusMessage] = useState("Choose an image and generate a product draft.");
  const [sourceTitle, setSourceTitle] = useState(sampleProduct.core.source_title);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [marketRegenerating, setMarketRegenerating] = useState<MarketActionState>(emptyActionState);
  const [variantSubmitting, setVariantSubmitting] = useState<MarketActionState>(emptyActionState);
  const [variantInputs, setVariantInputs] = useState<Record<MarketKey, { size: string; color: string }>>({
    amazon: { size: "", color: "" },
    ebay: { size: "", color: "" },
    tiktok: { size: "", color: "" },
    shopify: { size: "", color: "" },
  });

  const hasPersistedProduct = Boolean(productId);

  useEffect(() => {
    if (!initialProductId) {
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
        setDraft(record.product);
        setVariantsByMarket(record.variants);
        setSourceTitle(record.product.core.source_title);
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
  }, [initialProductId]);

  const imageCards = useMemo(
    () => [
      { key: "source", label: "Source Upload", image: draft.images.source, note: "Original upload stored for audit and regeneration." },
      { key: "transparent_cutout", label: "Transparent Cutout", image: draft.images.transparent_cutout, note: "Used for white-background and styled marketplace compositions." },
      { key: "amazon", label: "Amazon Main", image: draft.images.amazon, note: "Marketplace-ready main image." },
      { key: "ebay", label: "eBay Main", image: draft.images.ebay, note: "Marketplace-ready main image." },
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
    setStatusMessage(message);
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
      applyRecord(record, "AI draft generated and connected to the add-product page.");
      router.replace(`/products/add?market=${activeMarket}&productId=${record.id}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Product generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveDraft() {
    if (!productId) {
      setStatusMessage("Generate a product first, then save the draft.");
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
          tiktok: draft.tiktok,
          shopify: draft.shopify,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? "Draft save failed.");
      }

      const record = (await response.json()) as ApiRecord;
      applyRecord(record, "Draft saved to product-ai-agent.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Draft save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function regenerateMarketplace(market: MarketKey) {
    if (!productId) {
      setStatusMessage("Generate a product before regenerating marketplace content.");
      return;
    }

    setMarketRegenerating((prev) => ({ ...prev, [market]: true }));
    try {
      const response = await fetch(`/api/product-ai/products/${productId}/marketplaces/${market}/regenerate`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? `Could not regenerate ${marketLabels[market]}.`);
      }

      const record = (await response.json()) as ApiRecord;
      applyRecord(record, `${marketLabels[market]} content and image regenerated.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `Could not regenerate ${marketLabels[market]}.`);
    } finally {
      setMarketRegenerating((prev) => ({ ...prev, [market]: false }));
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
                className="h-11 rounded-xl border border-[#51658f] bg-white/5 px-3 text-sm text-white outline-none transition placeholder:text-[#aab8d6] focus:border-[#8ea0bf]"
                onChange={(event) => {
                  const value = event.target.value;
                  setSourceTitle(value);
                  setDraft((prev) => ({ ...prev, core: { ...prev.core, source_title: value } }));
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
                  <p className="text-sm text-[#7f92b1]">You can edit per-marketplace content and also regenerate the active marketplace from the backend.</p>
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
                  onClick={() => void regenerateMarketplace(activeMarket)}
                  type="button"
                >
                  {marketRegenerating[activeMarket] ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  {marketRegenerating[activeMarket] ? "Regenerating..." : `Regenerate ${marketLabels[activeMarket]}`}
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

                {activeMarket === "shopify" ? (
                  <>
                    <EditableField
                      label="Storefront Title"
                      onChange={(value) => setDraft((prev) => ({ ...prev, shopify: { ...prev.shopify, title: value } }))}
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

          <aside className="space-y-5">
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
                  "Save Draft uses PATCH /api/product-ai/products/{id}.",
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
              <div className="mt-4 flex gap-3">
                <Link className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#172544] px-4 text-sm font-semibold text-white" href="/products">
                  <BadgeCheck className="h-4 w-4" />
                  Back to Products
                </Link>
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-4 text-sm font-semibold text-[#4a5d7d] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!hasPersistedProduct || isSaving}
                  onClick={() => void saveDraft()}
                  type="button"
                >
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}
