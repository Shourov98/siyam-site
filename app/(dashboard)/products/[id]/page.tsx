import Link from "next/link";
import {
  Bolt,
  CheckCheck,
  ChevronDown,
  CircleCheck,
  ImageIcon,
  Link2,
  List,
  ListOrdered,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import MediaTabClient from "./MediaTabClient";

type ProductEditPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

type TabKey = "general" | "media" | "inventory" | "seo";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "general", label: "General" },
  { key: "media", label: "Media & Variations" },
  { key: "inventory", label: "Inventory" },
  { key: "seo", label: "SEO" },
];

const isTab = (value: string): value is TabKey => {
  return tabs.some((tab) => tab.key === value);
};

function GeneralTab() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(270px,1fr)]">
      <div className="space-y-5">
        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <h2 className="text-base font-semibold text-[#1f2c44]">Basic Information</h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-[#3a4964]">Product Title</label>
                <span className="text-xs font-semibold text-[#8b99b5]">42/100</span>
              </div>
              <div className="flex rounded-lg border border-[#d5dcea] bg-[#f7f9fd] p-1">
                <input
                  className="w-full bg-transparent px-2 text-sm text-[#2f3f5f] outline-none"
                  defaultValue="Blue T-Shirt - 100% Cotton, Crew Neck"
                  type="text"
                />
                <button
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-[#1c2b4c] px-3 text-[11px] font-semibold uppercase tracking-wide text-white"
                  type="button"
                >
                  <Sparkles className="h-3 w-3" />
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a4964]">Description</label>
              <div className="overflow-hidden rounded-lg border border-[#d5dcea] bg-white">
                <div className="flex h-10 items-center gap-4 border-b border-[#e3e8f2] px-3 text-[#7a8cac]">
                  <button type="button">
                    <strong>B</strong>
                  </button>
                  <button className="italic" type="button">
                    I
                  </button>
                  <button className="underline" type="button">
                    U
                  </button>
                  <button type="button">
                    <List className="h-4 w-4" />
                  </button>
                  <button type="button">
                    <ListOrdered className="h-4 w-4" />
                  </button>
                  <button type="button">
                    <Link2 className="h-4 w-4" />
                  </button>
                  <button type="button">
                    <ImageIcon className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  className="h-[190px] w-full resize-none px-3 py-3 text-sm leading-7 text-[#404f6a] outline-none"
                  defaultValue={
                    "This premium Blue T-Shirt is crafted from 100% organic cotton, ensuring\nbreathability and comfort for all-day wear. The classic crew neck design makes it\na versatile addition to any wardrobe.\n\nKey Features:\n    Soft-touch fabric finish\n    Pre-shrunk to maintain fit\n    Double-stitched hems for durability\nMachine wash cold. Tumble dry low."
                  }
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#43d0d2]">
                Customers rely on detailed descriptions to make purchase decisions.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <h2 className="text-base font-semibold text-[#1f2c44]">Pricing &amp; Inventory</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a4964]">Base Price</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8090ad]">$</span>
                <input
                  className="h-11 w-full rounded-lg border border-[#d5dcea] bg-[#f7f9fd] pl-8 pr-3 text-sm text-[#33425f] outline-none"
                  defaultValue="24.00"
                  type="text"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a4964]">Compare at Price</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8090ad]">$</span>
                <input
                  className="h-11 w-full rounded-lg border border-[#d5dcea] bg-[#f7f9fd] pl-8 pr-3 text-sm text-[#33425f] outline-none"
                  defaultValue="35.00"
                  type="text"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a4964]">Cost per Item</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8090ad]">$</span>
                <input
                  className="h-11 w-full rounded-lg border border-[#d5dcea] bg-[#f7f9fd] pl-8 pr-3 text-sm text-[#33425f] outline-none"
                  defaultValue="8.50"
                  type="text"
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#8da1c7]">Customers won&apos;t see this</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a4964]">SKU (Stock Keeping Unit)</label>
              <input
                className="h-11 w-full rounded-lg border border-[#d5dcea] bg-[#f7f9fd] px-3 text-sm text-[#33425f] outline-none"
                defaultValue="TS-BLU-001"
                type="text"
              />
            </div>
          </div>
        </article>
      </div>

      <aside className="space-y-5">
        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <h3 className="text-base font-semibold uppercase text-[#202f49]">Organization</h3>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a4964]">Product Type</label>
              <div className="relative">
                <select className="h-11 w-full appearance-none rounded-lg border border-[#d5dcea] bg-[#f7f9fd] px-3 pr-10 text-sm text-[#33425f] outline-none">
                  <option>Apparel &gt; Men&apos;s Tops</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8898b5]" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a4964]">Vendor</label>
              <input
                className="h-11 w-full rounded-lg border border-[#d5dcea] bg-[#f7f9fd] px-3 text-sm text-[#33425f] outline-none"
                defaultValue="Acme Corp"
                type="text"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a4964]">Collections</label>
              <div className="relative">
                <select className="h-11 w-full appearance-none rounded-lg border border-[#d5dcea] bg-[#f7f9fd] px-3 pr-10 text-sm text-[#33425f] outline-none">
                  <option>Basics</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8898b5]" />
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold uppercase text-[#202f49]">Tags</h3>
            <button className="text-xs font-semibold text-[#5cd5d3]" type="button">
              Manage
            </button>
          </div>

          <div className="mt-4">
            <input
              className="h-10 w-full rounded-lg border border-[#d5dcea] bg-[#f7f9fd] px-3 text-sm text-[#33425f] outline-none"
              placeholder="Add a tag..."
              type="text"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {["Summer", "Cotton", "Casual"].map((tag) => (
                <span
                  className="inline-flex items-center rounded-md border border-[#d5dcea] bg-[#f7f9fd] px-2 py-1 text-xs font-semibold text-[#5e6f8e]"
                  key={tag}
                >
                  {tag} ×
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <h3 className="text-base font-semibold uppercase text-[#202f49]">Product Status</h3>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#3a4964]">Condition</label>
              <div className="relative">
                <select className="h-11 w-full appearance-none rounded-lg border border-[#d5dcea] bg-[#f7f9fd] px-3 pr-10 text-sm text-[#33425f] outline-none">
                  <option>New</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8898b5]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#3a4964]">Archive Product</p>
                  <p className="text-xs text-[#8fa0bf]">Hide from all channels</p>
                </div>
                <button className="relative h-6 w-12 rounded-full bg-[#d6dce8]" type="button">
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white" />
                </button>
              </div>
            </div>
          </div>
        </article>
      </aside>
    </div>
  );
}

function MediaTab() {
  return <MediaTabClient />;
}

function SeoTab() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(270px,1fr)]">
      <div className="space-y-5">
        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <h2 className="text-base font-semibold text-[#1f2c44]">Product Optimization</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-[#182442] p-4 text-white">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#afbdd8]">Overall Score</p>
                <CircleCheck className="h-4 w-4 text-[#9cf0c6]" />
              </div>
              <p className="mt-2 text-base font-semibold">87 <span className="text-sm font-medium text-[#90a4c5]">/100</span></p>
              <div className="mt-3 h-1.5 rounded bg-[#344a70]">
                <div className="h-1.5 w-[88%] rounded bg-[#22d3a8]" />
              </div>
            </div>
            <div className="rounded-xl bg-[#182442] p-4 text-white">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#afbdd8]">Readability</p>
                <CircleCheck className="h-4 w-4 text-[#95b8ff]" />
              </div>
              <p className="mt-2 text-base font-semibold">A+</p>
              <p className="mt-2 text-xs text-[#9bb0d0]">Excellent sentence structure</p>
            </div>
            <div className="rounded-xl bg-[#182442] p-4 text-white">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#afbdd8]">Keyword Strength</p>
                <CircleCheck className="h-4 w-4 text-[#d8a6ff]" />
              </div>
              <p className="mt-2 text-base font-semibold">High</p>
              <p className="mt-2 text-xs text-[#9bb0d0]">Top 10% in category</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-5 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <div className="flex items-end justify-between gap-3">
            <label className="text-sm font-medium text-[#3a4964]">Product Title</label>
            <button
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#1c2b4c] px-3 text-[11px] font-semibold uppercase tracking-wide text-white"
              type="button"
            >
              <Bolt className="h-3 w-3" />
              Generate
            </button>
          </div>
          <div className="mt-2 rounded-lg border border-[#d5dcea] bg-[#f7f9fd] px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <input
                className="w-full bg-transparent text-sm font-semibold text-[#2f3f5f] outline-none"
                defaultValue="Sony WH-1000XM5 Wireless Noise Canceling Headphones"
                type="text"
              />
              <span className="rounded bg-[#e1f7f2] px-2 py-0.5 text-xs font-semibold text-[#73b7a4]">65/80 chars</span>
            </div>
          </div>
          <p className="mt-3 inline-flex rounded-md bg-[#edfdf7] px-2 py-1 text-xs font-semibold text-[#43be9b]">
            <CircleCheck className="mr-1 h-3.5 w-3.5" /> Great length for Amazon search results.
          </p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[#3a4964]">Product Description</label>
              <button className="text-xs font-semibold text-[#6f7f9d]" type="button">
                Rewrite with AI
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-[#d5dcea] bg-white">
              <div className="flex h-9 items-center gap-4 bg-[#1c2b4c] px-3 text-[#d8e4fb]">
                <button type="button">
                  <strong>B</strong>
                </button>
                <button className="italic" type="button">
                  I
                </button>
                <button type="button">
                  <List className="h-4 w-4" />
                </button>
                <button type="button">
                  <Link2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                className="h-[130px] w-full resize-none bg-[#f8fafe] px-3 py-3 text-sm leading-7 text-[#5e6e88] outline-none"
                defaultValue={
                  "Experience industry-leading noise cancellation with the\nSony WH-1000XM5 headphones. Featuring two\nprocessors controlling eight microphones, Auto NC\nOptimizer for automatically optimizing noise canceling\nbased on your wearing conditions and environment, and a\nspecially designed driver unit."
                }
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-[#3a4964]">Target Keywords</label>
            <div className="rounded-xl border border-[#d5dcea] bg-[#f7f9fd] p-3">
              <div className="flex flex-wrap items-center gap-2">
                {["noise cancelling", "sony headphones", "wireless audio"].map((keyword) => (
                  <span
                    className="inline-flex items-center rounded-full border border-[#cfd8e7] bg-white px-3 py-1 text-xs font-semibold text-[#6d7f9f]"
                    key={keyword}
                  >
                    {keyword} ×
                  </span>
                ))}
                <input className="h-7 min-w-[140px] bg-transparent text-xs text-[#6d7f9f] outline-none" placeholder="Add keyword..." type="text" />
              </div>
            </div>
          </div>
        </article>
      </div>

      <aside className="space-y-5">
        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#233451]">Keyword Density</h3>
            <span className="text-xs font-semibold text-[#a1afc8]">Top 5</span>
          </div>
          {[['Sony', '4.2%', 72], ['Headphones', '3.8%', 61], ['Noise Cancelling', '2.5%', 43]].map(([word, pct, width]) => (
            <div className="mb-3" key={word}>
              <div className="mb-1 flex items-center justify-between text-xs font-medium text-[#6880a4]">
                <span>{word}</span>
                <span>{pct}</span>
              </div>
              <div className="h-1.5 rounded bg-[#e4ebf6]">
                <div className="h-1.5 rounded bg-[#35d3ce]" style={{ width: `${width}%` }} />
              </div>
            </div>
          ))}
          <button className="mt-2 h-9 w-full rounded-full border border-[#e1e8f4] text-xs font-semibold text-[#9aabc7]" type="button">
            View Full Analysis
          </button>
        </article>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#233451]">Keyword Bank</h3>
            <span className="text-xs font-semibold text-[#8094b7]">8 remaining</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Organic", "Cotton", "Unisex", "Eco-friendly", "Breathable", "Ethical"].map((term) => (
              <span className="rounded-md bg-[#edf7f2] px-2 py-1 text-xs font-semibold text-[#64897a]" key={term}>
                {term} ✓
              </span>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <h3 className="mb-3 text-base font-semibold text-[#233451]">Checklist</h3>
          <div className="space-y-2 text-sm text-[#485b7d]">
            <label className="flex items-start gap-2">
              <CheckCheck className="mt-0.5 h-4 w-4 text-[#35d3ce]" />
              <span>Title length optimal</span>
            </label>
            <label className="flex items-start gap-2">
              <CheckCheck className="mt-0.5 h-4 w-4 text-[#35d3ce]" />
              <span>Use 3 bullet points</span>
            </label>
            <label className="flex items-start gap-2 text-[#8b9bbb]">
              <span className="mt-0.5 h-4 w-4 rounded border border-[#cdd8ea]" />
              <span>Include &apos;Size Guide&apos; ref</span>
            </label>
          </div>
        </article>
      </aside>
    </div>
  );
}

function InventoryTab() {
  return (
    <article className="rounded-2xl border border-[#dbe2ee] bg-white p-8 text-center shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
      <WandSparkles className="mx-auto h-8 w-8 text-[#5f7cad]" />
      <h2 className="mt-3 text-base font-semibold text-[#20314d]">Inventory Tab Coming Next</h2>
      <p className="mt-2 text-sm text-[#6f7f9d]">
        Inventory-specific controls can be added here to match your flow after media and SEO are finalized.
      </p>
    </article>
  );
}

export default async function ProductEditPage({ params, searchParams }: ProductEditPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const requestedTab = resolvedSearchParams.tab ?? "general";
  const activeTab: TabKey = isTab(requestedTab) ? requestedTab : "general";
  const sku = `SKU: ${id.toUpperCase()}`;
  const isSeo = activeTab === "seo";

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-5">
        <header className="rounded-xl border border-[#2b3a5f] bg-[#1a2545] px-5 py-4 text-white shadow-[0_16px_35px_-24px_rgba(7,17,41,0.95)] md:px-6 md:py-5">
          <div className="flex flex-col gap-4 border-b border-[#33456f] pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold text-[#aab8d6]">Products &nbsp;&gt;&nbsp; Command Center &nbsp;&gt;&nbsp; Edit</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className="text-base font-semibold leading-tight text-[#f4f7ff]">Edit: Wireless Noise-Cancelling Headphones</h1>
                <span className="rounded-md border border-[#6c7da3] bg-[#eaf0fb] px-2 py-0.5 text-[11px] font-semibold text-[#304368]">
                  {sku}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#adb8d0] bg-[#f3f6fb] px-5 text-xs font-semibold text-[#3d4c6a] transition hover:bg-white"
                type="button"
              >
                Discard
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3dd7d3] px-8 text-xs font-semibold text-[#f8ffff] transition hover:bg-[#30c9c5]"
                type="button"
              >
                {isSeo ? <CircleCheck className="h-4 w-4" /> : null}
                {isSeo ? "Save Changes" : "Next"}
              </button>
            </div>
          </div>

          <nav className="mt-3 flex items-center gap-8">
            {tabs.map((tab) => {
              const href = `/products/${id}?tab=${tab.key}`;
              const isActive = activeTab === tab.key;

              return (
                <Link
                  className={`pb-2 text-xs font-semibold transition ${
                    isActive ? "border-b-2 border-[#35d3ce] text-[#3ce1dc]" : "text-[#8394bc] hover:text-[#d9e5ff]"
                  }`}
                  href={href}
                  key={tab.key}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {activeTab === "general" ? <GeneralTab /> : null}
        {activeTab === "media" ? <MediaTab /> : null}
        {activeTab === "seo" ? <SeoTab /> : null}
        {activeTab === "inventory" ? <InventoryTab /> : null}
      </div>
    </section>
  );
}
