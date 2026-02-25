import { AlertTriangle, CircleHelp, Link2, Sparkles } from "lucide-react";
import Link from "next/link";

type ResolvePageProps = {
  params: Promise<{ id: string }>;
};

function DetailRow({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`grid grid-cols-[72px_1fr] items-center gap-3 rounded-xl px-3 py-3 ${warn ? "bg-[#fff6ea]" : "bg-[#f4f7fd]"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${warn ? "text-[#ff7b2f]" : "text-[#7f92b1]"}`}>
        {warn ? <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> : null}
        {label}
      </p>
      <p className="text-sm font-semibold text-[#3a4b69]">{value}</p>
    </div>
  );
}

export default async function ResolveConflictPage({ params }: ResolvePageProps) {
  const { id } = await params;

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-4">
        <header className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-5 py-5 text-white">
          <p className="text-sm font-semibold text-[#a9b8d6]">Import Products &nbsp;&gt;&nbsp; Resolve Conflicts</p>
          <h1 className="mt-2 text-2xl font-semibold">Resolve Conflicts</h1>
          <p className="mt-1 text-xs text-[#8da0c1]">Conflict ID: {id}</p>
        </header>

        <article className="relative overflow-hidden rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#d0dff8] bg-[#f3f8ff] text-[#4e78be]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold text-[#1f2c44]">AI Suggestion Found</h2>
                  <span className="rounded-full bg-[#dff4e8] px-2 py-0.5 text-xs font-semibold text-[#37b87d]">94% Match Confidence</span>
                </div>
                <p className="mt-1 text-sm text-[#7f92b1]">
                  We think <span className="font-semibold text-[#3a4b69]">&apos;Blue T-Shirt&apos;</span> matches
                  <span className="font-semibold text-[#3a4b69]"> &apos;Navy Tee&apos;</span> based on image analysis and SKU pattern.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="h-10 rounded-xl border border-[#d6ddea] bg-[#f7f9fd] px-5 text-sm font-semibold text-[#4f607c]" type="button">
                Ignore
              </button>
              <Link className="inline-flex h-10 items-center rounded-xl bg-[#35d3ce] px-5 text-sm font-semibold text-white" href="/import/confirmation">
                ✓ Confirm Match
              </Link>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-4 right-4 text-[120px] font-black text-[#f1f5fb]">AI</div>
        </article>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Source</p>
                <h3 className="mt-1 text-xl font-semibold text-[#1f2c44]">Imported Product</h3>
              </div>
              <span className="rounded-full bg-[#edf2f8] px-3 py-1 text-xs font-semibold text-[#7c8da9]">Pending Review</span>
            </div>

            <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#f8fbff] p-3">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#8ac1df] to-[#4f98c4]" />
              <div>
                <p className="text-2xl font-semibold text-[#20314d]">Mns Blue T-Shirt</p>
                <p className="text-sm text-[#87a0c4]">Created: 2 hours ago</p>
              </div>
            </div>

            <div className="space-y-3">
              <DetailRow label="SKU" value="TIK-BLU-M" />
              <DetailRow label="Stock" value="50" warn />
              <DetailRow
                label="Desc"
                value="Classic fit men's t-shirt in electric blue. 100% Cotton. Breathable fabric perfect for summer days. Machine wash cold."
              />
              <DetailRow label="Price" value="$24.99" warn />
            </div>
          </article>

          <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8093b2]">Target</p>
                <h3 className="mt-1 text-xl font-semibold text-[#1f2c44]">Master Catalog Match</h3>
              </div>
              <span className="rounded-full bg-[#dff4e8] px-3 py-1 text-xs font-semibold text-[#37b87d]">Existing Item</span>
            </div>

            <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#f8fbff] p-3">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#f1d2af] to-[#ccab88]" />
              <div>
                <p className="text-2xl font-semibold text-[#20314d]">Men&apos;s Navy Tee - Summer Edition</p>
                <p className="text-sm text-[#87a0c4]">Updated: 2 days ago</p>
              </div>
            </div>

            <div className="space-y-3">
              <DetailRow label="SKU" value="MST-NAVY-M" />
              <DetailRow label="Stock" value="48" warn />
              <DetailRow
                label="Desc"
                value="High quality cotton blend tee. Features reinforced stitching and color-fast dye. Navy blue."
              />
              <DetailRow label="Price" value="$28.00" warn />
            </div>
          </article>
        </div>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="inline-flex items-center gap-2 text-sm text-[#8ea0bf]">
              <CircleHelp className="h-4 w-4" />
              Linking will update the Master Catalog with selected values.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button className="px-3 py-2 text-sm font-semibold text-[#4fcfca]" type="button">
                Skip / Ignore
              </button>
              <button className="h-10 rounded-xl border border-[#d6ddea] bg-[#f7f9fd] px-5 text-sm font-semibold text-[#4f607c]" type="button">
                Create New Product
              </button>
              <Link className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1b2748] px-5 text-sm font-semibold text-white" href="/import/confirmation">
                <Link2 className="h-4 w-4" />
                Link to Existing Product
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
