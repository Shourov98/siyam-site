import { ArrowLeftRight, Clock3, CreditCard, ShoppingBag, SlidersHorizontal } from "lucide-react";

function TxnStatus({ label, tone }: { label: string; tone: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>;
}

function TxnRow({
  icon,
  title,
  status,
  statusTone,
  meta,
  source,
  amount,
  amountTone,
  rightHint,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
  statusTone: string;
  meta: string;
  source: string;
  amount: string;
  amountTone: string;
  rightHint: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#e4ebf6] bg-white px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f5fb] text-[#94a6c3]">{icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold text-[#2e3f5d]">{title}</p>
            <TxnStatus label={status} tone={statusTone} />
          </div>
          <p className="text-sm text-[#8ea0bf]">{meta} &nbsp; • &nbsp; {source}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-3xl font-bold ${amountTone}`}>{amount}</p>
        <p className="text-xs text-[#9aabc6]">{rightHint}</p>
      </div>
    </div>
  );
}

export default function WalletTransactionsPage() {
  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-4">
        <header className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-5 py-5 text-white">
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="mt-1 text-sm text-[#a9b8d6]">Viewing 25 of 1,024 transactions</p>
        </header>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex-1 border-t border-[#e1e8f4]" />
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-[#9aaac6]">Today, Oct 24</p>
            <div className="flex-1 border-t border-[#e1e8f4]" />
            <div className="ml-4 inline-flex items-center gap-2 text-sm font-semibold text-[#7e90af]">
              Sort by: <span className="text-[#2d3d5b]">Newest First</span> <span>⌄</span>
            </div>
          </div>

          <div className="space-y-3">
            <TxnRow
              icon={<ShoppingBag className="h-5 w-5" />}
              title="Nike Store Purchase"
              status="Completed"
              statusTone="bg-[#ddf7f0] text-[#56cbc2]"
              meta="10:42 AM • Order #39201"
              source="Shopify Store A"
              amount="+$120.00"
              amountTone="text-[#2f405d]"
              rightHint="Visa ending in 4242"
            />

            <TxnRow
              icon={<CreditCard className="h-5 w-5" />}
              title="AWS Server Cost"
              status="Pending"
              statusTone="bg-[#fff2d6] text-[#f4a632]"
              meta="09:15 AM • Inv #AWS-992"
              source="Corporate Card"
              amount="-$450.00"
              amountTone="text-[#2f405d]"
              rightHint="Mastercard ending 8812"
            />
          </div>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-[#e1e8f4]" />
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-[#9aaac6]">Yesterday, Oct 23</p>
            <div className="flex-1 border-t border-[#e1e8f4]" />
          </div>

          <div className="space-y-3">
            <TxnRow
              icon={<ArrowLeftRight className="h-5 w-5" />}
              title="Refund #9921"
              status="Processed"
              statusTone="bg-[#dce6ff] text-[#6a90ff]"
              meta="04:20 PM • Ref ID: 88291"
              source="Stripe"
              amount="-$50.00"
              amountTone="text-[#2f405d]"
              rightHint="Origin: Cust. Wallet"
            />

            <TxnRow
              icon={<SlidersHorizontal className="h-5 w-5" />}
              title="Logistics Fee"
              status="Completed"
              statusTone="bg-[#ddf7f0] text-[#56cbc2]"
              meta="02:10 PM • #AMZ-LOG-22"
              source="Amazon"
              amount="-$15.50"
              amountTone="text-[#2f405d]"
              rightHint="Balance Deduction"
            />

            <TxnRow
              icon={<ShoppingBag className="h-5 w-5" />}
              title="Adidas Runners"
              status="Completed"
              statusTone="bg-[#ddf7f0] text-[#56cbc2]"
              meta="11:30 AM • Order #39198"
              source="Shopify Store B"
              amount="+$210.00"
              amountTone="text-[#2f405d]"
              rightHint="Visa ending in 1102"
            />

            <div className="mt-8 rounded-2xl border border-[#e4ebf6] px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-12 w-12 rounded-full bg-[#edf2f8]" />
                  <div className="space-y-2">
                    <div className="h-4 w-36 rounded-full bg-[#edf2f8]" />
                    <div className="h-3 w-48 rounded-full bg-[#edf2f8]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 rounded-full bg-[#edf2f8]" />
                  <div className="h-3 w-28 rounded-full bg-[#edf2f8]" />
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="text-center text-xs text-[#9badc8]">
          <p className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" /> Synced a few seconds ago
          </p>
        </div>
      </div>
    </section>
  );
}
