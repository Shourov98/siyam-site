"use client";

import {
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  PackageCheck,
  Sparkles,
  Tags,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type MarketKey = "amazon" | "ebay" | "tiktok" | "shopify";

type ImageVariant = {
  label: string;
  mode: string;
  status: "ready" | "warning";
  background: string;
  size: string;
  validationNote: string;
};

type ProductDraft = {
  core: {
    normalized_title: string;
    category: string;
    product_type: string;
    product_summary: string;
    features: string[];
    attributes: Record<string, string>;
  };
  amazon: {
    title: string;
    bullet_points: string[];
    description: string;
    backend_search_terms: string[];
    structured_attributes: Record<string, string>;
  };
  ebay: {
    title: string;
    item_specifics: Record<string, string>;
    condition: string;
    listing_notes: string;
  };
  tiktok: {
    title: string;
    social_description: string;
    hashtags: string[];
  };
  shopify: {
    title: string;
    body_html: string;
    tags: string[];
    product_type: string;
    seo_title: string;
    seo_description: string;
  };
  images: Record<string, ImageVariant>;
};

const marketOrder: MarketKey[] = ["amazon", "ebay", "tiktok", "shopify"];

const marketLabels: Record<MarketKey, string> = {
  amazon: "Amazon",
  ebay: "eBay",
  tiktok: "TikTok Shop",
  shopify: "Shopify",
};

const sampleProduct: ProductDraft = {
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
      label: "Source Upload",
      mode: "source_passthrough",
      status: "ready",
      background: "original",
      size: "2048 x 2048",
      validationNote: "Original image stored for audit and future regeneration.",
    },
    transparent_cutout: {
      label: "Transparent Cutout",
      mode: "edited",
      status: "ready",
      background: "transparent",
      size: "1024 x 1024",
      validationNote: "Subject isolated and ready for white-background or styled composition.",
    },
    amazon: {
      label: "Amazon Main",
      mode: "local_composite_from_cutout",
      status: "ready",
      background: "white",
      size: "1024 x 1024",
      validationNote: "Built from transparent cutout onto a white canvas for marketplace compliance.",
    },
    ebay: {
      label: "eBay Main",
      mode: "local_composite_from_cutout",
      status: "ready",
      background: "white",
      size: "1024 x 1024",
      validationNote: "White studio background with unchanged product subject.",
    },
    tiktok: {
      label: "TikTok Hero",
      mode: "edited",
      status: "warning",
      background: "styled",
      size: "1024 x 1536",
      validationNote: "Background-only edit requested; review product color consistency before publish.",
    },
    shopify: {
      label: "Shopify Hero",
      mode: "edited",
      status: "ready",
      background: "styled",
      size: "1536 x 1536",
      validationNote: "Storefront-friendly styled background with product preserved from cutout source.",
    },
  },
};

function MarketTabLink({ market, activeMarket }: { market: MarketKey; activeMarket: MarketKey }) {
  const active = market === activeMarket;
  return (
    <Link
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-[#1b2748] text-white" : "bg-[#edf2fb] text-[#49607f] hover:bg-[#dfe9fb]"
      }`}
      href={`/products/add?market=${market}`}
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
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")}
      />
    </label>
  );
}

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

        const key = entry.slice(0, separatorIndex).trim();
        const fieldValue = entry.slice(separatorIndex + 1).trim();
        return [key, fieldValue];
      })
      .filter(([key, fieldValue]) => key || fieldValue),
  );
}

export default function AddProductEditor({ activeMarket }: { activeMarket: MarketKey }) {
  const [draft, setDraft] = useState<ProductDraft>(sampleProduct);
  const [statusMessage, setStatusMessage] = useState("Draft not saved");

  const saveDraft = () => {
    setStatusMessage("Draft changes captured locally");
  };

  const renderMarketPanel = () => {
    if (activeMarket === "amazon") {
      return (
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
      );
    }

    if (activeMarket === "ebay") {
      return (
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
      );
    }

    if (activeMarket === "tiktok") {
      return (
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
      );
    }

    return (
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
    );
  };

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-6">
        <header className="rounded-2xl border border-[#2b3a5f] bg-[#1a2545] px-5 py-5 text-white shadow-[0_16px_35px_-24px_rgba(7,17,41,0.95)]">
          <p className="text-xs font-semibold text-[#aab8d6]">Products &nbsp;&gt;&nbsp; Add Product</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Add Product</h1>
              <p className="mt-1 max-w-3xl text-sm text-[#8ea0bf]">
                The add-product flow should let users review and directly edit AI-generated core data and marketplace copy before anything is published.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#51658f] bg-white/5 px-3 py-2 text-xs font-semibold text-[#dce7fb]">
                {statusMessage}
              </span>
              <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#51658f] bg-white/5 px-4 text-sm font-semibold text-white" type="button">
                <Upload className="h-4 w-4" />
                Upload Product
              </button>
              <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#35d3ce] px-5 text-sm font-semibold text-[#153c53]" type="button">
                <Sparkles className="h-4 w-4" />
                Generate with AI
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
                  <p className="text-sm text-[#7f92b1]">Make the core product payload editable first. Everything else depends on this block being right.</p>
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
                  <p className="text-sm text-[#7f92b1]">Each marketplace needs editable fields because the agent output should be reviewed, corrected, and tightened before publish.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {marketOrder.map((marketKey) => (
                    <MarketTabLink activeMarket={activeMarket} key={marketKey} market={marketKey} />
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4">{renderMarketPanel()}</div>
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
                  <p className="text-sm text-[#7f92b1]">Images stay review-oriented here; the content blocks above are now editable.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {Object.entries(draft.images).map(([key, image]) => (
                  <div className="rounded-2xl border border-[#dbe2ee] bg-[#f8fbff] p-4" key={key}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#20314d]">{image.label}</p>
                        <p className="mt-1 text-xs text-[#8597b5]">{image.mode}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          image.status === "ready" ? "bg-[#def7ea] text-[#2ba66d]" : "bg-[#fff4d6] text-[#c48a07]"
                        }`}
                      >
                        {image.status === "ready" ? "Ready" : "Review"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[#5f7293]">
                      <div className="rounded-xl bg-white px-3 py-2">
                        <p className="font-semibold text-[#8ea0bf]">Background</p>
                        <p className="mt-1 text-sm text-[#31415e]">{image.background}</p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2">
                        <p className="font-semibold text-[#8ea0bf]">Size</p>
                        <p className="mt-1 text-sm text-[#31415e]">{image.size}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#6d7f9f]">{image.validationNote}</p>
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
                  <h2 className="text-lg font-semibold text-[#1f2c44]">Editing Guidance</h2>
                  <p className="text-sm text-[#7f92b1]">The goal is not just to display AI output. It is to make it safely editable.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-[#44526d]">
                {[
                  "Core data should stay editable because category, title, and attributes often need human correction.",
                  "Marketplace copy should be reviewed per channel instead of copied blindly from one shared form.",
                  "List-style fields work better as line-based editors than read-only chips when users need to refine them.",
                  "Key-value attributes should be editable because Amazon, eBay, and Shopify all rely on structured fields.",
                  "Keep image approval beside the copy so users can review the full listing package in one place.",
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
                  <h2 className="text-lg font-semibold text-[#1f2c44]">Next Integration Step</h2>
                  <p className="text-sm text-[#7f92b1]">Once the UX is right, we can bind this form to the real AI response and save API.</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-[#f8fbff] p-4 text-sm text-[#465574]">
                This page should become the review-and-edit surface for AI output. The manual `/products/[id]` editor can remain the secondary maintenance screen later.
              </div>
              <div className="mt-4 flex gap-3">
                <Link className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#172544] px-4 text-sm font-semibold text-white" href="/products">
                  <BadgeCheck className="h-4 w-4" />
                  Back to Products
                </Link>
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-4 text-sm font-semibold text-[#4a5d7d]"
                  onClick={saveDraft}
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save Draft
                </button>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}
