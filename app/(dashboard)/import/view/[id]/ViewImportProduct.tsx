"use client";

import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";

type ApiImageVariant = {
  marketplace: string;
  absolute_path: string;
  relative_path: string;
  validation: { passed: boolean; expected_background: string; errors: string[] };
};

type ApiProduct = {
  core: {
    normalized_title: string;
    category: string;
    product_type: string;
    product_summary: string;
    features: string[];
    attributes: Record<string, string>;
    source_title: string;
  };
  amazon: { title: string; bullet_points: string[]; description: string };
  ebay: { title: string; condition: string; listing_notes: string; item_specifics: Record<string, string> };
  etsy: { title: string; description: string; tags: string[]; materials: string[] };
  tiktok: { title: string; social_description: string; hashtags: string[] };
  shopify: { title: string; body_html: string; product_type: string; seo_title: string; seo_description: string; tags: string[] };
  images: {
    source: ApiImageVariant;
    transparent_cutout: ApiImageVariant | null;
    amazon: ApiImageVariant;
    ebay: ApiImageVariant;
    etsy: ApiImageVariant;
    tiktok: ApiImageVariant;
    shopify: ApiImageVariant;
  };
};

type ImportRecord = {
  id: string;
  status: string;
  linked_product_id: string | null;
  missing_fields: string[];
  notes: string[];
  product: ApiProduct;
};

function imageUrlFor(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return path;
}

export default function ViewImportProduct({ importId }: { importId: string }) {
  const [record, setRecord] = useState<ImportRecord | null>(null);
  const [message, setMessage] = useState("Loading imported product...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetch(`/api/product-ai/imports/products/${importId}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
          throw new Error(errorBody?.detail ?? "Could not load import record.");
        }
        return response.json() as Promise<ImportRecord>;
      })
      .then((payload) => {
        if (!active) return;
        setRecord(payload);
        setMessage("Imported product loaded.");
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Could not load import record.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [importId]);

  const previewImages = useMemo(() => {
    if (!record) return [];
    return [
      { key: "source", label: "Source", image: record.product.images.source },
      { key: "amazon", label: "Amazon", image: record.product.images.amazon },
      { key: "ebay", label: "eBay", image: record.product.images.ebay },
      { key: "etsy", label: "Etsy", image: record.product.images.etsy },
      { key: "tiktok", label: "TikTok", image: record.product.images.tiktok },
      { key: "shopify", label: "Shopify", image: record.product.images.shopify },
    ].filter((item) => Boolean(item.image?.absolute_path));
  }, [record]);

  if (!record && !isLoading) {
    return <section className="px-4 py-5 md:px-8 md:py-8"><div className="rounded-2xl border border-[#dbe2ee] bg-white p-6 text-sm text-[#546884]">{message}</div></section>;
  }

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-5">
        <div className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-5 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#a9b8d6]">Import Products &gt; View Imported Product</p>
              <h1 className="mt-2 text-2xl font-semibold">{record?.product.core.normalized_title || "Imported Product"}</h1>
              <p className="mt-1 text-sm text-[#a9b8d6]">{message}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#49618e] bg-[#213357] px-4 text-sm font-semibold text-white" href="/import">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              {record ? (
                <Link className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#35d3ce] px-4 text-sm font-semibold text-[#153c53]" href={`/import/${record.id}`}>
                  Edit
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-[#dbe2ee] bg-white p-6 text-sm text-[#546884]">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading import record...
            </div>
          </div>
        ) : record ? (
          <>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_380px]">
              <div className="space-y-5">
                <Panel title="Core Product Data">
                  <Field label="Title" value={record.product.core.normalized_title} />
                  <Field label="Source Title" value={record.product.core.source_title} />
                  <Field label="Category" value={record.product.core.category} />
                  <Field label="Product Type" value={record.product.core.product_type} />
                  <Field label="Summary" value={record.product.core.product_summary || "--"} multiline />
                </Panel>

                <Panel title="Marketplace Copy">
                  <Field label="Amazon Title" value={record.product.amazon.title || "--"} />
                  <Field label="Amazon Description" value={record.product.amazon.description || "--"} multiline />
                  <Field label="eBay Title" value={record.product.ebay.title || "--"} />
                  <Field label="eBay Notes" value={record.product.ebay.listing_notes || "--"} multiline />
                  <Field label="Etsy Title" value={record.product.etsy.title || "--"} />
                  <Field label="Etsy Description" value={record.product.etsy.description || "--"} multiline />
                  <Field label="TikTok Title" value={record.product.tiktok.title || "--"} />
                  <Field label="TikTok Description" value={record.product.tiktok.social_description || "--"} multiline />
                  <Field label="Shopify Title" value={record.product.shopify.title || "--"} />
                  <Field label="Shopify SEO Title" value={record.product.shopify.seo_title || "--"} />
                  <Field label="Shopify SEO Description" value={record.product.shopify.seo_description || "--"} multiline />
                </Panel>
              </div>

              <div className="space-y-5">
                <Panel title="Import Status">
                  <Field label="Status" value={record.status} />
                  <Field label="Linked Product" value={record.linked_product_id || "--"} />
                  <Field
                    label="Missing Fields"
                    value={record.missing_fields.length ? record.missing_fields.join(", ") : "None"}
                  />
                  <Field
                    label="Notes"
                    value={record.notes.length ? record.notes.join("\n") : "None"}
                    multiline
                  />
                  <div className="mt-4">
                    {record.missing_fields.length ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-semibold text-[#5e718e]">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Needs attention
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#eefbf4] px-3 py-1 text-xs font-semibold text-[#267a4f]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel title="Images">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {previewImages.map((item) => (
                      <div className="overflow-hidden rounded-2xl border border-[#dde5f1] bg-[#f6f8fc]" key={item.key}>
                        <div className="aspect-square bg-white">
                          <img alt={item.label} className="h-full w-full object-cover" src={imageUrlFor(item.image.absolute_path)} />
                        </div>
                        <div className="border-t border-[#dde5f1] px-3 py-2 text-xs font-semibold text-[#4b5c79]">{item.label}</div>
                      </div>
                    ))}
                    {previewImages.length === 0 ? <p className="text-sm text-[#7b89a6]">No preview images available.</p> : null}
                  </div>
                </Panel>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
      <h2 className="text-lg font-semibold text-[#243251]">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </article>
  );
}

function Field({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8ea0bf]">{label}</p>
      <div className={`rounded-xl border border-[#e3e9f3] bg-[#f8fbff] px-3 py-2 text-sm text-[#31425f] ${multiline ? "whitespace-pre-wrap" : ""}`}>
        {value}
      </div>
    </div>
  );
}
