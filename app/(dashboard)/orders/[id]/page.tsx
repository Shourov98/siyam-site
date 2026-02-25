import { FileText, PackageCheck, Phone, Receipt, SendHorizontal, Truck } from "lucide-react";
import Link from "next/link";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const normalizedOrder = id.startsWith("#") ? id : `#${id.toUpperCase()}`;

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-4">
        <header className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-4 py-4 text-white md:px-6">
          <h1 className="text-2xl font-semibold">Order Detail Page</h1>
          <p className="mt-1 text-sm text-[#a9b8d6]">Order {normalizedOrder}</p>
        </header>

        <article className="rounded-xl border border-[#2c3b61] bg-[#1b2748] p-4 text-white md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#aab8d6]">Order Source</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8a100] text-xl font-bold text-[#1b2748]">
                  a
                </div>
                <div>
                  <p className="text-lg font-semibold">Amazon Marketplace</p>
                  <p className="text-xs text-[#9eb0d2]">Order ID: 114-3829102-48291</p>
                </div>
              </div>
            </div>

            <div className="w-full max-w-[360px] space-y-3">
              <div className="flex gap-2">
                <button
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[#7d8fb5] text-sm font-semibold text-[#dce6ff]"
                  type="button"
                >
                  <Receipt className="h-4 w-4" />
                  Invoice
                </button>
                <button
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[#7d8fb5] text-sm font-semibold text-[#dce6ff]"
                  type="button"
                >
                  <FileText className="h-4 w-4" />
                  Slip
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[#ef4a89]"
                  type="button"
                >
                  <span className="text-base">⊗</span>
                  Cancel Order
                </button>
                <Link
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#35d3ce] px-4 text-sm font-semibold text-white"
                  href={`/orders/${id}/shipping-label`}
                >
                  <PackageCheck className="h-4 w-4" />
                  Mark as Shipped
                </Link>
              </div>
            </div>
          </div>
        </article>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,1fr)]">
          <article className="overflow-hidden rounded-2xl border border-[#dbe2ee] bg-white shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
            <div className="flex items-center justify-between border-b border-[#e5ebf5] px-4 py-4 md:px-5">
              <h2 className="text-lg font-semibold text-[#1f2c44]">Items Purchased (2)</h2>
              <button className="text-sm font-semibold text-[#5b9dff]" type="button">
                Edit Order
              </button>
            </div>

            <div className="border-b border-[#eef2f8] px-4 py-4 md:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#638a82] to-[#355e58]" />
                  <div>
                    <p className="font-semibold text-[#2b3b57]">Wireless Noise-Canceling Headphones</p>
                    <p className="text-xs text-[#8ca0bf]">SKU: WNCH-001 &nbsp;&nbsp; Color: Midnight Black</p>
                    <div className="mt-1 inline-flex items-center gap-2 text-xs text-[#8fa1c0]">
                      QTY <span className="rounded-md bg-[#f0f4fb] px-2 py-0.5 font-semibold text-[#607394]">1</span>
                    </div>
                  </div>
                </div>
                <p className="text-xl font-semibold text-[#2f3f5d]">$299.00</p>
              </div>
            </div>

            <div className="border-b border-[#eef2f8] px-4 py-4 md:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#f3d2ae] to-[#cbac86]" />
                  <div>
                    <p className="font-semibold text-[#2b3b57]">Replacement Ear Pads</p>
                    <p className="text-xs text-[#8ca0bf]">SKU: REP-BLK &nbsp;&nbsp; Variant: Soft Leather</p>
                    <div className="mt-1 inline-flex items-center gap-2 text-xs text-[#8fa1c0]">
                      QTY <span className="rounded-md bg-[#f0f4fb] px-2 py-0.5 font-semibold text-[#607394]">2</span>
                    </div>
                  </div>
                </div>
                <p className="text-xl font-semibold text-[#2f3f5d]">$24.00</p>
              </div>
            </div>

            <div className="px-4 py-4 md:px-5">
              <div className="ml-auto max-w-[260px] space-y-2 text-sm">
                <div className="flex items-center justify-between text-[#6e80a0]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#3a4b69]">$347.00</span>
                </div>
                <div className="flex items-center justify-between text-[#6e80a0]">
                  <span>Shipping</span>
                  <span className="font-semibold text-[#3a4b69]">$0.00</span>
                </div>
                <div className="flex items-center justify-between text-[#6e80a0]">
                  <span>Tax (8%)</span>
                  <span className="font-semibold text-[#3a4b69]">$28.00</span>
                </div>
                <div className="border-t border-[#e5ebf5] pt-2">
                  <div className="flex items-center justify-between text-base">
                    <span className="font-semibold text-[#2c3c59]">Total</span>
                    <span className="font-bold text-[#4d9bff]">$375.00</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div className="space-y-4">
            <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8ea0bf]">Customer Details</h3>

              <div className="mt-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8eef8] text-sm font-bold text-[#7a8fb1]">JD</div>
                <div>
                  <p className="text-lg font-semibold text-[#2c3c59]">Jane Doe</p>
                  <p className="text-xs text-[#95a7c4]">Customer since 2021</p>
                </div>
              </div>

              <div className="mt-4 space-y-4 border-t border-[#ebf0f7] pt-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#95a7c4]">Email Address</p>
                  <p className="font-medium text-[#5a9dff]">jane.doe@example.com</p>
                </div>
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-[#95a7c4]">
                    <Phone className="h-3.5 w-3.5" />
                    Phone Number
                  </p>
                  <p className="font-medium text-[#3b4d6a]">+1 (555) 123-4567</p>
                </div>
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-[#95a7c4]">
                    <Truck className="h-3.5 w-3.5" />
                    Shipping Address
                  </p>
                  <p className="font-medium text-[#3b4d6a]">123 Maple Street</p>
                  <p className="font-medium text-[#3b4d6a]">Springfield, IL 62704</p>
                  <p className="font-medium text-[#3b4d6a]">United States</p>
                </div>
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-[#95a7c4]">
                    <Receipt className="h-3.5 w-3.5" />
                    Billing Address
                  </p>
                  <p className="font-medium text-[#3b4d6a]">Same as shipping address</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8ea0bf]">Internal Notes</h3>
              <div className="mt-3 flex items-center rounded-xl bg-[#f4f7fd] px-3 py-3">
                <input
                  className="w-full bg-transparent text-sm text-[#415170] outline-none placeholder:text-[#a3b1ca]"
                  placeholder="Add a note..."
                  type="text"
                />
                <button className="text-[#92a4c5]" type="button">
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
