import {
  ArrowLeftRight,
  Banknote,
  Building2,
  CheckCircle2,
  CircleAlert,
  FileText,
  Repeat2,
  Wallet,
} from "lucide-react";
import Link from "next/link";

function PlatformCard({
  title,
  amount,
  badge,
  badgeColor,
}: {
  title: string;
  amount: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <article className="rounded-2xl bg-[#1a2748] p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#1a2748]">●</div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8ea4cb]">{title}</p>
      <p className="mt-1 text-3xl font-semibold">{amount}</p>
    </article>
  );
}

function FeedItem({
  icon,
  title,
  sub,
  amount,
  time,
  amountTone,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  amount: string;
  time: string;
  amountTone: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-[#334863]">{title}</p>
          <p className="text-xs text-[#8ea0bf]">{sub}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${amountTone}`}>{amount}</p>
        <p className="text-[11px] text-[#9cadc8]">{time}</p>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(280px,1fr)]">
        <div className="space-y-4">
          <article className="rounded-2xl bg-gradient-to-r from-[#1a2748] via-[#1d2d56] to-[#1f356a] p-5 text-white shadow-[0_18px_45px_-30px_rgba(12,26,58,0.95)] md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8ea4cb]">Total Global Balance</p>
                <p className="mt-2 text-6xl font-bold tracking-tight">$12,450.80</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="rounded-full bg-[#0f5138] px-3 py-1 text-sm font-semibold text-[#5af7ac]">↗ +8.4%</span>
                  <span className="text-sm text-[#8ea4cb]">VS LAST WEEK</span>
                </div>
              </div>
              <Building2 className="h-12 w-12 text-[#3f557e]" />
            </div>
          </article>

          <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-5">
            <h2 className="text-2xl font-semibold text-[#1f2c44]">Wallet Balances</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PlatformCard title="TikTok Shop" amount="$8,100.50" badge="● Ready" badgeColor="bg-[#0d4f3d] text-[#5cf8c9]" />
              <PlatformCard title="Amazon Seller" amount="$4,200.00" badge="● Pending" badgeColor="bg-[#4d4216] text-[#ffcf57]" />
              <PlatformCard title="eBay Payout" amount="$1,940.00" badge="● Processing" badgeColor="bg-[#0f4d62] text-[#52dbff]" />
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl border border-[#dbe2ee] bg-white shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
            <div className="flex items-center justify-between border-b border-[#1fd7d4] bg-[#1a2748] px-4 py-3 text-white md:px-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Recent Activity</h3>
              <Link className="text-xs font-semibold text-[#1fd7d4]" href="/wallet/platform-details">
                View All
              </Link>
            </div>

            <div className="px-4 py-4 md:px-5">
              <div className="relative pl-8">
                <span className="absolute left-3 top-2 h-[86%] w-px bg-[#cfd9e9]" />
                <div className="relative mb-7 flex items-center justify-between">
                  <span className="absolute -left-[17px] inline-flex h-4 w-4 rounded-full border-4 border-[#06d9e7] bg-[#09142c]" />
                  <p className="text-sm font-medium text-[#5f7395]">Transfer initiated via ACH</p>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="text-[#58a6ff]">PROCESSING</span>
                    <Building2 className="h-4 w-4 text-[#9daecc]" />
                  </div>
                </div>

                <div className="relative mb-7 flex items-center justify-between">
                  <span className="absolute -left-[17px] inline-flex h-4 w-4 rounded-full bg-[#09142c]" />
                  <p className="text-sm font-medium text-[#5f7395]">Automatic monthly payout</p>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="text-[#f4a632]">SCHEDULED</span>
                    <Repeat2 className="h-4 w-4 text-[#9daecc]" />
                  </div>
                </div>

                <div className="relative flex items-center justify-between">
                  <span className="absolute -left-[17px] inline-flex h-4 w-4 rounded-full bg-[#09142c]" />
                  <p className="text-sm font-medium text-[#5f7395]">Manual withdrawal request</p>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="text-[#96a7c2]">PENDING</span>
                    <Wallet className="h-4 w-4 text-[#9daecc]" />
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-5">
            <h3 className="text-lg font-semibold uppercase tracking-wide text-[#1f2c44]">Recent Activity</h3>

            <div className="mt-4 space-y-4">
              <FeedItem
                icon={<CheckCircle2 className="h-4 w-4 text-[#4ddf9a]" />}
                title="Payout Received"
                sub="TIKTOK SHOP"
                amount="+$2,100.00"
                time="00:02:00"
                amountTone="text-[#4ddf9a]"
              />
              <FeedItem
                icon={<CircleAlert className="h-4 w-4 text-[#f97373]" />}
                title="Seller Fee"
                sub="AMAZON MARKET"
                amount="-$40.00"
                time="01:00:00"
                amountTone="text-[#8c9fbe]"
              />
              <FeedItem
                icon={<ArrowLeftRight className="h-4 w-4 text-[#5ea5ff]" />}
                title="FX Exchange"
                sub="USD → EUR"
                amount="$450.00"
                time="05:00:00"
                amountTone="text-[#55698e]"
              />
              <FeedItem
                icon={<CheckCircle2 className="h-4 w-4 text-[#4ddf9a]" />}
                title="eBay Sale"
                sub="ORDER #99281"
                amount="+$125.50"
                time="1D AGO"
                amountTone="text-[#4ddf9a]"
              />
              <FeedItem
                icon={<FileText className="h-4 w-4 text-[#9daecc]" />}
                title="Invoice Gen."
                sub="SERVICE FEE OCT"
                amount="VIEW"
                time="2D AGO"
                amountTone="text-[#8ea0bf]"
              />
            </div>

            <Link className="mt-6 block w-full rounded-xl bg-[#1a2748] py-3 text-center text-sm font-semibold text-[#2de0e3]" href="/wallet/transactions">
              VIEW FULL HISTORY
            </Link>
          </article>

          <article className="relative overflow-hidden rounded-2xl bg-[#35d3ce] p-5 text-[#0f3d57] shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
            <h3 className="text-3xl font-semibold text-white">Boost Your Sales</h3>
            <p className="mt-2 text-sm font-medium text-[#0f4f68]">Connect Shopify to see all your revenue streams in one place.</p>
            <button className="mt-4 rounded-lg bg-[#1a2748] px-4 py-2 text-sm font-semibold text-white" type="button">
              CONNECT STORE
            </button>
            <Banknote className="pointer-events-none absolute -bottom-3 right-2 h-20 w-20 text-[#67e8dd]/40" />
          </article>
        </aside>
      </div>
    </section>
  );
}
